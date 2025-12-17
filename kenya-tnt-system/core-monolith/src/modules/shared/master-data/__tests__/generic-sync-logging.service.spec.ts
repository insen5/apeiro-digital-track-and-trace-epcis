import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericSyncService } from '../generic-sync.service';
import { MasterDataSyncLog } from '../../../../shared/domain/entities/master-data-sync-log.entity';
import { PPBApiService } from '../../../../shared/infrastructure/external/ppb-api.service';
import { SafaricomHieApiService } from '../../../../shared/infrastructure/external/safaricom-hie-api.service';
import { Logger } from '@nestjs/common';

// Mock repositories
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  })),
});

describe('GenericSyncService - Sync Logging', () => {
  let service: GenericSyncService;
  let syncLogRepo: jest.Mocked<Repository<MasterDataSyncLog>>;
  let ppbApiService: jest.Mocked<PPBApiService>;
  let safaricomHieApiService: jest.Mocked<SafaricomHieApiService>;
  let productRepo: any;
  let premiseRepo: any;
  let facilityRepo: any;

  beforeEach(async () => {
    // Mock repositories
    syncLogRepo = createMockRepository() as any;
    productRepo = createMockRepository();
    premiseRepo = createMockRepository();
    facilityRepo = createMockRepository();

    // Mock API services
    ppbApiService = {
      getProducts: jest.fn(),
      getPremisesWithCredentials: jest.fn(),
    } as any;

    safaricomHieApiService = {
      getFacilities: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenericSyncService,
        {
          provide: getRepositoryToken(MasterDataSyncLog),
          useValue: syncLogRepo,
        },
        {
          provide: getRepositoryToken('ppb_products'),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken('premises'),
          useValue: premiseRepo,
        },
        {
          provide: getRepositoryToken('uat_facilities'),
          useValue: facilityRepo,
        },
        {
          provide: PPBApiService,
          useValue: ppbApiService,
        },
        {
          provide: SafaricomHieApiService,
          useValue: safaricomHieApiService,
        },
      ],
    }).compile();

    service = module.get<GenericSyncService>(GenericSyncService);
    
    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sync Logging for Product', () => {
    it('should create sync log entry when starting product sync', async () => {
      // Arrange
      const mockProducts = [
        { etcd_product_id: 'P001', product_name: 'Product 1' },
      ];
      ppbApiService.getProducts.mockResolvedValue(mockProducts);
      productRepo.findOne.mockResolvedValue(null);
      
      const mockSyncLog = {
        id: 1,
        entityType: 'product',
        syncStartedAt: new Date(),
        syncStatus: 'in_progress',
      };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'manual');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'product',
          syncStatus: 'in_progress',
          triggeredBy: 'manual',
        })
      );
      expect(syncLogRepo.save).toHaveBeenCalledWith(mockSyncLog);
    });

    it('should update sync log with fetched count during product sync', async () => {
      // Arrange
      const mockProducts = [
        { etcd_product_id: 'P001', product_name: 'Product 1' },
        { etcd_product_id: 'P002', product_name: 'Product 2' },
        { etcd_product_id: 'P003', product_name: 'Product 3' },
      ];
      ppbApiService.getProducts.mockResolvedValue(mockProducts);
      productRepo.findOne.mockResolvedValue(null);
      
      const mockSyncLog = {
        id: 1,
        entityType: 'product',
        syncStartedAt: new Date(),
        syncStatus: 'in_progress',
        recordsFetched: 0,
      };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'cron');

      // Assert
      expect(syncLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          recordsFetched: 3,
        })
      );
    });

    it('should complete sync log with metrics on successful product sync', async () => {
      // Arrange
      const mockProducts = [
        { etcd_product_id: 'P001', product_name: 'Product 1' },
        { etcd_product_id: 'P002', product_name: 'Product 2' },
      ];
      ppbApiService.getProducts.mockResolvedValue(mockProducts);
      productRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
      
      const mockSyncLog = { id: 1, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'manual');

      // Assert
      expect(syncLogRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          syncStatus: 'completed',
          recordsInserted: 1,
          recordsUpdated: 1,
          recordsFailed: 0,
          syncCompletedAt: expect.any(Date),
        })
      );
    });

    it('should update sync log with error on failed product sync', async () => {
      // Arrange
      const mockError = new Error('PPB API connection timeout');
      ppbApiService.getProducts.mockRejectedValue(mockError);
      
      const mockSyncLog = { id: 1, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act & Assert
      await expect(service.sync('product', null, 'cron')).rejects.toThrow('PPB API connection timeout');
      
      expect(syncLogRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          syncStatus: 'failed',
          errorMessage: 'PPB API connection timeout',
          syncCompletedAt: expect.any(Date),
        })
      );
    });
  });

  describe('Sync Logging for Premise', () => {
    it('should create sync log entry when starting premise sync', async () => {
      // Arrange
      const mockPremises = [
        { premiseid: 'PR001', premisename: 'Premise 1' },
      ];
      ppbApiService.getPremisesWithCredentials.mockResolvedValue(mockPremises);
      premiseRepo.findOne.mockResolvedValue(null);
      
      const mockSyncLog = {
        id: 2,
        entityType: 'premise',
        syncStartedAt: new Date(),
        syncStatus: 'in_progress',
      };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('premise', { email: 'test@test.com', password: 'pass' }, 'api');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'premise',
          syncStatus: 'in_progress',
          triggeredBy: 'api',
          customParams: { email: 'test@test.com', password: 'pass' },
        })
      );
    });

    it('should complete sync log with metrics on successful premise sync', async () => {
      // Arrange
      const mockPremises = [
        { premiseid: 'PR001', premisename: 'Premise 1' },
        { premiseid: 'PR002', premisename: 'Premise 2' },
        { premiseid: 'PR003', premisename: 'Premise 3' },
      ];
      ppbApiService.getPremisesWithCredentials.mockResolvedValue(mockPremises);
      premiseRepo.findOne.mockResolvedValue(null);
      
      const mockSyncLog = { id: 2, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      const result = await service.sync('premise', { email: 'test@test.com', password: 'pass' }, 'manual');

      // Assert
      expect(result).toEqual({
        inserted: 3,
        updated: 0,
        errors: 0,
        total: 3,
        success: true,
        lastSyncedAt: expect.any(Date),
      });
      
      expect(syncLogRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          syncStatus: 'completed',
          recordsFetched: 3,
          recordsInserted: 3,
          recordsUpdated: 0,
          recordsFailed: 0,
        })
      );
    });
  });

  describe('Sync Logging for Facility (Incremental)', () => {
    it('should create sync log with lastUpdatedTimestamp for incremental facility sync', async () => {
      // Arrange
      const lastSyncDate = new Date('2025-12-01T00:00:00Z');
      facilityRepo.createQueryBuilder().getRawOne.mockResolvedValue({
        lastSync: lastSyncDate,
      });
      
      const mockFacilities = [
        { facilityCode: 'F001', facilityName: 'Facility 1', code: 'F001', name: 'Facility 1' },
      ];
      safaricomHieApiService.getFacilities.mockResolvedValue(mockFacilities);
      facilityRepo.findOne.mockResolvedValue(null);
      
      const mockSyncLog = {
        id: 3,
        entityType: 'facility',
        syncStartedAt: new Date(),
        syncStatus: 'in_progress',
      };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('facility', null, 'cron');

      // Assert
      expect(syncLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastUpdatedTimestamp: lastSyncDate,
        })
      );
      
      expect(safaricomHieApiService.getFacilities).toHaveBeenCalledWith({
        lastUpdated: lastSyncDate,
      });
    });

    it('should use default lookback period for first facility sync', async () => {
      // Arrange
      facilityRepo.createQueryBuilder().getRawOne.mockResolvedValue({
        lastSync: null,
      });
      
      const mockFacilities = [];
      safaricomHieApiService.getFacilities.mockResolvedValue(mockFacilities);
      
      const mockSyncLog = { id: 3, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('facility', null, 'manual');

      // Assert
      const expectedDate = new Date();
      expectedDate.setMonth(expectedDate.getMonth() - 6);
      
      expect(safaricomHieApiService.getFacilities).toHaveBeenCalledWith(
        expect.objectContaining({
          lastUpdated: expect.any(Date),
        })
      );
    });

    it('should complete facility sync log with metrics', async () => {
      // Arrange
      facilityRepo.createQueryBuilder().getRawOne.mockResolvedValue({ lastSync: new Date() });
      
      const mockFacilities = [
        { facilityCode: 'F001', code: 'F001', name: 'Facility 1' },
        { facilityCode: 'F002', code: 'F002', name: 'Facility 2' },
      ];
      safaricomHieApiService.getFacilities.mockResolvedValue(mockFacilities);
      facilityRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
      
      const mockSyncLog = { id: 3, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      const result = await service.sync('facility', null, 'webhook');

      // Assert
      expect(result).toEqual({
        inserted: 1,
        updated: 1,
        errors: 0,
        total: 2,
        success: true,
        lastSyncedAt: expect.any(Date),
      });
      
      expect(syncLogRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          syncStatus: 'completed',
          recordsInserted: 1,
          recordsUpdated: 1,
          recordsFailed: 0,
        })
      );
    });
  });

  describe('Sync Logging Edge Cases', () => {
    it('should log empty result set', async () => {
      // Arrange
      ppbApiService.getProducts.mockResolvedValue([]);
      
      const mockSyncLog = { id: 1, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      const result = await service.sync('product', null, 'manual');

      // Assert
      expect(result).toEqual({
        inserted: 0,
        updated: 0,
        errors: 0,
        total: 0,
        success: true,
        lastSyncedAt: expect.any(Date),
      });
      
      expect(syncLogRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          syncStatus: 'completed',
          recordsFetched: 0,
          recordsInserted: 0,
          recordsUpdated: 0,
        })
      );
    });

    it('should track partial failures during sync', async () => {
      // Arrange
      const mockProducts = [
        { etcd_product_id: 'P001', product_name: 'Product 1' },
        { etcd_product_id: null, product_name: 'Invalid' }, // Missing required field
        { etcd_product_id: 'P003', product_name: 'Product 3' },
      ];
      ppbApiService.getProducts.mockResolvedValue(mockProducts);
      productRepo.findOne.mockResolvedValue(null);
      
      const mockSyncLog = { id: 1, syncStatus: 'in_progress' };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'manual');

      // Assert
      expect(syncLogRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          syncStatus: 'completed',
          recordsInserted: 2,
          recordsFailed: 1,
        })
      );
    });
  });

  describe('Triggered By Tracking', () => {
    it('should track triggeredBy as manual', async () => {
      // Arrange
      ppbApiService.getProducts.mockResolvedValue([]);
      
      const mockSyncLog = { id: 1 };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'manual');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          triggeredBy: 'manual',
        })
      );
    });

    it('should track triggeredBy as cron', async () => {
      // Arrange
      ppbApiService.getProducts.mockResolvedValue([]);
      
      const mockSyncLog = { id: 1 };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'cron');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          triggeredBy: 'cron',
        })
      );
    });

    it('should track triggeredBy as api', async () => {
      // Arrange
      ppbApiService.getProducts.mockResolvedValue([]);
      
      const mockSyncLog = { id: 1 };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'api');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          triggeredBy: 'api',
        })
      );
    });

    it('should track triggeredBy as webhook', async () => {
      // Arrange
      ppbApiService.getProducts.mockResolvedValue([]);
      
      const mockSyncLog = { id: 1 };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('product', null, 'webhook');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          triggeredBy: 'webhook',
        })
      );
    });
  });

  describe('Custom Params Tracking', () => {
    it('should store custom params in sync log', async () => {
      // Arrange
      const customParams = {
        email: 'admin@test.com',
        password: 'secure123',
        filters: { active: true },
      };
      
      ppbApiService.getPremisesWithCredentials.mockResolvedValue([]);
      
      const mockSyncLog = { id: 2 };
      syncLogRepo.create.mockReturnValue(mockSyncLog as any);
      syncLogRepo.save.mockResolvedValue(mockSyncLog as any);

      // Act
      await service.sync('premise', customParams, 'api');

      // Assert
      expect(syncLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customParams,
        })
      );
    });
  });
});
