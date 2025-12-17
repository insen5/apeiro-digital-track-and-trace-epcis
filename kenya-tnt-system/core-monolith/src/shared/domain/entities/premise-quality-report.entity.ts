import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('premise_quality_reports')
export class PremiseQualityReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'report_date', type: 'timestamp with time zone' })
  reportDate: Date;

  @Column({ name: 'total_premises' })
  totalPremises: number;

  @Column({ name: 'data_quality_score', type: 'decimal' })
  dataQualityScore: number;

  @Column({ name: 'missing_gln' })
  missingGln: number;

  @Column({ name: 'missing_county' })
  missingCounty: number;

  @Column({ name: 'missing_business_type' })
  missingBusinessType: number;

  @Column({ name: 'missing_ownership' })
  missingOwnership: number;

  @Column({ name: 'missing_superintendent' })
  missingSuperintendent: number;

  @Column({ name: 'missing_license_info' })
  missingLicenseInfo: number;

  @Column({ name: 'missing_location' })
  missingLocation: number;

  @Column({ name: 'missing_supplier_mapping', default: 0 })
  missingSupplierMapping: number;

  @Column({ name: 'complete_records' })
  completeRecords: number;

  @Column({ name: 'completeness_percentage', type: 'decimal' })
  completenessPercentage: number;

  @Column({ name: 'expired_licenses' })
  expiredLicenses: number;

  @Column({ name: 'expiring_soon' })
  expiringSoon: number;

  @Column({ name: 'valid_licenses' })
  validLicenses: number;

  @Column({ name: 'duplicate_premise_ids' })
  duplicatePremiseIds: number;

  @Column({ name: 'invalid_gln' })
  invalidGln: number;

  @Column({ name: 'full_report', type: 'jsonb' })
  fullReport: any;

  @Column({ name: 'triggered_by', nullable: true })
  triggeredBy: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'NOW()' })
  createdAt: Date;
}
