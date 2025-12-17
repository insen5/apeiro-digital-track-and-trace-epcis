import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GenericQualityReportService } from '../generic-quality-report.service';

describe('GenericQualityReportService', () => {
  let service: GenericQualityReportService;
  let dataSource: jest.Mocked<DataSource>;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
      }),
      find: jest.fn(),
    };

    const mockMetadata = {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'isTest' },
      ],
    };

    dataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      getMetadata: jest.fn().mockReturnValue(mockMetadata),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenericQualityReportService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<GenericQualityReportService>(GenericQualityReportService);
  });

  describe('Product Quality Report', () => {
    it('should generate quality report for products', async () => {
      const mockProducts = [
        {
          id: 1,
          etcdProductId: 'PH001',
          gtin: '12345678901234',
          brandName: 'Product 1',
          manufacturers: [{ name: 'Mfr 1' }],
        },
        {
          id: 2,
          etcdProductId: 'PH002',
          gtin: null, // Missing GTIN
          brandName: 'Product 2',
          manufacturers: [],
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

      const report = await service.generateReport('product');

      expect(report.overview.totalRecords).toBe(2);
      expect(report.overview.dataQualityScore).toBeDefined();
      expect(report.completeness).toBeDefined();
      expect(report.validity).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should identify missing GTINs', async () => {
      const mockProducts = [
        { id: 1, gtin: '12345678901234', manufacturers: [] },
        { id: 2, gtin: null, manufacturers: [] },
        { id: 3, gtin: null, manufacturers: [] },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

      const report = await service.generateReport('product');

      expect(report.completeness.missingGtin).toBe(2);
    });

    it('should identify duplicate GTINs', async () => {
      const mockProducts = [
        { id: 1, gtin: '12345678901234', etcdProductId: 'PH001', manufacturers: [] },
        { id: 2, gtin: '12345678901234', etcdProductId: 'PH002', manufacturers: [] }, // Duplicate
        { id: 3, gtin: '98765432109876', etcdProductId: 'PH003', manufacturers: [] },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

      const report = await service.generateReport('product');

      expect(report.validity.duplicateGtins).toBe(1); // One duplicate pair
    });
  });

  describe('Premise Quality Report', () => {
    it('should generate quality report for premises', async () => {
      const mockPremises = [
        {
          id: 1,
          premiseId: 'PREMISE-123',
          premiseName: 'Premise 1',
          gln: '1234567890123',
          county: 'Nairobi',
          licenseValidUntil: new Date('2026-12-31'),
        },
        {
          id: 2,
          premiseId: 'PREMISE-124',
          premiseName: 'Premise 2',
          gln: null, // Missing GLN
          county: 'Mombasa',
          licenseValidUntil: null,
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockPremises);

      const report = await service.generateReport('premise');

      expect(report.overview.totalRecords).toBe(2);
      expect(report.completeness.missingGln).toBe(1);
      expect(report.completeness.missingLicenseInfo).toBe(1);
    });

    it('should identify expired licenses', async () => {
      const mockPremises = [
        {
          id: 1,
          premiseId: 'PREMISE-123',
          licenseValidUntil: new Date('2020-01-01'), // Expired
        },
        {
          id: 2,
          premiseId: 'PREMISE-124',
          licenseValidUntil: new Date('2026-12-31'), // Valid
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockPremises);

      const report = await service.generateReport('premise');

      expect(report.validity.expiredLicenses).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown entity type', async () => {
      await expect(service.generateReport('unknown')).rejects.toThrow('Unknown entity type for quality audit: unknown');
    });

    it('should handle empty dataset', async () => {
      mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);

      const report = await service.generateReport('product');

      expect(report.overview.totalRecords).toBe(0);
      expect(report.overview.dataQualityScore).toBe(0);
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations for critical issues', async () => {
      const mockProducts = Array(20).fill(null).map((_, i) => ({
        id: i + 1,
        etcdProductId: `PH${i.toString().padStart(3, '0')}`,
        gtin: null, // All missing GTIN (critical)
        manufacturers: [],
      }));

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

      const report = await service.generateReport('product');

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('CRITICAL'))).toBe(true);
    });
  });

  describe('Issues Array', () => {
    it('should build issues array for alerts', async () => {
      const mockProducts = [
        { id: 1, gtin: null, etcdProductId: 'PH001', manufacturers: [] },
        { id: 2, gtin: '12345678901234', etcdProductId: 'PH002', manufacturers: [] },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

      const report = await service.generateReport('product');

      expect(report.issues).toBeDefined();
      expect(Array.isArray(report.issues)).toBe(true);
      expect(report.issues.some(i => i.category === 'completeness')).toBe(true);
    });
  });
});
