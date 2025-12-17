import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PPBApiService } from '../../../shared/infrastructure/external/ppb-api.service';
import { SafaricomHieApiService } from '../../../shared/infrastructure/external/safaricom-hie-api.service';
import { getSyncConfig } from './master-data-sync.config';
import { MasterDataSyncLog } from '../../../shared/domain/entities/master-data-sync-log.entity';

/**
 * Generic Sync Service
 * Single implementation for all master data types (mirroring QualityAlertService pattern)
 */

@Injectable()
export class GenericSyncService {
  private readonly logger = new Logger(GenericSyncService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly ppbApiService: PPBApiService,
    private readonly safaricomHieApiService: SafaricomHieApiService,
  ) {}

  /**
   * Sync any entity type using configuration
   * (Like checkAndAlert in QualityAlertService)
   * NOW WITH SYNC LOGGING FOR AUDIT TRAIL
   */
  async sync(
    entityType: string,
    customParams?: any,
    triggeredBy: string = 'manual'
  ): Promise<{ inserted: number; updated: number; errors: number; total: number; success: boolean; lastSyncedAt: Date }> {
    const config = getSyncConfig(entityType); // ⬅ Config-driven (like quality alerts)
    
    if (!config.enabled) {
      this.logger.debug(`Sync disabled for ${entityType}`);
      return { inserted: 0, updated: 0, errors: 0, total: 0, success: false, lastSyncedAt: new Date() };
    }

    const startTime = new Date();
    let inserted = 0, updated = 0, errors = 0;
    let syncLog: MasterDataSyncLog | null = null;

    // Create sync log if enabled
    if (config.syncLogging?.enabled) {
      const syncLogRepo = this.dataSource.getRepository(MasterDataSyncLog);
      syncLog = syncLogRepo.create({
        entityType: entityType as any,
        syncStartedAt: startTime,
        syncStatus: 'in_progress',
        triggeredBy,
        customParams,
      });
      await syncLogRepo.save(syncLog);
    }

    this.logger.log(`Starting ${config.syncLogging?.entityTypeLabel || config.entityType} sync...`);

    try {
      // Handle incremental sync if configured
      let lastSync: Date | null = null;
      if (config.incrementalSync?.enabled) {
        lastSync = await this.getLastSyncTimestamp(config);
        if (syncLog) {
          syncLog.lastUpdatedTimestamp = lastSync;
          await this.dataSource.getRepository(MasterDataSyncLog).save(syncLog);
        }
        this.logger.log(`Incremental sync from ${lastSync.toISOString()}`);
      }

      // 1. Fetch data using config
      const apiService = this.getApiService(config.apiSource.serviceName);
      let items: any[];
      
      // Handle special case for premise with custom email/password
      if (entityType === 'premise' && customParams?.email && customParams?.password) {
        items = await this.ppbApiService.getPremisesWithCredentials(customParams.email, customParams.password);
      } else if (config.incrementalSync?.enabled && lastSync) {
        // Incremental sync: pass lastUpdated parameter
        items = await apiService[config.apiSource.method]({ lastUpdated: lastSync });
      } else {
        items = await apiService[config.apiSource.method](customParams || config.apiSource.params);
      }
      
      // Handle empty/null response
      items = Array.isArray(items) ? items : [];
      
      this.logger.log(`Fetched ${items.length} ${config.entityType} records`);

      // Update sync log with fetched count
      if (syncLog) {
        syncLog.recordsFetched = items.length;
        await this.dataSource.getRepository(MasterDataSyncLog).save(syncLog);
      }

      // Warn if no records (helpful for debugging)
      if (items.length === 0 && config.incrementalSync?.enabled) {
        this.logger.warn(`No ${config.entityType} records returned. This may indicate:`);
        this.logger.warn('  1. No records have been updated since last sync');
        this.logger.warn('  2. API is unavailable or returning empty data');
        this.logger.warn('  3. Environment may not have data yet');
      }

      // 2. Get repository
      const repository = this.dataSource.getRepository(config.tableName);

      // 3. Process in batches
      for (let i = 0; i < items.length; i += config.batchSize) {
        const batch = items.slice(i, i + config.batchSize);

        for (const apiItem of batch) {
          try {
            // Map fields using config FIRST
            const normalized = this.mapFields(apiItem, config.fieldMappings);

            // Extract unique identifier
            const uniqueValue = this.extractValue(apiItem, config.uniqueField, config.fieldMappings);

            // Validate required fields using mapped values (not raw API fields)
            const isValid = uniqueValue !== null && uniqueValue !== undefined && uniqueValue !== '';
            
            if (!isValid) {
              this.logger.warn(
                `Skipping ${config.entityType} - uniqueField=${config.uniqueField}, uniqueValue=${uniqueValue}, ` +
                `apiKeys=[${Object.keys(apiItem).join(',')}], ` +
                `sample=${JSON.stringify(apiItem).substring(0, 300)}`
              );
              errors++;
              continue;
            }

            // Find existing
            const existing = await repository.findOne({
              where: { [config.uniqueField]: uniqueValue } as any,
            });

            if (existing) {
              // Update
              Object.assign(existing, normalized);
              existing.lastSyncedAt = new Date();
              // Handle premise-specific lastUpdated field
              if (entityType === 'premise' && 'lastUpdated' in existing) {
                existing.lastUpdated = new Date();
              }
              await repository.save(existing);
              updated++;
            } else {
              // Insert
              const newEntity = repository.create({
                ...normalized,
                lastSyncedAt: new Date(),
                // Premise-specific defaults
                ...(entityType === 'premise' && { country: 'KE', status: 'Active' }),
              });
              await repository.save(newEntity);
              inserted++;
            }
          } catch (error: any) {
            this.logger.error(`Error syncing ${config.entityType}:`, error.message);
            errors++;
          }
        }

        // Progress logging
        if ((i + config.batchSize) % 500 === 0) {
          this.logger.log(`Progress: ${i + config.batchSize}/${items.length}`);
        }
      }

      // Update sync log - SUCCESS
      if (syncLog) {
        syncLog.syncCompletedAt = new Date();
        syncLog.syncStatus = 'completed';
        syncLog.recordsInserted = inserted;
        syncLog.recordsUpdated = updated;
        syncLog.recordsFailed = errors;
        await this.dataSource.getRepository(MasterDataSyncLog).save(syncLog);
      }

      this.logger.log(`${config.entityType} sync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);

      return { inserted, updated, errors, total: items.length, success: true, lastSyncedAt: startTime };
    } catch (error: any) {
      // Update sync log - FAILURE
      if (syncLog) {
        syncLog.syncCompletedAt = new Date();
        syncLog.syncStatus = 'failed';
        syncLog.errorMessage = error.message;
        syncLog.recordsFailed = errors;
        await this.dataSource.getRepository(MasterDataSyncLog).save(syncLog);
      }

      this.logger.error(`Sync failed for ${config.entityType}:`, error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp for incremental syncs
   */
  private async getLastSyncTimestamp(config: any): Promise<Date> {
    if (!config.incrementalSync?.enabled) {
      return new Date();
    }

    const repository = this.dataSource.getRepository(config.tableName);
    const lastEntity = await repository
      .createQueryBuilder('entity')
      .select(`MAX(entity.${config.incrementalSync.timestampField})`, 'lastSync')
      .getRawOne();

    if (lastEntity?.lastSync) {
      return new Date(lastEntity.lastSync);
    }

    // Default: lookback period for first sync
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() - config.incrementalSync.defaultLookbackMonths);
    return defaultDate;
  }

  /**
   * Map API fields to database fields using config
   */
  private mapFields(apiData: any, mappings: Record<string, string | Function>): any {
    const result: any = {};
    
    for (const [dbField, mapping] of Object.entries(mappings)) {
      if (typeof mapping === 'function') {
        result[dbField] = mapping(apiData);
      } else {
        result[dbField] = apiData[mapping];
      }
    }
    
    return result;
  }

  private extractValue(apiData: any, field: string, mappings: Record<string, any>): any {
    const mapping = mappings[field];
    return typeof mapping === 'function' ? mapping(apiData) : apiData[mapping];
  }

  private getApiService(serviceName: string): any {
    if (serviceName === 'PPBApiService') return this.ppbApiService;
    if (serviceName === 'SafaricomHieApiService') return this.safaricomHieApiService;
    throw new Error(`Unknown API service: ${serviceName}`);
  }
}
