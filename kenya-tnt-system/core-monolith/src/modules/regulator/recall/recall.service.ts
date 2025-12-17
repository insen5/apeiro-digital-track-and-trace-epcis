import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecallRequest, RecallStatus } from '../../../shared/domain/entities/recall-request.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';

export interface CreateRecallDto {
  batchId: number;
  reason: string;
  transporter: string;
  pickupLocation: string;
  pickupDate: Date;
  deliveryLocation: string;
  deliveryDate: Date;
}

/**
 * Recall Service (Regulator Module)
 *
 * Manages product recalls
 */
@Injectable()
export class RecallService {
  private readonly logger = new Logger(RecallService.name);

  constructor(
    @InjectRepository(RecallRequest)
    private readonly recallRepo: Repository<RecallRequest>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  /**
   * Create a recall request
   */
  async create(dto: CreateRecallDto): Promise<RecallRequest> {
    // Verify batch exists
    const batch = await this.batchRepo.findOne({
      where: { id: dto.batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${dto.batchId} not found`);
    }

    const recall = this.recallRepo.create({
      ...dto,
      status: RecallStatus.PENDING,
    });

    const saved = await this.recallRepo.save(recall);
    this.logger.log(`Recall request created: ${saved.id} for batch ${dto.batchId}`);
    return saved;
  }

  /**
   * Get all recall requests
   */
  async findAll(): Promise<RecallRequest[]> {
    return this.recallRepo.find({
      relations: ['batch'],
      order: { id: 'DESC' },
    });
  }

  /**
   * Get recall by ID
   */
  async findOne(id: number): Promise<RecallRequest> {
    const recall = await this.recallRepo.findOne({
      where: { id },
      relations: ['batch'],
    });

    if (!recall) {
      throw new NotFoundException(`Recall request with ID ${id} not found`);
    }

    return recall;
  }

  /**
   * Update recall status
   */
  async updateStatus(
    id: number,
    status: RecallStatus,
  ): Promise<RecallRequest> {
    const recall = await this.findOne(id);
    recall.status = status;
    return this.recallRepo.save(recall);
  }
}

