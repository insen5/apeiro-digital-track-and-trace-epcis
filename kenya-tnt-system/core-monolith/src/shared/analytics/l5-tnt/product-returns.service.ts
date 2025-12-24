import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { ProductReturns } from '../../domain/entities/product-returns.entity';
import { Batch } from '../../domain/entities/batch.entity';
import { PPBProduct } from '../../domain/entities/ppb-product.entity';

@Injectable()
export class ProductReturnsService {
  private readonly logger = new Logger(ProductReturnsService.name);

  constructor(
    @InjectRepository(ProductReturns)
    private readonly returnsRepo: Repository<ProductReturns>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(PPBProduct)
    private readonly productRepo: Repository<PPBProduct>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 50,
    fromActorUserId?: string,
    toActorUserId?: string,
    productId?: number,
    batchId?: number,
    returnType?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: ProductReturns[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.returnsRepo
      .createQueryBuilder('return')
      .leftJoinAndSelect('return.product', 'product')
      .leftJoinAndSelect('return.batch', 'batch')
      .leftJoinAndSelect('return.fromActor', 'fromActor')
      .leftJoinAndSelect('return.toActor', 'toActor');

    if (fromActorUserId) {
      queryBuilder.andWhere('return.fromActorUserId = :fromActorUserId', {
        fromActorUserId,
      });
    }
    if (toActorUserId) {
      queryBuilder.andWhere('return.toActorUserId = :toActorUserId', {
        toActorUserId,
      });
    }
    if (productId) {
      queryBuilder.andWhere('return.product_id = :productId', { productId });
    }
    if (batchId) {
      queryBuilder.andWhere('return.batch_id = :batchId', { batchId });
    }
    if (returnType) {
      queryBuilder.andWhere('return.returnType = :returnType', { returnType });
    }
    if (status) {
      queryBuilder.andWhere('return.status = :status', { status });
    }
    if (startDate) {
      queryBuilder.andWhere('return.returnDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('return.returnDate <= :endDate', { endDate });
    }

    queryBuilder.orderBy('return.returnDate', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<ProductReturns> {
    const returnRecord = await this.returnsRepo.findOne({
      where: { id },
      relations: ['product', 'batch', 'fromActor', 'toActor'],
    });

    if (!returnRecord) {
      throw new NotFoundException(`Return record with ID ${id} not found`);
    }

    return returnRecord;
  }

  async create(data: Partial<ProductReturns>): Promise<ProductReturns> {
    const returnRecord = this.returnsRepo.create(data);
    return await this.returnsRepo.save(returnRecord);
  }

  async update(
    id: number,
    data: Partial<ProductReturns>,
  ): Promise<ProductReturns> {
    await this.findOne(id); // Verify exists
    await this.returnsRepo.update(id, data);
    return this.findOne(id);
  }

  async updateStatus(
    id: number,
    status: string,
    notes?: string,
  ): Promise<ProductReturns> {
    const updateData: Partial<ProductReturns> = { status };
    if (notes) updateData.notes = notes;
    return this.update(id, updateData);
  }

  async delete(id: number): Promise<void> {
    await this.findOne(id); // Verify exists
    await this.returnsRepo.delete(id);
  }

  async getReturnsStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    totalQuantity: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byReason: Record<string, number>;
  }> {
    const queryBuilder = this.returnsRepo.createQueryBuilder('return');

    if (startDate) {
      queryBuilder.andWhere('return.returnDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('return.returnDate <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();
    const totalQuantityResult = await queryBuilder
      .select('SUM(return.quantity)', 'total')
      .getRawOne();

    const byStatusResults = await queryBuilder
      .select('return.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('return.status')
      .getRawMany();

    const byTypeResults = await queryBuilder
      .select('return.returnType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('return.returnType')
      .getRawMany();

    const byReasonResults = await queryBuilder
      .select('return.returnReason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('return.returnReason')
      .getRawMany();

    const byStatus: Record<string, number> = {};
    byStatusResults.forEach((r) => {
      byStatus[r.status] = parseInt(r.count);
    });

    const byType: Record<string, number> = {};
    byTypeResults.forEach((r) => {
      byType[r.type] = parseInt(r.count);
    });

    const byReason: Record<string, number> = {};
    byReasonResults.forEach((r) => {
      byReason[r.reason] = parseInt(r.count);
    });

    return {
      total,
      totalQuantity: parseFloat(totalQuantityResult?.total || '0'),
      byStatus,
      byType,
      byReason,
    };
  }

  /**
   * Return Receiving Workflow
   * Process returned products from facilities/customers
   */
  async createReturnReceipt(userId: string, dto: {
    referenceDocumentNumber?: string;
    sscc?: string;
    batchId: number;
    productId: number;
    sgtin?: string;
    quantity: number;
    qualityCheck: 'ACCEPTABLE' | 'DAMAGED' | 'EXPIRED';
    from_actor_user_id: string;
    notes?: string;
  }): Promise<ProductReturns> {
    this.logger.log(`Creating return receipt for batch ${dto.batch_id} from user ${dto.fromActorUserId}`);

    // Validate batch exists
    const batch = await this.batchRepo.findOne({ where: { id: dto.batch_id } });
    if (!batch) {
      throw new NotFoundException(`Batch ${dto.batch_id} not found`);
    }

    // Determine return reason based on quality check
    const returnReason = dto.qualityCheck === 'DAMAGED' ? 'DEFECTIVE' 
      : dto.qualityCheck === 'EXPIRED' ? 'EXPIRED'
      : 'CUSTOMER_RETURN';

    // Create return receipt
    const returnReceipt = this.returnsRepo.create({
      returnType: 'RETURN_RECEIVING',
      productId: dto.product_id,
      batchId: dto.batch_id,
      sgtin: dto.sgtin,
      quantity: dto.quantity,
      returnReason,
      from_actor_user_id: dto.fromActorUserId,
      to_actor_user_id: userId, // Current user is receiving
      reference_document_number: dto.referenceDocumentNumber,
      returnDate: new Date(),
      status: dto.qualityCheck === 'ACCEPTABLE' ? 'PROCESSED' : 'PENDING', // Auto-process acceptable returns
      notes: dto.notes,
    });

    const saved = await this.returnsRepo.save(returnReceipt);

    // Update batch inventory if return is acceptable
    if (dto.qualityCheck === 'ACCEPTABLE') {
      await this.batchRepo.increment(
        { id: dto.batch_id },
        'qty',
        dto.quantity
      );
      this.logger.log(`Added ${dto.quantity} units back to batch ${dto.batch_id} inventory`);
    }

    this.logger.log(`Return receipt created: ID ${saved.id}`);

    // TODO: Generate EPCIS event for return receiving
    // TODO: Update product status if quality check failed

    return saved;
  }

  /**
   * Return Shipping Workflow
   * Ship products back to manufacturer or another location
   */
  async createReturnShipment(userId: string, dto: {
    destinationGLN?: string;
    referenceDocumentNumber?: string;
    batchId: number;
    productId: number;
    sgtin?: string;
    quantity: number;
    return_reason: 'DEFECTIVE' | 'EXPIRED' | 'OVERSTOCK' | 'CUSTOMER_RETURN';
    to_actor_user_id: string;
    notes?: string;
  }): Promise<ProductReturns> {
    this.logger.log(`Creating return shipment for batch ${dto.batch_id} to user ${dto.toActorUserId}`);

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

    // Create return shipment
    const returnShipment = this.returnsRepo.create({
      returnType: 'RETURN_SHIPPING',
      productId: dto.product_id,
      batchId: dto.batch_id,
      sgtin: dto.sgtin,
      quantity: dto.quantity,
      return_reason: dto.returnReason,
      from_actor_user_id: userId, // Current user is shipping
      to_actor_user_id: dto.toActorUserId,
      reference_document_number: dto.referenceDocumentNumber,
      returnDate: new Date(),
      status: 'PENDING', // Awaiting receipt by recipient
      notes: dto.notes,
    });

    const saved = await this.returnsRepo.save(returnShipment);

    // Update batch inventory (deduct quantity)
    await this.batchRepo.decrement(
      { id: dto.batch_id },
      'qty',
      dto.quantity
    );

    // Also update sentQty
    await this.batchRepo.increment(
      { id: dto.batch_id },
      'sentQty',
      dto.quantity
    );

    this.logger.log(`Return shipment created: ID ${saved.id}, removed ${dto.quantity} units from batch ${dto.batch_id}`);

    // TODO: Generate new SSCC for return shipment
    // TODO: Generate EPCIS event for return shipping

    return saved;
  }

  /**
   * Process return (approve/reject)
   */
  async processReturn(
    userId: string,
    returnId: number,
    decision: 'PROCESSED' | 'REJECTED',
    notes?: string
  ): Promise<ProductReturns> {
    const returnRecord = await this.findOne(returnId);

    if (returnRecord.status !== 'PENDING') {
      throw new BadRequestException(`Return ${returnId} is already ${returnRecord.status}`);
    }

    // Update status
    returnRecord.status = decision;
    if (notes) {
      returnRecord.notes = (returnRecord.notes || '') + `\n[Processing by ${userId}]: ${notes}`;
    }

    // If rejected, may need to reverse inventory changes
    if (decision === 'REJECTED' && returnRecord.returnType === 'RETURN_RECEIVING') {
      // Remove the quantity that was added back
      await this.batchRepo.decrement(
        { id: returnRecord.batch_id },
        'qty',
        returnRecord.quantity
      );
      this.logger.log(`Rejected return ${returnId}, removed ${returnRecord.quantity} units from batch ${returnRecord.batch_id}`);
    }

    return await this.returnsRepo.save(returnRecord);
  }

  /**
   * Get returns by status
   */
  async getReturnsByStatus(status: string): Promise<ProductReturns[]> {
    return this.returnsRepo.find({
      where: { status },
      relations: ['product', 'batch', 'fromActor', 'toActor'],
      order: { returnDate: 'DESC' },
    });
  }
}
