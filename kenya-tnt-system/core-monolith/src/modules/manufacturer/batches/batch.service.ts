import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { GS1Service } from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../../shared/master-data/master-data.service';

/**
 * Batch Service (Manufacturer Module)
 *
 * Creates and manages product batches.
 * - Uses GS1 Service for batch number generation
 * - Verifies product exists in database (from synced PPB catalog)
 * - Uses numeric types for quantities
 */
@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    private readonly gs1Service: GS1Service,
    private readonly masterDataService: MasterDataService,
  ) {}

  /**
   * Create a new batch
   */
  async create(
    userId: string,
    token: string,
    dto: CreateBatchDto,
  ): Promise<Batch> {
    // Verify product exists in database (synced from PPB Terminology API)
    try {
      await this.masterDataService.findOne(dto.productId);
    } catch (error) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Generate batch number if not provided (using GS1 Service)
    let batchno = dto.batchno;
    if (!batchno) {
      batchno = await this.gs1Service.generateBatchNumber({
        productId: dto.productId,
        userId,
      });
    }

    // Check if batch number already exists
    const existing = await this.batchRepo.findOne({
      where: { batchno },
    });

    if (existing) {
      throw new ConflictException(
        `Batch number ${batchno} already exists`,
      );
    }

    const batch = this.batchRepo.create({
      productId: dto.productId,
      batchno,
      expiry: dto.expiry,
      qty: dto.qty, // NUMERIC type - can do math operations!
      sentQty: 0,
      userId,
      isEnabled: true,
    });

    try {
      const saved = await this.batchRepo.save(batch);
      this.logger.log(`Batch created: ${saved.id} - ${saved.batchno}`);
      return saved;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Batch number already exists');
      }
      this.logger.error(`Failed to create batch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all batches for a user
   */
  async findAll(userId: string): Promise<Batch[]> {
    try {
      return await this.batchRepo.find({
        where: { userId, isEnabled: true },
        relations: ['product'],
        order: { id: 'DESC' },
      });
    } catch (error: any) {
      this.logger.error(`Failed to find batches: ${error.message}`, error.stack);
      // Return empty array if there's an error (e.g., DB connection issue)
      return [];
    }
  }

  /**
   * Get batch by ID
   */
  async findOne(id: number, userId: string): Promise<Batch> {
    const batch = await this.batchRepo.findOne({
      where: { id, userId, isEnabled: true },
      relations: ['product'],
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }

  /**
   * Get available quantity for a batch
   * availableQty = qty - sentQty (now works because qty is NUMERIC!)
   */
  async getAvailableQuantity(batchId: number): Promise<number> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    // Can do math operations because qty and sentQty are NUMERIC!
    return Number(batch.qty) - Number(batch.sentQty);
  }

  /**
   * Update sent quantity (when batch is used in cases/shipments)
   */
  async updateSentQuantity(
    batchId: number,
    additionalSentQty: number,
  ): Promise<void> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    batch.sentQty = Number(batch.sentQty) + additionalSentQty;
    await this.batchRepo.save(batch);
  }

  /**
   * Create batch from PPB import (skips PPB API validation since PPB is the source)
   */
  async createFromPPBImport(
    userId: string,
    productId: number,
    batchno: string,
    expiry: Date,
    qty: number,
    isEnabled: boolean = true,
  ): Promise<Batch> {
    // Check if batch number already exists
    const existing = await this.batchRepo.findOne({
      where: { batchno },
    });

    if (existing) {
      // Update existing batch
      existing.qty = qty;
      existing.expiry = expiry;
      existing.isEnabled = isEnabled;
      const updated = await this.batchRepo.save(existing);
      this.logger.log(`Batch updated from PPB import: ${updated.id} - ${updated.batchno}`);
      return updated;
    }

    const batch = this.batchRepo.create({
      productId,
      batchno,
      expiry,
      qty,
      sentQty: 0,
      userId,
      isEnabled,
    });

    try {
      const saved = await this.batchRepo.save(batch);
      this.logger.log(`Batch created from PPB import: ${saved.id} - ${saved.batchno}`);
      return saved;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Batch number already exists');
      }
      this.logger.error(`Failed to create batch from PPB import: ${error.message}`);
      throw error;
    }
  }
}

