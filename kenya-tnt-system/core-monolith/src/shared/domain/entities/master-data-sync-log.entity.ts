import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Master Data Sync Log Entity (Generic)
 * 
 * Tracks sync operations for all master data types (Product, Premise, Facility, etc.)
 * Provides audit trail and performance metrics for monitoring.
 */
@Entity('master_data_sync_logs')
@Index(['entityType'])
@Index(['syncStartedAt'])
@Index(['syncStatus'])
export class MasterDataSyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entity_type: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner' | 'supplier' | 'logistics_provider';

  @Column({ name: 'sync_started_at', type: 'timestamp' })
  syncStartedAt: Date;

  @Column({ name: 'sync_completed_at', type: 'timestamp', nullable: true })
  syncCompletedAt?: Date;

  @Column({ name: 'sync_status', type: 'varchar', length: 20 })
  syncStatus: 'in_progress' | 'completed' | 'failed';

  @Column({ name: 'records_fetched', type: 'integer', default: 0 })
  recordsFetched: number;

  @Column({ name: 'records_inserted', type: 'integer', default: 0 })
  recordsInserted: number;

  @Column({ name: 'records_updated', type: 'integer', default: 0 })
  recordsUpdated: number;

  @Column({ name: 'records_failed', type: 'integer', default: 0 })
  recordsFailed: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'last_updated_timestamp', type: 'timestamp', nullable: true })
  lastUpdatedTimestamp?: Date; // For incremental syncs

  @Column({ name: 'triggered_by', type: 'varchar', length: 100, nullable: true })
  triggeredBy?: string; // 'manual', 'cron', 'api', 'webhook'

  @Column({ name: 'custom_params', type: 'jsonb', nullable: true })
  customParams?: any; // Store any custom parameters used for sync

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
