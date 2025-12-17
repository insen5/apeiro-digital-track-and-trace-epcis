import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { GenericQualityReportService } from '../generic-quality-report.service';
import { getQualityAuditConfig } from '../quality-audit.config';

describe('GenericQualityReportService - Product Report', () => {
  let service: GenericQualityReportService;
  let dataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<any>>;

  beforeEach(async () => {
    mockRepository = {
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        getRawOne: jest.fn(),
        getMany: jest.fn(),
        getCount: jest.fn(),
      })),
    } as any;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      getMetadata: jest.fn(() => ({
        columns: [{ propertyName: 'isTest' }],
      })),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenericQualityReportService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<GenericQualityReportService>(GenericQualityReportService);
  });

  describe('Product Quality Report Generation', () => {
    it('should generate complete product quality report with all sections', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          brandName: 'Test Brand',
          genericName: 'Generic Test',
          ppbRegistrationCode: 'PPB123',
          category: 'Pharmaceutical',
          strengthAmount: '500',
          strengthUnit: 'mg',
          routeDescription: 'Oral',
          formDescription: 'Tablet',
          manufacturers: ['Manufacturer A'],
          etcdProductId: 'PROD001',
          lastSyncedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          kemlIsOnKeml: true,
          levelOfUse: 'Level 1',
        },
        {
          id: 2,
          gtin: null, // Missing GTIN
          brandName: 'Test Brand 2',
          genericName: null, // Missing generic name
          ppbRegistrationCode: 'PPB456',
          category: 'Pharmaceutical',
          manufacturers: [],
          etcdProductId: 'PROD002',
          lastSyncedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          kemlIsOnKeml: false,
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({
        lastSync: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      });

      // Mock distribution queries
      mockRepository.createQueryBuilder().getRawMany
        .mockResolvedValueOnce([
          { value: 'Pharmaceutical', count: '2' },
        ]) // byCategory
        .mockResolvedValueOnce([
          { value: 'Level 1', count: '1' },
        ]); // byLevelOfUse

      mockRepository.createQueryBuilder().getCount
        .mockResolvedValueOnce(1) // kemlIsOnKeml true count
        .mockResolvedValueOnce(2); // total count for kemlIsOnKeml

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report).toBeDefined();
      expect(report.overview).toBeDefined();
      expect(report.overview.totalRecords).toBe(2);
      expect(report.overview.lastSyncDate).toBeDefined();
      expect(report.overview.dataQualityScore).toBeGreaterThan(0);

      expect(report.completeness).toBeDefined();
      expect(report.completeness.missingGtin).toBe(1);
      expect(report.completeness.missingGenericName).toBe(1);
      expect(report.completeness.missingManufacturer).toBe(1);

      expect(report.validity).toBeDefined();
      expect(report.distribution).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(Array.isArray(report.issues)).toBe(true);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should calculate timeliness score correctly for fresh data (< 14 days)', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
          lastSyncedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({
        lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert - Timeliness score should be 100 (< 14 days = 336 hours)
      expect(report.overview.dataQualityScore).toBeGreaterThan(90);
      expect(report.issues.find((i: any) => i.category === 'Timeliness')).toBeUndefined();
    });

    it('should calculate timeliness score correctly for stale data (> 14 days)', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
          lastSyncedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({
        lastSync: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert - Should have timeliness issue
      const timelinessIssue = report.issues.find((i: any) => i.category === 'Timeliness');
      expect(timelinessIssue).toBeDefined();
      expect(timelinessIssue.severity).toBe('medium');
    });

    it('should calculate timeliness score correctly for critically stale data (> 60 days)', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
          lastSyncedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({
        lastSync: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
      });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert - Should have high severity timeliness issue
      const timelinessIssue = report.issues.find((i: any) => i.category === 'Timeliness');
      expect(timelinessIssue).toBeDefined();
      expect(timelinessIssue.severity).toBe('high');
      expect(timelinessIssue.description).toContain('stale');
    });
  });

  describe('Distribution Analysis', () => {
    it('should generate distribution by category', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          category: 'Pharmaceutical',
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
        },
        {
          id: 2,
          gtin: '2234567890123',
          category: 'Pharmaceutical',
          manufacturers: ['Test'],
          etcdProductId: 'PROD002',
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: new Date() });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
        { value: 'Pharmaceutical', count: '2' },
      ]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report.distribution).toBeDefined();
      expect(report.distribution.byCategory).toBeDefined();
      expect(Array.isArray(report.distribution.byCategory)).toBe(true);
    });

    it('should generate distribution by KEML status (boolean)', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          kemlIsOnKeml: true,
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
        },
        {
          id: 2,
          gtin: '2234567890123',
          kemlIsOnKeml: false,
          manufacturers: ['Test'],
          etcdProductId: 'PROD002',
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: new Date() });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      
      // Mock boolean distribution
      mockRepository.createQueryBuilder().getCount
        .mockResolvedValueOnce(1) // true count
        .mockResolvedValueOnce(2); // total count

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report.distribution).toBeDefined();
      expect(report.distribution.byKemlStatus).toBeDefined();
      expect(report.distribution.byKemlStatus.onKeml).toBe(1);
      expect(report.distribution.byKemlStatus.notOnKeml).toBe(1);
    });

    it('should generate distribution by level of use with filter', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          levelOfUse: 'Level 1',
          kemlIsOnKeml: true,
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: new Date() });
      mockRepository.createQueryBuilder().getRawMany
        .mockResolvedValueOnce([]) // byCategory
        .mockResolvedValueOnce([{ value: 'Level 1', count: '1' }]); // byLevelOfUse
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report.distribution).toBeDefined();
      expect(report.distribution.byLevelOfUse).toBeDefined();
      expect(Array.isArray(report.distribution.byLevelOfUse)).toBe(true);
    });
  });

  describe('Issues and Recommendations', () => {
    it('should identify missing GTIN as high severity issue', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: null,
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
        },
        {
          id: 2,
          gtin: '1234567890123',
          manufacturers: ['Test'],
          etcdProductId: 'PROD002',
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: new Date() });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert
      const gtinIssue = report.issues.find((i: any) => i.description.includes('Missing GTIN'));
      expect(gtinIssue).toBeDefined();
      expect(gtinIssue.severity).toBe('high');
      expect(gtinIssue.count).toBe(1);
    });

    it('should generate recommendations for critical issues', async () => {
      // Arrange
      const mockProducts = Array(20).fill(null).map((_, i) => ({
        id: i,
        gtin: i < 5 ? null : `${i}234567890123`, // 25% missing GTIN (> 10% threshold)
        manufacturers: i < 3 ? [] : ['Test'],
        etcdProductId: `PROD${i}`,
      }));

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: new Date() });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      const gtinRecommendation = report.recommendations.find((r: string) => 
        r.includes('Missing GTIN')
      );
      expect(gtinRecommendation).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product catalog', async () => {
      // Arrange
      mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: null });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report.overview.totalRecords).toBe(0);
      expect(report.overview.dataQualityScore).toBe(0);
    });

    it('should handle products with no last sync date', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          gtin: '1234567890123',
          manufacturers: ['Test'],
          etcdProductId: 'PROD001',
          lastSyncedAt: null,
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: null });
      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);
      mockRepository.createQueryBuilder().getCount.mockResolvedValue(0);

      // Act
      const report = await service.generateReport('product');

      // Assert
      expect(report.overview.lastSyncDate).toBeNull();
      expect(report.overview.dataQualityScore).toBeGreaterThanOrEqual(0);
    });
  });
});
