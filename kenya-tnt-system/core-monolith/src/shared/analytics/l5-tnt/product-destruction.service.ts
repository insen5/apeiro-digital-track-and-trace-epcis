import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { ProductDestruction } from '../../domain/entities/product-destruction.entity';
import { Batch } from '../../domain/entities/batch.entity';

@Injectable()
export class ProductDestructionService {
  private readonly logger = new Logger(ProductDestructionService.name);

  constructor(
    @InjectRepository(ProductDestruction)
    private readonly destructionRepo: Repository<ProductDestruction>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 50,
    facilityUserId?: string,
    productId?: number,
    batchId?: number,
    destructionReason?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: ProductDestruction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.destructionRepo
      .createQueryBuilder('destruction')
      .leftJoinAndSelect('destruction.product', 'product')
      .leftJoinAndSelect('destruction.batch', 'batch')
      .leftJoinAndSelect('destruction.facility', 'facility');

    if (facilityUserId) {
      queryBuilder.andWhere('destruction.facilityUserId = :facilityUserId', {
        facilityUserId,
      });
    }
    if (productId) {
      queryBuilder.andWhere('destruction.product_id = :productId', {
        productId,
      });
    }
    if (batchId) {
      queryBuilder.andWhere('destruction.batch_id = :batchId', { batchId });
    }
    if (destructionReason) {
      queryBuilder.andWhere('destruction.destructionReason = :reason', {
        reason: destructionReason,
      });
    }
    if (startDate) {
      queryBuilder.andWhere('destruction.destructionDate >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      queryBuilder.andWhere('destruction.destructionDate <= :endDate', {
        endDate,
      });
    }

    queryBuilder.orderBy('destruction.destructionDate', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<ProductDestruction> {
    const destruction = await this.destructionRepo.findOne({
      where: { id },
      relations: ['product', 'batch', 'facility'],
    });

    if (!destruction) {
      throw new NotFoundException(
        `Destruction record with ID ${id} not found`,
      );
    }

    return destruction;
  }

  async create(
    data: Partial<ProductDestruction>,
  ): Promise<ProductDestruction> {
    const destruction = this.destructionRepo.create(data);
    return await this.destructionRepo.save(destruction);
  }

  async update(
    id: number,
    data: Partial<ProductDestruction>,
  ): Promise<ProductDestruction> {
    await this.findOne(id); // Verify exists
    await this.destructionRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.findOne(id); // Verify exists
    await this.destructionRepo.delete(id);
  }

  async getDestructionStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    totalQuantity: number;
    byReason: Record<string, number>;
    byFacility: Array<{ facilityId: string; count: number; quantity: number }>;
  }> {
    const queryBuilder = this.destructionRepo.createQueryBuilder('destruction');

    if (startDate) {
      queryBuilder.andWhere('destruction.destructionDate >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      queryBuilder.andWhere('destruction.destructionDate <= :endDate', {
        endDate,
      });
    }

    const total = await queryBuilder.getCount();
    const totalQuantityResult = await queryBuilder
      .select('SUM(destruction.quantity)', 'total')
      .getRawOne();

    const byReasonResults = await queryBuilder
      .select('destruction.destructionReason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(destruction.quantity)', 'quantity')
      .groupBy('destruction.destructionReason')
      .getRawMany();

    const byFacilityResults = await queryBuilder
      .select('destruction.facilityUserId', 'facilityId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(destruction.quantity)', 'quantity')
      .groupBy('destruction.facilityUserId')
      .getRawMany();

    const byReason: Record<string, number> = {};
    byReasonResults.forEach((r) => {
      byReason[r.reason] = parseInt(r.count);
    });

    return {
      total,
      totalQuantity: parseFloat(totalQuantityResult?.total || '0'),
      byReason,
      byFacility: byFacilityResults.map((r) => ({
        facilityId: r.facilityId,
        count: parseInt(r.count),
        quantity: parseFloat(r.quantity),
      })),
    };
  }

  /**
   * Initiate destruction request
   * Threshold: < 100 units = auto-approved, >= 100 = requires approval
   */
  async initiateDestruction(userId: string, dto: {
    productId: number;
    batchId: number;
    sgtin?: string;
    quantity: number;
    destructionReason: 'EXPIRED' | 'DAMAGED' | 'RECALLED' | 'QUARANTINED';
    justification: string;
    scheduledDate?: Date;
  }): Promise<ProductDestruction> {
    this.logger.log(`Initiating destruction for batch ${dto.batch_id}, quantity ${dto.quantity}`);

    // Validate batch exists and has sufficient quantity
    const batch = await this.batchRepo.findOne({ where: { id: dto.batch_id } });
    if (!batch) {
      throw new NotFoundException(`Batch ${dto.batch_id} not found`);
    }

    if (batch.qty < dto.quantity) {
      throw new BadRequestException(
        `Insufficient quantity in batch ${dto.batch_id}. Available: ${batch.qty}, Requested: ${dto.quantity}`
      );
    }

    // Determine status based on threshold
    const requiresApproval = dto.quantity >= 100;
    const status = requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

    // Create destruction request
    const destruction = this.destructionRepo.create({
      productId: dto.product_id,
      batchId: dto.batch_id,
      sgtin: dto.sgtin,
      quantity: dto.quantity,
      destructionReason: dto.destructionReason,
      destructionDate: dto.scheduledDate || new Date(),
      facilityUserId: userId,
      status,
      initiatedBy: userId,
      initiatedAt: new Date(),
      approvedBy: requiresApproval ? undefined : userId, // Auto-approve small quantities
      approvedAt: requiresApproval ? undefined : new Date(),
    });

    const saved = await this.destructionRepo.save(destruction);

    if (requiresApproval) {
      this.logger.log(`Destruction ${saved.id} requires approval (quantity: ${dto.quantity})`);
      // TODO: Notify approvers
    } else {
      this.logger.log(`Destruction ${saved.id} auto-approved (quantity: ${dto.quantity})`);
    }

    return saved;
  }

  /**
   * Approve destruction request
   */
  async approveDestruction(approverId: string, destructionId: number, notes?: string): Promise<ProductDestruction> {
    const destruction = await this.findOne(destructionId);

    if (destruction.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Destruction ${destructionId} is not pending approval (status: ${destruction.status})`);
    }

    // Update to approved
    destruction.status = 'APPROVED';
    destruction.approvedBy = approverId;
    destruction.approvedAt = new Date();
    if (notes) {
      destruction.approvalNotes = notes;
    }

    const saved = await this.destructionRepo.save(destruction);

    this.logger.log(`Destruction ${destructionId} approved by ${approverId}`);
    // TODO: Notify initiator

    return saved;
  }

  /**
   * Reject destruction request
   */
  async rejectDestruction(approverId: string, destructionId: number, reason: string): Promise<ProductDestruction> {
    const destruction = await this.findOne(destructionId);

    if (destruction.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Destruction ${destructionId} is not pending approval`);
    }

    destruction.status = 'REJECTED';
    destruction.approvalNotes = reason;

    this.logger.log(`Destruction ${destructionId} rejected by ${approverId}: ${reason}`);

    return this.destructionRepo.save(destruction);
  }

  /**
   * Complete destruction
   */
  async completeDestruction(userId: string, destructionId: number, dto: {
    witnessName?: string;
    witnessSignature?: string;
    complianceDocumentUrl?: string;
    actualDestructionDate?: Date;
    completionNotes?: string;
  }): Promise<ProductDestruction> {
    const destruction = await this.findOne(destructionId);

    if (destruction.status !== 'APPROVED') {
      throw new BadRequestException(`Destruction ${destructionId} is not approved (status: ${destruction.status})`);
    }

    // Update to completed
    destruction.status = 'COMPLETED';
    destruction.completedBy = userId;
    destruction.completedAt = new Date();
    destruction.witnessName = dto.witnessName;
    destruction.witnessSignature = dto.witnessSignature;
    destruction.complianceDocumentUrl = dto.complianceDocumentUrl;
    if (dto.actualDestructionDate) {
      destruction.destructionDate = dto.actualDestructionDate;
    }

    const saved = await this.destructionRepo.save(destruction);

    // Update batch inventory (remove destroyed quantity)
    await this.batchRepo.decrement(
      { id: destruction.batch_id },
      'qty',
      destruction.quantity
    );

    this.logger.log(`Destruction ${destructionId} completed by ${userId}, removed ${destruction.quantity} units from batch ${destruction.batch_id}`);

    // TODO: Generate EPCIS event for destruction
    // TODO: Update product status to DESTROYED

    return saved;
  }

  /**
   * Get destructions by status
   */
  async getByStatus(status: string): Promise<ProductDestruction[]> {
    return this.destructionRepo.find({
      where: { status },
      relations: ['product', 'batch', 'facility'],
      order: { destructionDate: 'DESC' },
    });
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<ProductDestruction[]> {
    return this.getByStatus('PENDING_APPROVAL');
  }
}
