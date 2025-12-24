import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { PPBProduct } from '../../../shared/domain/entities/ppb-product.entity';

/**
 * Analytics Service (Regulator Module)
 *
 * Provides analytics queries using single database.
 * Can use materialized views for better performance (to be implemented in Phase 7).
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(PPBProduct)
    private readonly productRepo: Repository<PPBProduct>,
  ) {}

  /**
   * Get shipment statistics
   */
  async getShipmentStats(): Promise<any> {
    const [total, dispatched, pending] = await Promise.all([
      this.shipmentRepo.count({ where: { is_deleted: false } }),
      this.shipmentRepo.count({
        where: { is_dispatched: true, is_deleted: false },
      }),
      this.shipmentRepo.count({
        where: { is_dispatched: false, is_deleted: false },
      }),
    ]);

    return {
      total,
      dispatched,
      pending,
    };
  }

  /**
   * Get batch expiry statistics
   */
  async getBatchExpiryStats(): Promise<any> {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const [expiringSoon, expiringLater, expired] = await Promise.all([
      this.batchRepo.count({
        where: {
          expiry: Between(now, thirtyDays),
          is_enabled: true,
        },
      }),
      this.batchRepo.count({
        where: {
          expiry: Between(thirtyDays, sixtyDays),
          is_enabled: true,
        },
      }),
      this.batchRepo.count({
        where: {
          expiry: LessThan(now),
          is_enabled: true,
        },
      }),
    ]);

    return {
      expiringSoon, // Within 30 days
      expiringLater, // 30-60 days
      expired,
    };
  }

  /**
   * Get product statistics
   * Note: PPBProduct doesn't have isEnabled field - all products in catalog are active
   */
  async getProductStats(): Promise<any> {
    const total = await this.productRepo.count();

    return {
      total,
      enabled: total, // All products in PPB catalog are considered enabled
      disabled: 0,
    };
  }
}

// Import TypeORM operators
import { Between, LessThan } from 'typeorm';

