import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BatchService } from '../batch.service';
import { Batch } from '../../../../shared/domain/entities/batch.entity';
import { GS1Service } from '../../../../shared/gs1/gs1.service';
import { MasterDataService } from '../../../shared/master-data/master-data.service';
import { CreateBatchDto } from '../dto/create-batch.dto';

describe('BatchService (Snake Case Migration)', () => {
  let service: BatchService;
  let batchRepo: jest.Mocked<Repository<Batch>>;
  let gs1Service: jest.Mocked<GS1Service>;
  let masterDataService: jest.Mocked<MasterDataService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: getRepositoryToken(Batch),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GS1Service,
          useValue: {
            generateBatchNumber: jest.fn(),
          },
        },
        {
          provide: MasterDataService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    batchRepo = module.get(getRepositoryToken(Batch));
    gs1Service = module.get(GS1Service);
    masterDataService = module.get(MasterDataService);
  });

  describe('create', () => {
    it('should create batch with snake_case properties', async () => {
      const userId = 'test-user-id';
      const dto: CreateBatchDto = {
        product_id: 123,
        batch_no: 'BATCH-001',
        expiry: new Date('2027-12-31'),
        qty: 5000,
      };

      masterDataService.findOne.mockResolvedValue({ id: 123, gtin: '12345678901234' } as any);
      batchRepo.findOne.mockResolvedValue(null); // No existing batch
      batchRepo.create.mockReturnValue({
        product_id: dto.product_id,
        batch_no: dto.batch_no,
        expiry: dto.expiry,
        qty: dto.qty,
        sent_qty: 0,
        user_id: userId,
        is_enabled: true,
      } as Batch);
      batchRepo.save.mockResolvedValue({
        id: 1,
        product_id: dto.product_id,
        batch_no: dto.batch_no,
        expiry: dto.expiry,
        qty: dto.qty,
        sent_qty: 0,
        user_id: userId,
        is_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      } as Batch);

      const result = await service.create(userId, 'token', dto);

      expect(result).toBeDefined();
      expect(result.product_id).toBe(123);
      expect(result.batch_no).toBe('BATCH-001');
      expect(result.user_id).toBe(userId);
      expect(result.sent_qty).toBe(0);
      expect(result.is_enabled).toBe(true);
      expect(batchRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        product_id: dto.product_id,
        batch_no: dto.batch_no,
        user_id: userId,
        sent_qty: 0,
        is_enabled: true,
      }));
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const userId = 'test-user-id';
      const dto: CreateBatchDto = {
        product_id: 999,
        expiry: new Date('2027-12-31'),
        qty: 5000,
      };

      masterDataService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(userId, 'token', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if batch_no already exists', async () => {
      const userId = 'test-user-id';
      const dto: CreateBatchDto = {
        product_id: 123,
        batch_no: 'EXISTING-BATCH',
        expiry: new Date('2027-12-31'),
        qty: 5000,
      };

      masterDataService.findOne.mockResolvedValue({ id: 123 } as any);
      batchRepo.findOne.mockResolvedValue({ id: 1, batch_no: 'EXISTING-BATCH' } as Batch);

      await expect(service.create(userId, 'token', dto)).rejects.toThrow(ConflictException);
    });

    it('should auto-generate batch_no if not provided', async () => {
      const userId = 'test-user-id';
      const dto: CreateBatchDto = {
        product_id: 123,
        expiry: new Date('2027-12-31'),
        qty: 5000,
      };

      const generatedBatchNo = 'BATCH-20251222-ABC123';
      masterDataService.findOne.mockResolvedValue({ id: 123 } as any);
      gs1Service.generateBatchNumber.mockResolvedValue(generatedBatchNo);
      batchRepo.findOne.mockResolvedValue(null);
      batchRepo.create.mockReturnValue({ batch_no: generatedBatchNo } as Batch);
      batchRepo.save.mockResolvedValue({ id: 1, batch_no: generatedBatchNo } as Batch);

      await service.create(userId, 'token', dto);

      expect(gs1Service.generateBatchNumber).toHaveBeenCalledWith({
        product_id: dto.product_id,
        user_id: userId,
      });
    });
  });

  describe('findAll', () => {
    it('should query with snake_case properties', async () => {
      const userId = 'test-user-id';
      
      batchRepo.find.mockResolvedValue([
        { id: 1, product_id: 123, user_id: userId, is_enabled: true } as Batch,
      ]);

      await service.findAll(userId);

      expect(batchRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { user_id: userId, is_enabled: true },
      }));
    });
  });

  describe('getAvailableQuantity', () => {
    it('should calculate available quantity using snake_case properties', async () => {
      const batch = {
        id: 1,
        qty: 1000,
        sent_qty: 250,
      } as Batch;

      batchRepo.findOne.mockResolvedValue(batch);

      const available = await service.getAvailableQuantity(1);

      expect(available).toBe(750); // 1000 - 250
    });
  });
});

