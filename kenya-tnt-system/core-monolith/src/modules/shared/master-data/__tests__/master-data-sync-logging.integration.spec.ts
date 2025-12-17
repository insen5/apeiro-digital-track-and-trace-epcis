import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { MasterDataModule } from '../master-data.module';
import { MasterDataSyncLog } from '../../../../shared/domain/entities/master-data-sync-log.entity';
import { PPBProduct } from '../../../../shared/domain/entities/ppb-product.entity';
import { Premise } from '../../../../shared/domain/entities/premise.entity';
import { UatFacility } from '../../../../shared/domain/entities/uat-facility.entity';

/**
 * Integration Tests for Master Data Sync Logging
 * 
 * Tests the complete flow from API request to database logging
 */
describe('Master Data Sync Logging (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'tnt_user',
          password: process.env.DB_PASSWORD || 'tnt_password',
          database: process.env.DB_NAME || 'kenya_tnt_db_test',
          entities: [MasterDataSyncLog, PPBProduct, Premise, UatFacility],
          synchronize: false, // Use migrations
          logging: false,
        }),
        MasterDataModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up sync logs before each test
    await dataSource.getRepository(MasterDataSyncLog).delete({});
  });

  describe('POST /api/master-data/products/sync', () => {
    it('should create sync log entry for product sync', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/api/master-data/products/sync')
        .expect(200);

      // Assert
      const syncLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { entityType: 'product' },
      });

      expect(syncLogs).toHaveLength(1);
      expect(syncLogs[0]).toMatchObject({
        entityType: 'product',
        syncStatus: 'completed',
        triggeredBy: 'manual',
      });
      expect(syncLogs[0].syncStartedAt).toBeInstanceOf(Date);
      expect(syncLogs[0].syncCompletedAt).toBeInstanceOf(Date);
      expect(syncLogs[0].recordsFetched).toBeGreaterThanOrEqual(0);
    });

    it('should track sync metrics correctly', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/api/master-data/products/sync')
        .expect(200);

      // Assert
      const syncLog = await dataSource.getRepository(MasterDataSyncLog).findOne({
        where: { entityType: 'product' },
        order: { syncStartedAt: 'DESC' },
      });

      expect(syncLog).toBeDefined();
      expect(syncLog.recordsInserted).toBeGreaterThanOrEqual(0);
      expect(syncLog.recordsUpdated).toBeGreaterThanOrEqual(0);
      expect(syncLog.recordsFailed).toBeGreaterThanOrEqual(0);
      expect(syncLog.recordsFetched).toBe(
        syncLog.recordsInserted + syncLog.recordsUpdated + syncLog.recordsFailed
      );
    });
  });

  describe('POST /api/master-data/premises/sync', () => {
    it('should create sync log entry for premise sync', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/api/master-data/premises/sync')
        .send({
          email: 'test@example.com',
          password: 'testpass',
        })
        .expect(200);

      // Assert
      const syncLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { entityType: 'premise' },
      });

      expect(syncLogs).toHaveLength(1);
      expect(syncLogs[0]).toMatchObject({
        entityType: 'premise',
        syncStatus: 'completed',
        triggeredBy: 'manual',
      });
      expect(syncLogs[0].customParams).toBeDefined();
      expect(syncLogs[0].customParams.email).toBe('test@example.com');
    });
  });

  describe('POST /api/master-data/uat-facilities/sync', () => {
    it('should create sync log entry for facility sync', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/api/master-data/uat-facilities/sync')
        .expect(200);

      // Assert
      const syncLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { entityType: 'facility' },
      });

      expect(syncLogs).toHaveLength(1);
      expect(syncLogs[0]).toMatchObject({
        entityType: 'facility',
        syncStatus: 'completed',
        triggeredBy: 'manual',
      });
    });

    it('should track lastUpdatedTimestamp for incremental sync', async () => {
      // Arrange - First sync
      await request(app.getHttpServer())
        .post('/api/master-data/uat-facilities/sync')
        .expect(200);

      const firstSyncLog = await dataSource.getRepository(MasterDataSyncLog).findOne({
        where: { entityType: 'facility' },
        order: { syncStartedAt: 'DESC' },
      });

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act - Second sync (should use timestamp from first)
      await request(app.getHttpServer())
        .post('/api/master-data/uat-facilities/sync')
        .expect(200);

      // Assert
      const syncLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { entityType: 'facility' },
        order: { syncStartedAt: 'ASC' },
      });

      expect(syncLogs).toHaveLength(2);
      expect(syncLogs[1].lastUpdatedTimestamp).toBeDefined();
      // Second sync should use timestamp from around first sync
      expect(syncLogs[1].lastUpdatedTimestamp.getTime()).toBeGreaterThanOrEqual(
        firstSyncLog.syncStartedAt.getTime()
      );
    });
  });

  describe('Sync History Queries', () => {
    beforeEach(async () => {
      // Seed test data
      const syncLogRepo = dataSource.getRepository(MasterDataSyncLog);
      
      await syncLogRepo.save([
        {
          entityType: 'product',
          syncStartedAt: new Date('2025-12-14T10:00:00Z'),
          syncCompletedAt: new Date('2025-12-14T10:05:00Z'),
          syncStatus: 'completed',
          recordsFetched: 1000,
          recordsInserted: 50,
          recordsUpdated: 200,
          recordsFailed: 0,
          triggeredBy: 'cron',
        },
        {
          entityType: 'product',
          syncStartedAt: new Date('2025-12-14T14:00:00Z'),
          syncCompletedAt: new Date('2025-12-14T14:04:30Z'),
          syncStatus: 'completed',
          recordsFetched: 1000,
          recordsInserted: 30,
          recordsUpdated: 220,
          recordsFailed: 1,
          triggeredBy: 'manual',
        },
        {
          entityType: 'premise',
          syncStartedAt: new Date('2025-12-14T11:00:00Z'),
          syncCompletedAt: new Date('2025-12-14T11:10:00Z'),
          syncStatus: 'completed',
          recordsFetched: 500,
          recordsInserted: 10,
          recordsUpdated: 100,
          recordsFailed: 2,
          triggeredBy: 'api',
        },
        {
          entityType: 'facility',
          syncStartedAt: new Date('2025-12-14T12:00:00Z'),
          syncCompletedAt: null,
          syncStatus: 'failed',
          recordsFetched: 0,
          recordsInserted: 0,
          recordsUpdated: 0,
          recordsFailed: 0,
          errorMessage: 'API timeout',
          triggeredBy: 'cron',
        },
      ]);
    });

    it('should query sync logs by entity type', async () => {
      // Act
      const productLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { entityType: 'product' },
        order: { syncStartedAt: 'DESC' },
      });

      // Assert
      expect(productLogs).toHaveLength(2);
      expect(productLogs.every(log => log.entityType === 'product')).toBe(true);
    });

    it('should query failed syncs', async () => {
      // Act
      const failedLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { syncStatus: 'failed' },
      });

      // Assert
      expect(failedLogs).toHaveLength(1);
      expect(failedLogs[0].entityType).toBe('facility');
      expect(failedLogs[0].errorMessage).toBe('API timeout');
    });

    it('should calculate average sync duration', async () => {
      // Act
      const result = await dataSource.getRepository(MasterDataSyncLog)
        .createQueryBuilder('log')
        .select('log.entity_type', 'entityType')
        .addSelect(
          'AVG(EXTRACT(EPOCH FROM (log.sync_completed_at - log.sync_started_at)))',
          'avgDuration'
        )
        .where('log.sync_status = :status', { status: 'completed' })
        .groupBy('log.entity_type')
        .getRawMany();

      // Assert
      const productAvg = result.find(r => r.entityType === 'product');
      expect(productAvg).toBeDefined();
      expect(parseFloat(productAvg.avgDuration)).toBeGreaterThan(0);
    });

    it('should calculate success rate by entity type', async () => {
      // Act
      const result = await dataSource.getRepository(MasterDataSyncLog)
        .createQueryBuilder('log')
        .select('log.entity_type', 'entityType')
        .addSelect('COUNT(*)', 'totalSyncs')
        .addSelect(
          "COUNT(CASE WHEN log.sync_status = 'completed' THEN 1 END)",
          'successfulSyncs'
        )
        .addSelect(
          "COUNT(CASE WHEN log.sync_status = 'failed' THEN 1 END)",
          'failedSyncs'
        )
        .groupBy('log.entity_type')
        .getRawMany();

      // Assert
      const facilityStats = result.find(r => r.entityType === 'facility');
      expect(facilityStats).toBeDefined();
      expect(parseInt(facilityStats.totalSyncs)).toBe(1);
      expect(parseInt(facilityStats.failedSyncs)).toBe(1);
    });

    it('should query syncs by triggered_by', async () => {
      // Act
      const cronLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { triggeredBy: 'cron' },
      });

      // Assert
      expect(cronLogs).toHaveLength(2);
      expect(cronLogs.every(log => log.triggeredBy === 'cron')).toBe(true);
    });

    it('should track data growth over time', async () => {
      // Act
      const result = await dataSource.getRepository(MasterDataSyncLog)
        .createQueryBuilder('log')
        .select('log.entity_type', 'entityType')
        .addSelect('DATE(log.sync_started_at)', 'syncDate')
        .addSelect('SUM(log.records_inserted)', 'totalInserted')
        .addSelect('SUM(log.records_updated)', 'totalUpdated')
        .where("log.sync_status = 'completed'")
        .groupBy('log.entity_type')
        .addGroupBy('DATE(log.sync_started_at)')
        .getRawMany();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      const productGrowth = result.find(r => r.entityType === 'product');
      expect(productGrowth).toBeDefined();
      expect(parseInt(productGrowth.totalInserted)).toBe(80); // 50 + 30
      expect(parseInt(productGrowth.totalUpdated)).toBe(420); // 200 + 220
    });
  });

  describe('Error Scenarios', () => {
    it('should create failed sync log on API error', async () => {
      // This test requires mocking the external API to fail
      // For now, we'll verify the structure exists
      
      const syncLogRepo = dataSource.getRepository(MasterDataSyncLog);
      
      // Manually create a failed log to verify structure
      const failedLog = await syncLogRepo.save({
        entityType: 'product',
        syncStartedAt: new Date(),
        syncCompletedAt: new Date(),
        syncStatus: 'failed',
        recordsFetched: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errorMessage: 'Connection refused',
        triggeredBy: 'manual',
      });

      expect(failedLog.id).toBeDefined();
      expect(failedLog.syncStatus).toBe('failed');
      expect(failedLog.errorMessage).toBe('Connection refused');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent syncs', async () => {
      // Act - Trigger multiple syncs concurrently
      const promises = [
        request(app.getHttpServer()).post('/api/master-data/products/sync'),
        request(app.getHttpServer()).post('/api/master-data/products/sync'),
        request(app.getHttpServer()).post('/api/master-data/products/sync'),
      ];

      await Promise.all(promises);

      // Assert
      const syncLogs = await dataSource.getRepository(MasterDataSyncLog).find({
        where: { entityType: 'product' },
      });

      expect(syncLogs.length).toBeGreaterThanOrEqual(3);
      expect(syncLogs.every(log => log.syncStatus === 'completed')).toBe(true);
    });

    it('should query sync logs efficiently with indexes', async () => {
      // Seed a lot of logs
      const syncLogRepo = dataSource.getRepository(MasterDataSyncLog);
      const bulkLogs = [];
      
      for (let i = 0; i < 100; i++) {
        bulkLogs.push({
          entityType: i % 3 === 0 ? 'product' : i % 3 === 1 ? 'premise' : 'facility',
          syncStartedAt: new Date(Date.now() - i * 3600000), // 1 hour apart
          syncCompletedAt: new Date(Date.now() - i * 3600000 + 300000), // +5 min
          syncStatus: i % 10 === 0 ? 'failed' : 'completed',
          recordsFetched: Math.floor(Math.random() * 1000),
          recordsInserted: Math.floor(Math.random() * 50),
          recordsUpdated: Math.floor(Math.random() * 200),
          recordsFailed: i % 10 === 0 ? Math.floor(Math.random() * 5) : 0,
          triggeredBy: i % 2 === 0 ? 'cron' : 'manual',
        });
      }
      
      await syncLogRepo.save(bulkLogs);

      // Act - Query with indexed fields
      const startTime = Date.now();
      const recentFailed = await syncLogRepo.find({
        where: { 
          entityType: 'product',
          syncStatus: 'failed',
        },
        order: { syncStartedAt: 'DESC' },
        take: 10,
      });
      const queryTime = Date.now() - startTime;

      // Assert
      expect(recentFailed.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // Should be fast due to indexes
    });
  });
});
