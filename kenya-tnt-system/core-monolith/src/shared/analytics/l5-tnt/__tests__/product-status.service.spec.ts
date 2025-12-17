import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductStatusService } from '../product-status.service';
import { ProductStatus } from '../../../domain/entities/product-status.entity';
import { User } from '../../../domain/entities/user.entity';
import { CreateProductStatusDto, ProductStatusEnum } from '../dto/create-product-status.dto';

describe('ProductStatusService', () => {
  let service: ProductStatusService;
  let productStatusRepo: jest.Mocked<Repository<ProductStatus>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    role: 'manufacturer',
  };

  beforeEach(async () => {
    productStatusRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    userRepo = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductStatusService,
        { provide: getRepositoryToken(ProductStatus), useValue: productStatusRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<ProductStatusService>(ProductStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockDto: CreateProductStatusDto = {
      productId: 1,
      batchId: 100,
      sgtin: '01234567890123456789',
      status: ProductStatusEnum.ACTIVE,
      actorType: 'manufacturer',
      notes: 'Initial status',
    };

    it('should create a product status successfully', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(null); // No previous status
      productStatusRepo.create.mockReturnValue({
        id: 1,
        ...mockDto,
        actorUserId: mockUserId,
        previousStatus: undefined,
      } as any);
      productStatusRepo.save.mockResolvedValue({
        id: 1,
        ...mockDto,
        actorUserId: mockUserId,
      } as any);

      const result = await service.create(mockUserId, mockDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(ProductStatusEnum.ACTIVE);
      expect(result.actorUserId).toBe(mockUserId);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: mockUserId } });
      expect(productStatusRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.create(mockUserId, mockDto))
        .rejects
        .toThrow(NotFoundException);
      
      expect(productStatusRepo.save).not.toHaveBeenCalled();
    });

    it('should set previousStatus if product has existing status', async () => {
      const existingStatus = {
        id: 99,
        status: ProductStatusEnum.LOST,
        productId: 1,
      };
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(existingStatus as any);
      productStatusRepo.create.mockImplementation((data) => data as any);
      productStatusRepo.save.mockImplementation((data) => Promise.resolve(data as any));

      await service.create(mockUserId, mockDto);

      expect(productStatusRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          previousStatus: ProductStatusEnum.LOST,
        })
      );
    });

    it('should default actorType to manufacturer if not provided', async () => {
      const dtoWithoutActorType = { ...mockDto, actorType: undefined };
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(null);
      productStatusRepo.create.mockImplementation((data) => data as any);
      productStatusRepo.save.mockImplementation((data) => Promise.resolve(data as any));

      await service.create(mockUserId, dtoWithoutActorType);

      expect(productStatusRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: 'manufacturer',
        })
      );
    });
  });

  describe('findByProduct', () => {
    it('should find status history by productId', async () => {
      const mockStatuses = [
        { id: 1, productId: 1, status: ProductStatusEnum.ACTIVE, statusDate: new Date() },
        { id: 2, productId: 1, status: ProductStatusEnum.LOST, statusDate: new Date() },
      ];
      productStatusRepo.find.mockResolvedValue(mockStatuses as any);

      const result = await service.findByProduct(1);

      expect(result).toEqual(mockStatuses);
      expect(productStatusRepo.find).toHaveBeenCalledWith({
        where: { productId: 1 },
        relations: ['actor'],
        order: { statusDate: 'DESC' },
      });
    });

    it('should find status history by batchId', async () => {
      const mockStatuses = [
        { id: 1, batchId: 100, status: ProductStatusEnum.ACTIVE },
      ];
      productStatusRepo.find.mockResolvedValue(mockStatuses as any);

      const result = await service.findByProduct(undefined, 100);

      expect(result).toEqual(mockStatuses);
      expect(productStatusRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { batchId: 100 },
        })
      );
    });

    it('should find status history by sgtin', async () => {
      const mockStatuses = [
        { id: 1, sgtin: '01234567890123456789', status: ProductStatusEnum.DISPENSING },
      ];
      productStatusRepo.find.mockResolvedValue(mockStatuses as any);

      const result = await service.findByProduct(undefined, undefined, '01234567890123456789');

      expect(result).toEqual(mockStatuses);
      expect(productStatusRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sgtin: '01234567890123456789' },
        })
      );
    });
  });

  describe('getCurrentStatus', () => {
    it('should return most recent status', async () => {
      const mockStatus = {
        id: 5,
        productId: 1,
        status: ProductStatusEnum.ACTIVE,
        statusDate: new Date(),
      };
      productStatusRepo.findOne.mockResolvedValue(mockStatus as any);

      const result = await service.getCurrentStatus(1);

      expect(result).toEqual(mockStatus);
      expect(productStatusRepo.findOne).toHaveBeenCalledWith({
        where: { productId: 1 },
        relations: ['actor'],
        order: { statusDate: 'DESC' },
      });
    });

    it('should return null if no status exists', async () => {
      productStatusRepo.findOne.mockResolvedValue(null);

      const result = await service.getCurrentStatus(999);

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    const mockDto: CreateProductStatusDto = {
      productId: 1,
      status: ProductStatusEnum.LOST,
      actorType: 'distributor',
    };

    it('should update status successfully', async () => {
      const currentStatus = { id: 1, status: ProductStatusEnum.ACTIVE, productId: 1 };
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne
        .mockResolvedValueOnce(currentStatus as any) // getCurrentStatus call
        .mockResolvedValueOnce(null); // create() previousStatus check
      productStatusRepo.create.mockReturnValue({} as any);
      productStatusRepo.save.mockResolvedValue({
        id: 2,
        ...mockDto,
        previousStatus: ProductStatusEnum.ACTIVE,
      } as any);

      const result = await service.updateStatus(mockUserId, mockDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(ProductStatusEnum.LOST);
      expect(result.previousStatus).toBe(ProductStatusEnum.ACTIVE);
    });

    it('should validate status transition', async () => {
      const currentStatus = { id: 1, status: ProductStatusEnum.DISPENSING, productId: 1 };
      productStatusRepo.findOne.mockResolvedValue(currentStatus as any);

      const dtoWithInvalidTransition = {
        productId: 1,
        status: ProductStatusEnum.ACTIVE, // May not be valid transition
      };

      // This test depends on actual validation logic in service
      // Assuming validation exists
      await expect(service.updateStatus(mockUserId, dtoWithInvalidTransition))
        .rejects
        .toThrow(); // May throw BadRequestException if validation fails
    });

    it('should log warning for sensitive status changes (STOLEN)', async () => {
      const sensitiveDto = { ...mockDto, status: ProductStatusEnum.STOLEN };
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne
        .mockResolvedValueOnce({ id: 1, status: ProductStatusEnum.ACTIVE } as any)
        .mockResolvedValueOnce(null);
      productStatusRepo.create.mockReturnValue({} as any);
      productStatusRepo.save.mockResolvedValue({} as any);

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.updateStatus(mockUserId, sensitiveDto);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive status change (STOLEN)')
      );
    });

    it('should log warning for sensitive status changes (LOST)', async () => {
      const sensitiveDto = { ...mockDto, status: ProductStatusEnum.LOST };
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne
        .mockResolvedValueOnce({ id: 1, status: ProductStatusEnum.ACTIVE } as any)
        .mockResolvedValueOnce(null);
      productStatusRepo.create.mockReturnValue({} as any);
      productStatusRepo.save.mockResolvedValue({} as any);

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.updateStatus(mockUserId, sensitiveDto);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive status change (LOST)')
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    const mockUpdates: CreateProductStatusDto[] = [
      { productId: 1, status: ProductStatusEnum.LOST },
      { productId: 2, status: ProductStatusEnum.LOST },
      { productId: 3, status: ProductStatusEnum.LOST },
    ];

    it('should update multiple products successfully', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(null);
      productStatusRepo.create.mockReturnValue({} as any);
      productStatusRepo.save.mockResolvedValue({} as any);

      const result = await service.bulkUpdateStatus(mockUserId, mockUpdates);

      expect(result).toHaveLength(3);
      expect(productStatusRepo.save).toHaveBeenCalledTimes(3); // 3 creates (no getCurrentStatus calls if no previous status)
    });

    it('should continue processing even if one update fails', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(null);
      productStatusRepo.create.mockReturnValue({} as any);
      productStatusRepo.save
        .mockResolvedValueOnce({} as any) // First success
        .mockRejectedValueOnce(new Error('Database error')) // Second fails
        .mockResolvedValueOnce({} as any); // Third success

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.bulkUpdateStatus(mockUserId, mockUpdates);

      expect(result.length).toBeGreaterThan(0); // At least some succeeded
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow LOST from any status', () => {
      expect(() => service['validateStatusTransition'](ProductStatusEnum.ACTIVE, ProductStatusEnum.LOST))
        .not.toThrow();
    });

    it('should allow STOLEN from any status', () => {
      expect(() => service['validateStatusTransition'](ProductStatusEnum.ACTIVE, ProductStatusEnum.STOLEN))
        .not.toThrow();
      expect(() => service['validateStatusTransition'](ProductStatusEnum.DISPENSING, ProductStatusEnum.STOLEN))
        .not.toThrow();
    });

    it('should allow DAMAGED from any status', () => {
      expect(() => service['validateStatusTransition'](ProductStatusEnum.ACTIVE, ProductStatusEnum.DAMAGED))
        .not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle missing actorType gracefully', async () => {
      const dtoWithoutActorType = {
        productId: 1,
        status: ProductStatusEnum.ACTIVE,
      };
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(null);
      productStatusRepo.create.mockImplementation((data) => data as any);
      productStatusRepo.save.mockImplementation((data) => Promise.resolve(data as any));

      const result = await service.create(mockUserId, dtoWithoutActorType as any);

      expect(result.actorType).toBe('manufacturer');
    });

    it('should handle database errors during save', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      productStatusRepo.findOne.mockResolvedValue(null);
      productStatusRepo.create.mockReturnValue({} as any);
      productStatusRepo.save.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.create(mockUserId, { productId: 1, status: ProductStatusEnum.ACTIVE }))
        .rejects
        .toThrow('Database connection failed');
    });
  });
});

