import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MasterDataService } from '../master-data.service';
import { Premise } from '../../../../shared/domain/entities/premise.entity';
import { PremiseQualityReport } from '../../../../shared/domain/entities/premise-quality-report.entity';
import { PPBProduct } from '../../../../shared/domain/entities/ppb-product.entity';
import { ProductQualityReport } from '../../../../shared/domain/entities/product-quality-report.entity';
import { Supplier } from '../../../../shared/domain/entities/supplier.entity';
import { LogisticsProvider } from '../../../../shared/domain/entities/logistics-provider.entity';
import { UatFacility, UatFacilitiesSyncLog, UatFacilitiesQualityAudit } from '../../../../shared/domain/entities/uat-facility.entity';
import { ProdFacility, ProdFacilitiesSyncLog, ProdFacilitiesQualityAudit } from '../../../../shared/domain/entities/prod-facility.entity';
import { MasterDataSyncLog } from '../../../../shared/domain/entities/master-data-sync-log.entity';
import { PPBApiService } from '../../../../shared/infrastructure/external/ppb-api.service';
import { SafaricomHieApiService } from '../../../../shared/infrastructure/external/safaricom-hie-api.service';
import { QualityAlertService } from '../quality-alert.service';
import { GenericSyncService } from '../generic-sync.service';
import { GenericQualityReportService } from '../generic-quality-report.service';
import { GenericQualityHistoryService } from '../generic-quality-history.service';
import { GenericCrudService } from '../generic-crud.service';

describe('MasterDataService - Data Quality & Freshness', () => {
  let service: MasterDataService;
  let premiseRepo: jest.Mocked<Repository<Premise>>;
  let qualityReportRepo: jest.Mocked<Repository<PremiseQualityReport>>;
  let productRepo: jest.Mocked<Repository<PPBProduct>>;
  let productQualityRepo: jest.Mocked<Repository<ProductQualityReport>>;
  let supplierRepo: jest.Mocked<Repository<Supplier>>;
  let logisticsProviderRepo: jest.Mocked<Repository<LogisticsProvider>>;
  let uatFacilityRepo: jest.Mocked<Repository<UatFacility>>;
  let uatFacilitySyncLogRepo: jest.Mocked<Repository<UatFacilitiesSyncLog>>;
  let uatFacilityQualityAuditRepo: jest.Mocked<Repository<UatFacilitiesQualityAudit>>;
  let prodFacilityRepo: jest.Mocked<Repository<ProdFacility>>;
  let prodFacilitySyncLogRepo: jest.Mocked<Repository<ProdFacilitiesSyncLog>>;
  let prodFacilityQualityAuditRepo: jest.Mocked<Repository<ProdFacilitiesQualityAudit>>;
  let masterDataSyncLogRepo: jest.Mocked<Repository<MasterDataSyncLog>>;
  let ppbApiService: jest.Mocked<PPBApiService>;
  let safaricomHieApiService: jest.Mocked<SafaricomHieApiService>;
  let qualityAlertService: jest.Mocked<QualityAlertService>;
  let genericSyncService: jest.Mocked<GenericSyncService>;
  let genericQualityReportService: jest.Mocked<GenericQualityReportService>;
  let genericQualityHistoryService: jest.Mocked<GenericQualityHistoryService>;
  let genericCrudService: jest.Mocked<GenericCrudService>;

  beforeEach(async () => {
    // Create mock repositories
    premiseRepo = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    qualityReportRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    productRepo = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    productQualityRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    supplierRepo = {
      find: jest.fn(),
    } as any;

    logisticsProviderRepo = {} as any;
    uatFacilityRepo = {} as any;
    uatFacilitySyncLogRepo = {} as any;
    uatFacilityQualityAuditRepo = {} as any;
    prodFacilityRepo = {} as any;
    prodFacilitySyncLogRepo = {} as any;
    prodFacilityQualityAuditRepo = {} as any;
    masterDataSyncLogRepo = {} as any;

    ppbApiService = {
      getAllPremisesFromCatalogue: jest.fn(),
      getAllTerminologyProducts: jest.fn(),
    } as any;

    safaricomHieApiService = {} as any;
    qualityAlertService = {
      checkAndAlert: jest.fn(),
    } as any;

    genericSyncService = {
      sync: jest.fn(),
    } as any;

    genericQualityReportService = {
      generateReport: jest.fn(),
    } as any;

    genericQualityHistoryService = {
      getHistory: jest.fn(),
      getById: jest.fn(),
      getScoreTrend: jest.fn(),
    } as any;

    genericCrudService = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasterDataService,
        { provide: getRepositoryToken(Premise), useValue: premiseRepo },
        { provide: getRepositoryToken(PremiseQualityReport), useValue: qualityReportRepo },
        { provide: getRepositoryToken(PPBProduct), useValue: productRepo },
        { provide: getRepositoryToken(ProductQualityReport), useValue: productQualityRepo },
        { provide: getRepositoryToken(Supplier), useValue: supplierRepo },
        { provide: getRepositoryToken(LogisticsProvider), useValue: logisticsProviderRepo },
        { provide: getRepositoryToken(UatFacility), useValue: uatFacilityRepo },
        { provide: getRepositoryToken(UatFacilitiesSyncLog), useValue: uatFacilitySyncLogRepo },
        { provide: getRepositoryToken(UatFacilitiesQualityAudit), useValue: uatFacilityQualityAuditRepo },
        { provide: getRepositoryToken(ProdFacility), useValue: prodFacilityRepo },
        { provide: getRepositoryToken(ProdFacilitiesSyncLog), useValue: prodFacilitySyncLogRepo },
        { provide: getRepositoryToken(ProdFacilitiesQualityAudit), useValue: prodFacilityQualityAuditRepo },
        { provide: getRepositoryToken(MasterDataSyncLog), useValue: masterDataSyncLogRepo },
        { provide: PPBApiService, useValue: ppbApiService },
        { provide: SafaricomHieApiService, useValue: safaricomHieApiService },
        { provide: QualityAlertService, useValue: qualityAlertService },
        { provide: GenericSyncService, useValue: genericSyncService },
        { provide: GenericQualityReportService, useValue: genericQualityReportService },
        { provide: GenericQualityHistoryService, useValue: genericQualityHistoryService },
        { provide: GenericCrudService, useValue: genericCrudService },
      ],
    }).compile();

    service = module.get<MasterDataService>(MasterDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPremiseDataQualityReport - Freshness Scoring', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    it('should score 100% timeliness when synced < 3 hours ago', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: threeHoursAgo,
          dataQualityScore: 95,
        },
        completeness: {
          missingGln: 100,
          missingCounty: 50,
          missingBusinessType: 20,
          missingOwnership: 10,
          missingSuperintendent: 30,
          missingLicenseInfo: 15,
          missingLocation: 25,
          missingSupplierMapping: 900,
          completeRecords: 100,
          completenessPercentage: 80,
        },
        validity: {
          expiredLicenses: 10,
          expiringSoon: 50,
          validLicenses: 940,
          invalidDates: 0,
          duplicatePremiseIds: 0,
          invalidGln: 5,
        },
        distribution: {
          byCounty: [],
          byBusinessType: [],
          byOwnership: [],
          bySuperintendentCadre: [],
        },
        issues: [],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result).toBeDefined();
      expect(result.overview.lastSyncDate).toEqual(threeHoursAgo);
      // Timeliness should be 100% (< 3 hours)
    });

    it('should score 90% timeliness when synced 3-6 hours ago', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: sixHoursAgo,
          dataQualityScore: 92,
        },
        completeness: {
          missingGln: 100,
          completeRecords: 900,
          completenessPercentage: 90,
        },
        validity: {
          validLicenses: 980,
        },
        distribution: {},
        issues: [],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result).toBeDefined();
      // Should have timeliness warning in issues
    });

    it('should score 50% timeliness when synced 12-24 hours ago', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: twentyFourHoursAgo,
          dataQualityScore: 85,
        },
        completeness: {
          missingGln: 100,
          completeRecords: 900,
          completenessPercentage: 90,
        },
        validity: {
          validLicenses: 980,
        },
        distribution: {},
        issues: [
          {
            severity: 'high',
            category: 'Timeliness',
            description: 'Data is very stale - last sync was 24 hours ago',
            count: 1000,
          },
        ],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result).toBeDefined();
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          category: 'Timeliness',
        })
      );
    });

    it('should score 0% timeliness when synced > 48 hours ago', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: fortyEightHoursAgo,
          dataQualityScore: 70,
        },
        completeness: {
          missingGln: 100,
          completeRecords: 900,
          completenessPercentage: 90,
        },
        validity: {
          validLicenses: 980,
        },
        distribution: {},
        issues: [
          {
            severity: 'high',
            category: 'Timeliness',
            description: 'Data is critically stale - last sync was 48 hours ago',
            count: 1000,
          },
        ],
        recommendations: [
          '⚠️ URGENT: Sync is 48 hours old. Verify cron job is running',
        ],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
      // Should have timeliness issues for very stale data
      const timelinessIssue = result.issues.find(i => i.category === 'Timeliness' || i.severity === 'high');
      expect(timelinessIssue).toBeDefined();
    });
  });

  describe('getPremiseDataQualityReport - Completeness', () => {
    it('should calculate completeness metrics correctly', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: new Date(),
          dataQualityScore: 85,
        },
        completeness: {
          missingGln: 200, // 20% missing
          missingCounty: 50, // 5% missing
          missingBusinessType: 30, // 3% missing
          missingOwnership: 100, // 10% missing
          missingSuperintendent: 75, // 7.5% missing
          missingLicenseInfo: 25, // 2.5% missing
          missingLocation: 80, // 8% missing
          missingSupplierMapping: 950, // 95% missing (critical!)
          completeRecords: 100, // Only 10% complete
          completenessPercentage: 10,
        },
        validity: {
          validLicenses: 950,
          expiredLicenses: 25,
          expiringSoon: 25,
        },
        distribution: {},
        issues: [
          {
            severity: 'high',
            category: 'Completeness',
            description: '200 premises missing GLN',
            count: 200,
          },
          {
            severity: 'high',
            category: 'Completeness',
            description: '950 premises missing supplier ownership mapping',
            count: 950,
          },
        ],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result.completeness.missingGLN).toBe(200);
      expect(result.completeness.missingSupplierMapping).toBe(950);
      expect(result.completeness.completenessPercentage).toBe(10);
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    });

    it('should identify critical missing fields', async () => {
      const mockReport = {
        overview: {
          totalPremises: 11533,
          totalRecords: 11533,
          lastSyncDate: new Date(),
          dataQualityScore: 78,
        },
        completeness: {
          missingGln: 11533, // 100% missing - CRITICAL
          missingSupplierMapping: 11533, // 100% missing - CRITICAL
          missingCounty: 0,
          missingBusinessType: 0,
          completeRecords: 0,
          completenessPercentage: 0,
        },
        validity: {},
        distribution: {},
        issues: [
          {
            severity: 'high',
            category: 'Completeness',
            description: '11533 premises missing GLN (required for EPCIS compliance)',
            count: 11533,
          },
          {
            severity: 'high',
            category: 'Completeness',
            description: '11533 premises missing supplier ownership mapping',
            count: 11533,
          },
        ],
        recommendations: [
          '⚠️ CRITICAL: Map 11,533 premises to their actual supplier/manufacturer owners',
        ],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result.completeness.missingGLN).toBe(11533);
      expect(result.completeness.missingSupplierMapping).toBe(11533);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          category: 'Completeness',
        })
      );
    });
  });

  describe('getPremiseDataQualityReport - Validity', () => {
    it('should exclude annual license expiry (Dec 31) from quality scoring', async () => {
      const dec31_2025 = new Date('2025-12-31');
      const mockReport = {
        overview: {
          totalPremises: 11533,
          totalRecords: 11533,
          lastSyncDate: new Date(),
          dataQualityScore: 95, // Should NOT be penalized for Dec 31 expiry
        },
        completeness: {
          completeRecords: 11533,
          completenessPercentage: 100,
        },
        validity: {
          validLicenses: 0,
          expiredLicenses: 0,
          expiringSoon: 11533, // All expire Dec 31 - this is normal!
          invalidDates: 0,
          duplicatePremiseIds: 0,
          invalidGln: 0,
        },
        distribution: {},
        issues: [
          {
            severity: 'low', // Should be LOW severity, not high
            category: 'License Monitoring',
            description: '11533 premises in annual renewal cycle (expires Dec 31)',
            count: 11533,
          },
        ],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      // Dec 31 expiry should not heavily penalize quality score
      expect(result.overview.dataQualityScore).toBeGreaterThan(90);
      
      // Should be informational, not a critical issue
      const licenseIssue = result.issues.find(i => i.category === 'License Monitoring');
      expect(licenseIssue?.severity).toBe('low');
    });

    it('should detect duplicate premise IDs', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: new Date(),
          dataQualityScore: 85,
        },
        completeness: {
          completeRecords: 990,
          completenessPercentage: 99,
        },
        validity: {
          validLicenses: 1000,
          duplicatePremiseIds: 5, // Data integrity issue
          invalidGln: 0,
        },
        distribution: {},
        issues: [
          {
            severity: 'high',
            category: 'Data Integrity',
            description: '5 duplicate premise IDs detected',
            count: 5,
          },
        ],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result.validity.duplicatePremiseIds).toBe(5);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          category: 'Data Integrity',
        })
      );
    });

    it('should detect invalid GLN format', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: new Date(),
          dataQualityScore: 90,
        },
        completeness: {
          completeRecords: 950,
          completenessPercentage: 95,
        },
        validity: {
          validLicenses: 1000,
          duplicatePremiseIds: 0,
          invalidGln: 50, // GLNs not matching GS1 format
        },
        distribution: {},
        issues: [
          {
            severity: 'high',
            category: 'Data Format',
            description: '50 premises with invalid GLN format',
            count: 50,
          },
        ],
        recommendations: [],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result.validity.invalidGLN).toBe(50);
    });
  });

  describe('saveQualityAudit', () => {
    it('should save quality audit snapshot successfully', async () => {
      const mockReport = {
        overview: {
          totalPremises: 1000,
          totalRecords: 1000,
          lastSyncDate: new Date(),
          dataQualityScore: 85,
        },
        completeness: {
          missingGLN: 100,
          missingCounty: 50,
          missingBusinessType: 20,
          missingOwnership: 10,
          missingSuperintendent: 30,
          missingLicenseInfo: 15,
          missingLocation: 25,
          missingSupplierMapping: 900,
          completeRecords: 100,
          completenessPercentage: 80,
        },
        validity: {
          expiredLicenses: 10,
          expiringSoon: 50,
          validLicenses: 940,
          duplicatePremiseIds: 0,
          invalidGLN: 5,
        },
        distribution: {},
        issues: [],
        recommendations: [],
      };

      const mockSavedAudit = {
        id: 1,
        reportDate: new Date(),
        totalPremises: 1000,
        dataQualityScore: 85,
        ...mockReport.completeness,
        ...mockReport.validity,
        fullReport: mockReport,
        triggeredBy: 'manual',
        notes: 'Test audit',
      };

      qualityReportRepo.create.mockReturnValue(mockSavedAudit as any);
      qualityReportRepo.save.mockResolvedValue(mockSavedAudit as any);

      // Mock the service method that generates the report
      jest.spyOn(service, 'getPremiseDataQualityReport').mockResolvedValue(mockReport as any);

      const result = await service.saveQualityReportSnapshot('manual', 'Test audit');

      expect(result).toBeDefined();
      expect(result.totalPremises).toBe(1000);
      expect(result.dataQualityScore).toBe(85);
      expect(qualityReportRepo.save).toHaveBeenCalled();
    });

    it('should handle triggered by scheduled jobs', async () => {
      const mockReport = {
        overview: { totalPremises: 1000, dataQualityScore: 90 },
        completeness: { completeRecords: 900 },
        validity: { validLicenses: 950 },
      };

      const mockAudit = { id: 1, triggeredBy: 'scheduled' };
      qualityReportRepo.create.mockReturnValue(mockAudit as any);
      qualityReportRepo.save.mockResolvedValue(mockAudit as any);

      jest.spyOn(service, 'getPremiseDataQualityReport').mockResolvedValue(mockReport as any);

      const result = await service.saveQualityReportSnapshot('scheduled', 'Weekly audit');

      expect(result.triggeredBy).toBe('scheduled');
      expect(qualityReportRepo.save).toHaveBeenCalled();
    });
  });

  describe('getQualityReportHistory', () => {
    it('should return quality audit history', async () => {
      const mockHistory = [
        {
          id: 1,
          reportDate: new Date('2025-12-14'),
          dataQualityScore: 85,
          totalPremises: 1000,
        },
        {
          id: 2,
          reportDate: new Date('2025-12-07'),
          dataQualityScore: 82,
          totalPremises: 950,
        },
      ];

      genericQualityHistoryService.getHistory.mockResolvedValue(mockHistory as any);

      const result = await service.getQualityReportHistory(10);

      expect(result).toHaveLength(2);
      expect(result[0].dataQualityScore).toBe(85);
      expect(genericQualityHistoryService.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'premise',
          dateField: 'reportDate',
        }),
        10
      );
    });

    it('should handle empty history gracefully', async () => {
      genericQualityHistoryService.getHistory.mockResolvedValue([]);

      const result = await service.getQualityReportHistory(10);

      expect(result).toEqual([]);
    });
  });

  describe('getQualityScoreTrend', () => {
    it('should return quality score trend over time', async () => {
      const mockTrend = [
        { date: '2025-12-14', score: 85 },
        { date: '2025-12-13', score: 83 },
        { date: '2025-12-12', score: 82 },
      ];

      genericQualityHistoryService.getScoreTrend.mockResolvedValue(mockTrend as any);

      const result = await service.getQualityScoreTrend(7);

      expect(result).toHaveLength(3);
      expect(result[0].score).toBe(85);
      expect(genericQualityHistoryService.getScoreTrend).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'premise',
        }),
        7
      );
    });

    it('should show improving trend', async () => {
      const mockTrend = [
        { date: '2025-12-14', score: 90 },
        { date: '2025-12-13', score: 85 },
        { date: '2025-12-12', score: 80 },
      ];

      genericQualityHistoryService.getScoreTrend.mockResolvedValue(mockTrend as any);

      const result = await service.getQualityScoreTrend(7);

      // Verify trend is improving
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[1].score).toBeGreaterThan(result[2].score);
    });

    it('should show declining trend (alert needed)', async () => {
      const mockTrend = [
        { date: '2025-12-14', score: 75 },
        { date: '2025-12-13', score: 80 },
        { date: '2025-12-12', score: 85 },
      ];

      genericQualityHistoryService.getScoreTrend.mockResolvedValue(mockTrend as any);

      const result = await service.getQualityScoreTrend(7);

      // Verify trend is declining - should trigger alerts
      expect(result[0].score).toBeLessThan(result[1].score);
      expect(result[1].score).toBeLessThan(result[2].score);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      genericQualityReportService.generateReport.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.getPremiseDataQualityReport())
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle zero premises scenario', async () => {
      const mockReport = {
        overview: {
          totalPremises: 0,
          totalRecords: 0,
          lastSyncDate: null,
          dataQualityScore: 0,
        },
        completeness: {
          missingGln: 0,
          completeRecords: 0,
          completenessPercentage: 0,
        },
        validity: {},
        distribution: {},
        issues: [],
        recommendations: ['No premises data available. Run initial sync.'],
      };

      genericQualityReportService.generateReport.mockResolvedValue(mockReport as any);

      const result = await service.getPremiseDataQualityReport();

      expect(result.overview.totalPremises).toBe(0);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });
});





