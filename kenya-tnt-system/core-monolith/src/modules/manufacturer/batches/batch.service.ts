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
      await this.masterDataService.findOne(dto.product_id);
    } catch (error) {
      throw new NotFoundException(`Product with ID ${dto.product_id} not found`);
    }

    // Generate batch number if not provided (using GS1 Service)
    let batch_no = dto.batch_no;
    if (!batch_no) {
      batch_no = await this.gs1Service.generateBatchNumber({
        product_id: dto.product_id,
        user_id: userId,
      });
    }

    // Check if batch number already exists
    const existing = await this.batchRepo.findOne({
      where: { batch_no },
    });

    if (existing) {
      throw new ConflictException(
        `Batch number ${batch_no} already exists`,
      );
    }

    const batch = this.batchRepo.create({
      product_id: dto.product_id,
      batch_no,
      expiry: dto.expiry,
      qty: dto.qty, // NUMERIC type - can do math operations!
      sent_qty: 0,
      user_id: userId,
      is_enabled: true,
    });

    try {
      const saved = await this.batchRepo.save(batch);
      this.logger.log(`Batch created: ${saved.id} - ${saved.batch_no}`);
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
        where: { user_id: userId, is_enabled: true },
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
      where: { id, user_id: userId, is_enabled: true },
      relations: ['product'],
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }

  /**
   * Get available quantity for a batch
   * availableQty = qty - sent_qty (now works because qty is NUMERIC!)
   */
  async getAvailableQuantity(batchId: number): Promise<number> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    // Can do math operations because qty and sent_qty are NUMERIC!
    return Number(batch.qty) - Number(batch.sent_qty);
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

    batch.sent_qty = Number(batch.sent_qty) + additionalSentQty;
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
      where: { batch_no: batchno },
    });

    if (existing) {
      // Update existing batch
      existing.qty = qty;
      existing.expiry = expiry;
      existing.is_enabled = isEnabled;
      const updated = await this.batchRepo.save(existing);
      this.logger.log(`Batch updated from PPB import: ${updated.id} - ${updated.batch_no}`);
      return updated;
    }

    const batch = this.batchRepo.create({
      product_id: productId,
      batch_no: batchno,
      expiry,
      qty,
      sent_qty: 0,
      user_id: userId,
      is_enabled: isEnabled,
    });

    try {
      const saved = await this.batchRepo.save(batch);
      this.logger.log(`Batch created from PPB import: ${saved.id} - ${saved.batch_no}`);
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

