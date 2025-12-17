import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * PPBBatch - Minimal audit log for PPB imports
 * 
 * NOTE: This table is for audit/compliance purposes only. Most operational data
 * has been normalized to:
 * - batches table (for batch data)
 * - consignments table (for shipment data)
 * - manufacturers table (for manufacturer master data)
 * - parties/locations tables (for party/location master data)
 * 
 * See migrations V03, V04, V06 for normalization details.
 */
@Entity('ppb_batches')
export class PPBBatch {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  gtin: string;

  @Column({ name: 'product_code', type: 'varchar', length: 50 })
  @Index()
  productCode: string;

  @Column({ name: 'batch_number', type: 'varchar', length: 100, unique: true })
  @Index()
  batchNumber: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  status: string;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  @Index()
  expirationDate?: Date;

  @Column({ name: 'permit_id', type: 'varchar', length: 50, nullable: true })
  permitId?: string;

  @Column({ name: 'consignment_ref_number', type: 'varchar', length: 100, nullable: true })
  consignmentRefNumber?: string;

  // Serialization range as array (PPB-specific data kept for audit)
  @Column({ name: 'serialization_range', type: 'text', array: true, nullable: true })
  serializationRange?: string[];

  @Column({ name: 'is_partial_approval', type: 'boolean', nullable: true })
  isPartialApproval?: boolean;

  @Column({
    name: 'processed_status',
    type: 'varchar',
    length: 50,
    default: 'RECEIVED',
  })
  @Index()
  processedStatus: string;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError?: string;

  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  validationErrors?: any[];

  @Column({ name: 'validation_warnings', type: 'jsonb', nullable: true })
  validationWarnings?: any[];

  @Column({ name: 'validation_info', type: 'jsonb', nullable: true })
  validationInfo?: any[];

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'last_modified_date' })
  lastModifiedDate: Date;
}

