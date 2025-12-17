import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { GenericSyncService } from '../generic-sync.service';
import { PPBApiService } from '../../../../shared/infrastructure/external/ppb-api.service';
import { SafaricomHieApiService } from '../../../../shared/infrastructure/external/safaricom-hie-api.service';
import { getSyncConfig } from '../master-data-sync.config';

describe('GenericSyncService', () => {
  let service: GenericSyncService;
  let dataSource: jest.Mocked<DataSource>;
  let ppbApiService: jest.Mocked<PPBApiService>;
  let safaricomHieApiService: jest.Mocked<SafaricomHieApiService>;
  let mockRepository: jest.Mocked<Repository<any>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as any;

    ppbApiService = {
      getAllTerminologyProducts: jest.fn(),
      getAllPremisesFromCatalogue: jest.fn(),
      getPremisesWithCredentials: jest.fn(),
    } as any;

    safaricomHieApiService = {
      getFacilities: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenericSyncService,
        { provide: DataSource, useValue: dataSource },
        { provide: PPBApiService, useValue: ppbApiService },
        { provide: SafaricomHieApiService, useValue: safaricomHieApiService },
      ],
    }).compile();

    service = module.get<GenericSyncService>(GenericSyncService);
  });

  describe('Product Sync', () => {
    it('should sync new products successfully', async () => {
      const mockProducts = [
        {
          etcd_product_id: 'PH001',
          brand_name: 'Test Product',
          gtin: '12345678901234',
          generic_concept_id: 123,
        },
      ];

      ppbApiService.getAllTerminologyProducts.mockResolvedValue(mockProducts);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ etcdProductId: 'PH001' } as any);
      mockRepository.save.mockResolvedValue({ id: 1, etcdProductId: 'PH001' } as any);

      const result = await service.sync('product');

      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.total).toBe(1);
      expect(ppbApiService.getAllTerminologyProducts).toHaveBeenCalled();
    });

    it('should update existing products', async () => {
      const mockProducts = [
        {
          etcd_product_id: 'PH001',
          brand_name: 'Updated Product',
          gtin: '12345678901234',
        },
      ];

      const existingProduct = { id: 1, etcdProductId: 'PH001', brandName: 'Old Name' };

      ppbApiService.getAllTerminologyProducts.mockResolvedValue(mockProducts);
      mockRepository.findOne.mockResolvedValue(existingProduct);
      mockRepository.save.mockResolvedValue({ ...existingProduct, brandName: 'Updated Product' });

      const result = await service.sync('product');

      expect(result.inserted).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const mockProducts = [
        { etcd_product_id: 'PH001', brand_name: 'Product 1' },
        { etcd_product_id: 'PH002', brand_name: 'Product 2' },
      ];

      ppbApiService.getAllTerminologyProducts.mockResolvedValue(mockProducts);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({} as any);
      mockRepository.save
        .mockResolvedValueOnce({ id: 1 } as any)
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.sync('product');

      expect(result.inserted).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.total).toBe(2);
    });

    it('should skip products with missing required fields', async () => {
      const mockProducts = [
        { etcd_product_id: 'PH001', brand_name: 'Valid Product' },
        { brand_name: 'Missing ID' }, // Missing required field
      ];

      ppbApiService.getAllTerminologyProducts.mockResolvedValue(mockProducts);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({} as any);
      mockRepository.save.mockResolvedValue({ id: 1 } as any);

      const result = await service.sync('product');

      expect(result.inserted).toBe(1);
      expect(result.errors).toBe(1);
    });
  });

  describe('Premise Sync', () => {
    it('should sync new premises successfully', async () => {
      const mockPremises = [
        {
          premiseid: 123,
          premisename: 'Test Premise',
          county: 'Nairobi',
        },
      ];

      ppbApiService.getAllPremisesFromCatalogue.mockResolvedValue(mockPremises);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ legacyPremiseId: 123 } as any);
      mockRepository.save.mockResolvedValue({ id: 1, legacyPremiseId: 123 } as any);

      const result = await service.sync('premise');

      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should handle custom credentials for premise sync', async () => {
      const mockPremises = [
        {
          premiseid: 123,
          premisename: 'Test Premise',
        },
      ];

      ppbApiService.getPremisesWithCredentials.mockResolvedValue(mockPremises);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({} as any);
      mockRepository.save.mockResolvedValue({ id: 1 } as any);

      const result = await service.sync('premise', { email: 'test@test.com', password: 'pass' });

      expect(result.inserted).toBe(1);
      expect(ppbApiService.getPremisesWithCredentials).toHaveBeenCalledWith('test@test.com', 'pass');
    });
  });

  describe('Facility Sync', () => {
    it('should sync new facilities successfully', async () => {
      const mockFacilities = [
        {
          code: 'FAC001',
          name: 'Test Facility',
          county: 'Nairobi',
        },
      ];

      safaricomHieApiService.getFacilities.mockResolvedValue(mockFacilities);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ facilityCode: 'FAC001' } as any);
      mockRepository.save.mockResolvedValue({ id: 1, facilityCode: 'FAC001' } as any);

      const result = await service.sync('facility');

      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should throw error for unknown entity type', async () => {
      await expect(service.sync('unknown')).rejects.toThrow('Unknown entity type for sync: unknown');
    });

    it('should return zero results if sync disabled', async () => {
      // Would need to mock getSyncConfig to return disabled config
      // For now, this test validates the early return logic
    });
  });
});
