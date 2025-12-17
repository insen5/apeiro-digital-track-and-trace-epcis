import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MasterDataService } from './master-data.service';

/**
 * Master Data Scheduler Service
 * Handles automated sync and quality audit tasks for all master data types
 */
@Injectable()
export class MasterDataSchedulerService {
  private readonly logger = new Logger(MasterDataSchedulerService.name);

  constructor(private readonly masterDataService: MasterDataService) {}

  /**
   * SYNC SCHEDULES
   * Sync products, premises, and UAT facilities every 3 hours
   */

  @Cron('0 */3 * * *', {
    name: 'sync-products',
    timeZone: 'Africa/Nairobi',
  })
  async syncProducts() {
    this.logger.log('🔄 Starting scheduled product sync (every 3 hours)');
    try {
      const result = await this.masterDataService.syncProductCatalog();
      this.logger.log(`✅ Product sync completed: ${result.inserted} inserted, ${result.updated} updated`);
    } catch (error) {
      this.logger.error('❌ Scheduled product sync failed:', error);
    }
  }

  @Cron('0 */3 * * *', {
    name: 'sync-premises',
    timeZone: 'Africa/Nairobi',
  })
  async syncPremises() {
    this.logger.log('🔄 Starting scheduled premise sync (every 3 hours)');
    try {
      const result = await this.masterDataService.syncPremiseCatalog();
      this.logger.log(`✅ Premise sync completed: ${result.inserted} inserted, ${result.updated} updated`);
    } catch (error) {
      this.logger.error('❌ Scheduled premise sync failed:', error);
    }
  }

  @Cron('0 */3 * * *', {
    name: 'sync-uat-facilities',
    timeZone: 'Africa/Nairobi',
  })
  async syncUatFacilities() {
    this.logger.log('🔄 Starting scheduled UAT facility sync (every 3 hours)');
    try {
      const result = await this.masterDataService.syncUatFacilities();
      this.logger.log(`✅ UAT facility sync completed: ${result.inserted} inserted, ${result.updated} updated`);
    } catch (error) {
      this.logger.error('❌ Scheduled UAT facility sync failed:', error);
    }
  }

  /**
   * QUALITY AUDIT SCHEDULES
   * Run comprehensive quality audits every Monday at 2 AM EAT
   */

  @Cron('0 2 * * 1', {
    name: 'weekly-product-audit',
    timeZone: 'Africa/Nairobi',
  })
  async runWeeklyProductAudit() {
    this.logger.log('📊 Starting weekly product quality audit');
    try {
      const snapshot = await this.masterDataService.saveProductQualitySnapshot(
        'scheduled-weekly',
        'Automated weekly quality audit'
      );
      this.logger.log(`✅ Product quality audit completed: Score ${snapshot.dataQualityScore}/100 (ID: ${snapshot.id})`);
    } catch (error) {
      this.logger.error('❌ Weekly product quality audit failed:', error);
    }
  }

  @Cron('0 2 * * 1', {
    name: 'weekly-premise-audit',
    timeZone: 'Africa/Nairobi',
  })
  async runWeeklyPremiseAudit() {
    this.logger.log('📊 Starting weekly premise quality audit');
    try {
      const snapshot = await this.masterDataService.saveQualityReportSnapshot(
        'scheduled-weekly',
        'Automated weekly quality audit'
      );
      this.logger.log(`✅ Premise quality audit completed: Score ${snapshot.dataQualityScore}/100 (ID: ${snapshot.id})`);
    } catch (error) {
      this.logger.error('❌ Weekly premise quality audit failed:', error);
    }
  }

  @Cron('0 2 * * 1', {
    name: 'weekly-uat-facility-audit',
    timeZone: 'Africa/Nairobi',
  })
  async runWeeklyUatFacilityAudit() {
    this.logger.log('📊 Starting weekly UAT facility quality audit');
    try {
      const snapshot = await this.masterDataService.generateUatFacilityDataQualityReport();
      this.logger.log(`✅ UAT facility quality audit completed`);
    } catch (error) {
      this.logger.error('❌ Weekly UAT facility quality audit failed:', error);
    }
  }

  /**
   * HEALTH CHECK
   * Log scheduler status every day at midnight
   */

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'scheduler-health-check',
    timeZone: 'Africa/Nairobi',
  })
  healthCheck() {
    this.logger.log('💚 Master Data Scheduler is running');
    this.logger.log('  - Product sync: Every 3 hours');
    this.logger.log('  - Premise sync: Every 3 hours');
    this.logger.log('  - UAT Facility sync: Every 3 hours');
    this.logger.log('  - Quality audits: Every Monday at 2 AM EAT');
  }
}

