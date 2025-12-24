import { Test, TestingModule } from '@nestjs/testing';
import { Repository, In } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HierarchyService } from '../hierarchy.service';
import { HierarchyChange, HierarchyOperationType } from '../../../../shared/domain/entities/hierarchy-change.entity';
import { Package } from '../../../../shared/domain/entities/package.entity';
import { Case } from '../../../../shared/domain/entities/case.entity';
import { CasesProducts } from '../../../../shared/domain/entities/cases-products.entity';
import { GS1Service } from '../../../../shared/gs1/gs1.service';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('HierarchyService', () => {
  let service: HierarchyService;
  let hierarchyChangeRepo: jest.Mocked<Repository<HierarchyChange>>;
  let packageRepo: jest.Mocked<Repository<Package>>;
  let caseRepo: jest.Mocked<Repository<Case>>;
  let casesProductsRepo: jest.Mocked<Repository<CasesProducts>>;
  let gs1Service: jest.Mocked<GS1Service>;

  const mockUserId = 'user-123';
  const mockSSCC = '106141411234567890';

  beforeEach(async () => {
    // Create mock repositories with all required methods
    hierarchyChangeRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    packageRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    caseRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    casesProductsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    gs1Service = {
      generateSSCC: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HierarchyService,
        { provide: getRepositoryToken(HierarchyChange), useValue: hierarchyChangeRepo },
        { provide: getRepositoryToken(Package), useValue: packageRepo },
        { provide: getRepositoryToken(Case), useValue: caseRepo },
        { provide: getRepositoryToken(CasesProducts), useValue: casesProductsRepo },
        { provide: GS1Service, useValue: gs1Service },
      ],
    }).compile();

    service = module.get<HierarchyService>(HierarchyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pack', () => {
    const mockCaseIds = [1, 2, 3];
    const mockCases = [
      { id: 1, userId: mockUserId, packageId: null, casesProducts: [] },
      { id: 2, userId: mockUserId, packageId: null, casesProducts: [] },
      { id: 3, userId: mockUserId, packageId: null, casesProducts: [] },
    ];
    const mockPackDto = {
      caseIds: mockCaseIds,
      shipmentId: 1, // Should be number, not string
      label: 'Test Package',
      notes: 'Test packing operation',
    };

    it('should successfully pack cases into a new package', async () => {
      caseRepo.find.mockResolvedValue(mockCases as any);
      gs1Service.generateSSCC.mockResolvedValue(mockSSCC);
      packageRepo.create.mockReturnValue({ id: 1, ssccBarcode: mockSSCC } as any);
      packageRepo.save.mockResolvedValue({ id: 1, ssccBarcode: mockSSCC } as any);
      caseRepo.update.mockResolvedValue({ affected: 3 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);

      const result = await service.pack(mockUserId, mockPackDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.ssccBarcode).toBe(mockSSCC);
      expect(caseRepo.find).toHaveBeenCalledWith({
        where: { id: In(mockCaseIds), userId: mockUserId },
        relations: ['casesProducts'],
      });
      expect(gs1Service.generateSSCC).toHaveBeenCalled();
      expect(packageRepo.save).toHaveBeenCalled();
      expect(caseRepo.update).toHaveBeenCalledWith(
        { id: In(mockCaseIds) },
        { packageId: 1 }
      );
      expect(hierarchyChangeRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if some cases do not exist', async () => {
      caseRepo.find.mockResolvedValue([mockCases[0]] as any); // Only 1 case found

      await expect(service.pack(mockUserId, mockPackDto))
        .rejects
        .toThrow(NotFoundException);
      
      expect(caseRepo.find).toHaveBeenCalled();
      expect(gs1Service.generateSSCC).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if cases belong to different user', async () => {
      const differentUserCases = [
        { id: 1, userId: 'different-user', packageId: null },
      ];
      caseRepo.find.mockResolvedValue(differentUserCases as any);

      await expect(service.pack(mockUserId, mockPackDto))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException if cases are already packed', async () => {
      const alreadyPackedCases = [
        { id: 1, userId: mockUserId, packageId: 999, casesProducts: [] },
        { id: 2, userId: mockUserId, packageId: null, casesProducts: [] },
        { id: 3, userId: mockUserId, packageId: null, casesProducts: [] },
      ];
      caseRepo.find.mockResolvedValue(alreadyPackedCases as any);

      await expect(service.pack(mockUserId, mockPackDto))
        .rejects
        .toThrow(BadRequestException);
      
      expect(caseRepo.find).toHaveBeenCalled();
      expect(gs1Service.generateSSCC).not.toHaveBeenCalled();
    });

    it('should use default label if not provided', async () => {
      const dtoWithoutLabel = { ...mockPackDto, label: undefined };
      caseRepo.find.mockResolvedValue(mockCases as any);
      gs1Service.generateSSCC.mockResolvedValue(mockSSCC);
      packageRepo.create.mockImplementation((data) => data as any);
      packageRepo.save.mockImplementation((data) => Promise.resolve(data as any));
      caseRepo.update.mockResolvedValue({ affected: 3 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);

      await service.pack(mockUserId, dtoWithoutLabel);

      expect(packageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          label: expect.stringMatching(/^Package-\d+$/),
        })
      );
    });
  });

  describe('packLite', () => {
    const mockPackLiteDto = {
      caseIds: [1, 2],
      shipmentId: 1,
      label: 'Lite Package',
      packType: 'LITE' as const,
    };
    const mockCases = [
      { id: 1, userId: mockUserId, packageId: null, casesProducts: [] },
      { id: 2, userId: mockUserId, packageId: null, casesProducts: [] },
    ];

    it('should successfully perform pack lite operation', async () => {
      caseRepo.find.mockResolvedValue(mockCases as any);
      gs1Service.generateSSCC.mockResolvedValue(mockSSCC);
      packageRepo.create.mockReturnValue({ id: 1, ssccBarcode: mockSSCC } as any);
      packageRepo.save.mockResolvedValue({ id: 1, ssccBarcode: mockSSCC } as any);
      caseRepo.update.mockResolvedValue({ affected: 2 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);
      hierarchyChangeRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.packLite(mockUserId, mockPackLiteDto);

      expect(result).toBeDefined();
      expect(hierarchyChangeRepo.update).toHaveBeenCalledWith(
        expect.anything(),
        { operationType: HierarchyOperationType.PACK_LITE }
      );
    });
  });

  describe('packLarge', () => {
    const mockPackLargeDto = {
      caseIds: Array.from({ length: 50 }, (_, i) => i + 1), // 50 cases
      shipmentId: 1,
      label: 'Large Package',
      packType: 'LARGE' as const,
    };

    it('should successfully perform pack large operation', async () => {
      const mockCases = mockPackLargeDto.caseIds.map(id => ({
        id,
        userId: mockUserId,
        packageId: null,
        casesProducts: [],
      }));
      
      caseRepo.find.mockResolvedValue(mockCases as any);
      gs1Service.generateSSCC.mockResolvedValue(mockSSCC);
      packageRepo.create.mockReturnValue({ id: 1, ssccBarcode: mockSSCC } as any);
      packageRepo.save.mockResolvedValue({ id: 1, ssccBarcode: mockSSCC } as any);
      caseRepo.update.mockResolvedValue({ affected: 50 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);
      hierarchyChangeRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.packLarge(mockUserId, mockPackLargeDto);

      expect(result).toBeDefined();
      expect(hierarchyChangeRepo.update).toHaveBeenCalledWith(
        expect.anything(),
        { operationType: HierarchyOperationType.PACK_LARGE }
      );
    });
  });

  describe('unpack', () => {
    const mockPackageId = 1;
    const mockPackage = {
      id: mockPackageId,
      userId: mockUserId,
      ssccBarcode: mockSSCC,
    };
    const mockCases = [
      { id: 1, packageId: mockPackageId, userId: mockUserId },
      { id: 2, packageId: mockPackageId, userId: mockUserId },
    ];

    it('should successfully unpack a package', async () => {
      packageRepo.findOne.mockResolvedValue({
        ...mockPackage,
        cases: mockCases,
      } as any);
      caseRepo.find.mockResolvedValue(mockCases as any);
      caseRepo.update.mockResolvedValue({ affected: 2 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);

      const result = await service.unpack(mockUserId, mockPackageId);

      expect(result).toEqual(mockCases);
      expect(result).toHaveLength(2);
      expect(packageRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockPackageId, userId: mockUserId },
        relations: ['cases'],
      });
      expect(caseRepo.update).toHaveBeenCalledWith(
        { packageId: mockPackageId },
        { packageId: null }
      );
    });

    it('should throw NotFoundException if package not found', async () => {
      packageRepo.findOne.mockResolvedValue(null);

      await expect(service.unpack(mockUserId, mockPackageId))
        .rejects
        .toThrow(NotFoundException);
      
      expect(caseRepo.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if package has no cases', async () => {
      const packageWithoutCases = {
        ...mockPackage,
        cases: [],
      };
      packageRepo.findOne.mockResolvedValue(packageWithoutCases as any);

      await expect(service.unpack(mockUserId, mockPackageId))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('unpackAll', () => {
    const mockUnpackAllDto = {
      packageIds: [1, 2, 3],
      reason: 'Recall',
      notes: 'Quality issue detected',
    };
    const mockPackages = mockUnpackAllDto.packageIds.map(id => ({
      id,
      userId: mockUserId,
      ssccBarcode: `${mockSSCC}-${id}`,
      cases: [
        { id: id, packageId: id },
      ],
    }));

    it('should successfully unpack all packages', async () => {
      // Mock findOne for each unpack call
      packageRepo.findOne
        .mockResolvedValueOnce(mockPackages[0] as any)
        .mockResolvedValueOnce(mockPackages[1] as any)
        .mockResolvedValueOnce(mockPackages[2] as any);
      
      caseRepo.find
        .mockResolvedValueOnce([{ id: 1, packageId: 1 }] as any)
        .mockResolvedValueOnce([{ id: 2, packageId: 2 }] as any)
        .mockResolvedValueOnce([{ id: 3, packageId: 3 }] as any);
      
      caseRepo.update.mockResolvedValue({ affected: 1 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);

      const result = await service.unpackAll(mockUserId, mockUnpackAllDto);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should continue processing even if one package fails', async () => {
      packageRepo.findOne
        .mockResolvedValueOnce(mockPackages[0] as any)
        .mockResolvedValueOnce(null) // Second package not found
        .mockResolvedValueOnce(mockPackages[2] as any);
      
      caseRepo.find
        .mockResolvedValueOnce([{ id: 1 }] as any)
        .mockResolvedValueOnce([{ id: 3 }] as any);
      
      caseRepo.update.mockResolvedValue({ affected: 1 } as any);
      hierarchyChangeRepo.create.mockReturnValue({} as any);
      hierarchyChangeRepo.save.mockResolvedValue({} as any);

      const result = await service.unpackAll(mockUserId, mockUnpackAllDto);

      expect(result).toHaveLength(2); // Only 2 succeeded
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });
  });

  describe('getHierarchyHistory', () => {
    it('should return hierarchy change history', async () => {
      const mockHistory = [
        {
          id: 1,
          operationType: HierarchyOperationType.PACK,
          newSscc: mockSSCC,
          actorUserId: mockUserId,
          createdAt: new Date(),
        },
        {
          id: 2,
          operationType: HierarchyOperationType.UNPACK,
          oldSscc: mockSSCC,
          actorUserId: mockUserId,
          createdAt: new Date(),
        },
      ];
      hierarchyChangeRepo.find.mockResolvedValue(mockHistory as any);

      const result = await service.getHierarchyHistory(mockUserId);

      expect(result).toEqual(mockHistory);
      expect(hierarchyChangeRepo.find).toHaveBeenCalled();
    });

    it('should filter history by user', async () => {
      const mockHistory = [
        {
          id: 1,
          operationType: HierarchyOperationType.PACK,
          actorUserId: mockUserId,
        },
      ];
      hierarchyChangeRepo.find.mockResolvedValue(mockHistory as any);

      await service.getHierarchyHistory(mockUserId);

      expect(hierarchyChangeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ actorUserId: mockUserId }),
        })
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors gracefully during pack', async () => {
      const mockCases = [
        { id: 1, userId: mockUserId, packageId: null, casesProducts: [] },
      ];
      caseRepo.find.mockResolvedValue(mockCases as any);
      gs1Service.generateSSCC.mockResolvedValue(mockSSCC);
      packageRepo.create.mockReturnValue({} as any);
      packageRepo.save.mockRejectedValue(new Error('Database connection error'));

      await expect(service.pack(mockUserId, { caseIds: [1], shipmentId: 1 }))
        .rejects
        .toThrow('Database connection error');
    });

    it('should handle GS1 service errors during pack', async () => {
      const mockCases = [
        { id: 1, userId: mockUserId, packageId: null, casesProducts: [] },
      ];
      caseRepo.find.mockResolvedValue(mockCases as any);
      gs1Service.generateSSCC.mockRejectedValue(new Error('GS1 service unavailable'));

      await expect(service.pack(mockUserId, { caseIds: [1], shipmentId: 1 }))
        .rejects
        .toThrow('GS1 service unavailable');
    });
  });
});





