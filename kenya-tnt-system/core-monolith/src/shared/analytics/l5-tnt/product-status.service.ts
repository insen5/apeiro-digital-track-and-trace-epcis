import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStatus } from '../../domain/entities/product-status.entity';
import { User } from '../../domain/entities/user.entity';
import { CreateProductStatusDto } from './dto/create-product-status.dto';

@Injectable()
export class ProductStatusService {
  private readonly logger = new Logger(ProductStatusService.name);

  constructor(
    @InjectRepository(ProductStatus)
    private readonly productStatusRepo: Repository<ProductStatus>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Create a product status change
   */
  async create(
    userId: string,
    dto: CreateProductStatusDto,
  ): Promise<ProductStatus> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get previous status if product/batch exists
    let previousStatus: string | undefined;
    if (dto.productId || dto.batchId || dto.sgtin) {
      const previous = await this.productStatusRepo.findOne({
        where: [
          dto.productId ? { productId: dto.productId } : {},
          dto.batchId ? { batchId: dto.batchId } : {},
          dto.sgtin ? { sgtin: dto.sgtin } : {},
        ],
        order: { statusDate: 'DESC' },
      });
      previousStatus = previous?.status;
    }

    const productStatus = this.productStatusRepo.create({
      productId: dto.productId,
      batchId: dto.batchId,
      sgtin: dto.sgtin,
      status: dto.status,
      previousStatus,
      actorUserId: userId,
      actorType: dto.actorType || 'manufacturer',
      notes: dto.notes,
    });

    return this.productStatusRepo.save(productStatus);
  }

  /**
   * Get all status changes for a product/batch/sgtin
   */
  async findByProduct(
    productId?: number,
    batchId?: number,
    sgtin?: string,
  ): Promise<ProductStatus[]> {
    const where: any = {};
    if (productId) where.productId = productId;
    if (batchId) where.batchId = batchId;
    if (sgtin) where.sgtin = sgtin;

    return this.productStatusRepo.find({
      where,
      relations: ['actor'],
      order: { statusDate: 'DESC' },
    });
  }

  /**
   * Get current status for a product/batch/sgtin
   */
  async getCurrentStatus(
    productId?: number,
    batchId?: number,
    sgtin?: string,
  ): Promise<ProductStatus | null> {
    const where: any = {};
    if (productId) where.productId = productId;
    if (batchId) where.batchId = batchId;
    if (sgtin) where.sgtin = sgtin;

    return this.productStatusRepo.findOne({
      where,
      relations: ['actor'],
      order: { statusDate: 'DESC' },
    });
  }

  /**
   * Update product status with authorization check
   */
  async updateStatus(userId: string, dto: CreateProductStatusDto): Promise<ProductStatus> {
    // Check if user has permission for sensitive status changes
    if (['STOLEN', 'LOST'].includes(dto.status)) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // TODO: Implement proper role checking when auth is fully implemented
      // For now, just log the sensitive status change
      this.logger.warn(
        `Sensitive status change (${dto.status}) initiated by user ${userId}`,
      );
    }

    // Validate status transition if previous status exists
    const current = await this.getCurrentStatus(dto.productId, dto.batchId, dto.sgtin);
    if (current) {
      this.validateStatusTransition(current.status, dto.status);
    }

    return this.create(userId, dto);
  }

  /**
   * Bulk status update for multiple products
   */
  async bulkUpdateStatus(
    userId: string,
    updates: CreateProductStatusDto[]
  ): Promise<ProductStatus[]> {
    this.logger.log(`Bulk status update: ${updates.length} products by user ${userId}`);

    const results: ProductStatus[] = [];

    for (const dto of updates) {
      try {
        const status = await this.updateStatus(userId, dto);
        results.push(status);
      } catch (error) {
        this.logger.error(`Failed to update status for product ${dto.productId || dto.batchId || dto.sgtin}:`, error.message);
        // Continue with other updates
      }
    }

    return results;
  }

  /**
   * Get status-based report
   */
  async getStatusReport(
    status?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    status: string;
    count: number;
    products: ProductStatus[];
  }[]> {
    const queryBuilder = this.productStatusRepo
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.product', 'product')
      .leftJoinAndSelect('ps.batch', 'batch')
      .leftJoinAndSelect('ps.actor', 'actor');

    if (status) {
      queryBuilder.where('ps.status = :status', { status });
    }

    if (dateRange) {
      queryBuilder.andWhere('ps.statusDate BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    const statuses = await queryBuilder.getMany();

    // Group by status
    const grouped = statuses.reduce((acc, curr) => {
      const key = curr.status;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(curr);
      return {};
    }, {} as Record<string, ProductStatus[]>);

    return Object.entries(grouped).map(([status, products]) => ({
      status,
      count: products.length,
      products,
    }));
  }

  /**
   * Get all statuses grouped by type
   */
  async getStatusSummary(): Promise<{
    status: string;
    count: number;
    latestDate: Date;
  }[]> {
    const result = await this.productStatusRepo
      .createQueryBuilder('ps')
      .select('ps.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(ps.statusDate)', 'latestDate')
      .groupBy('ps.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
      latestDate: r.latestDate,
    }));
  }

  /**
   * Validate status transition
   * Prevents invalid status changes (e.g., STOLEN → ACTIVE)
   */
  private validateStatusTransition(fromStatus: string, toStatus: string): void {
    // Define invalid transitions
    const invalidTransitions: Record<string, string[]> = {
      STOLEN: ['ACTIVE', 'SAMPLE'], // Stolen products can't become active or samples
      LOST: ['ACTIVE', 'SAMPLE'], // Lost products can't become active or samples
      DISPENSING: ['ACTIVE'], // Dispensed products can't become active again
    };

    if (invalidTransitions[fromStatus]?.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${fromStatus} → ${toStatus} is not allowed`
      );
    }
  }

  /**
   * Check if user has permission for status change
   * TODO: Integrate with actual RBAC when implemented
   */
  private async checkPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // TODO: Implement proper RBAC
    // For now, allow all users but log sensitive operations
    this.logger.log(`Permission check: ${userId} requesting ${permission}`);
    return true;
  }
}

