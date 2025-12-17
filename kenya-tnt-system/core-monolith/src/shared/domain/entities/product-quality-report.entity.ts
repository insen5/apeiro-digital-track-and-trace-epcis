import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product_quality_reports')
export class ProductQualityReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'report_date', type: 'timestamp with time zone' })
  reportDate: Date;

  @Column({ name: 'total_products' })
  totalProducts: number;

  @Column({ name: 'data_quality_score', type: 'decimal' })
  dataQualityScore: number;

  // Completeness metrics
  @Column({ name: 'missing_gtin' })
  missingGtin: number;

  @Column({ name: 'missing_brand_name' })
  missingBrandName: number;

  @Column({ name: 'missing_generic_name' })
  missingGenericName: number;

  @Column({ name: 'missing_ppb_code' })
  missingPpbCode: number;

  @Column({ name: 'missing_category' })
  missingCategory: number;

  @Column({ name: 'missing_strength' })
  missingStrength: number;

  @Column({ name: 'missing_route' })
  missingRoute: number;

  @Column({ name: 'missing_form' })
  missingForm: number;

  @Column({ name: 'missing_manufacturer' })
  missingManufacturer: number;

  @Column({ name: 'complete_records' })
  completeRecords: number;

  @Column({ name: 'completeness_percentage', type: 'decimal' })
  completenessPercentage: number;

  // Validity metrics
  @Column({ name: 'duplicate_gtins' })
  duplicateGtins: number;

  @Column({ name: 'invalid_gtin_format' })
  invalidGtinFormat: number;

  @Column({ name: 'duplicate_product_ids' })
  duplicateProductIds: number;

  // Full report as JSON for detailed analysis
  @Column({ name: 'full_report', type: 'jsonb' })
  fullReport: any;

  @Column({ name: 'triggered_by', nullable: true })
  triggeredBy: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'NOW()' })
  createdAt: Date;
}

