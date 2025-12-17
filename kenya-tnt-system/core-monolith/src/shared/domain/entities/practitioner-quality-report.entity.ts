import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('practitioner_quality_reports')
export class PractitionerQualityReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'report_date', type: 'timestamp with time zone' })
  reportDate: Date;

  @Column({ name: 'total_practitioners' })
  totalPractitioners: number;

  @Column({ name: 'data_quality_score', type: 'decimal' })
  dataQualityScore: number;

  // Completeness metrics
  @Column({ name: 'missing_email' })
  missingEmail: number;

  @Column({ name: 'missing_phone' })
  missingPhone: number;

  @Column({ name: 'missing_county' })
  missingCounty: number;

  @Column({ name: 'missing_cadre' })
  missingCadre: number;

  @Column({ name: 'missing_license_info' })
  missingLicenseInfo: number;

  @Column({ name: 'missing_facility' })
  missingFacility: number;

  @Column({ name: 'missing_address' })
  missingAddress: number;

  @Column({ name: 'complete_records' })
  completeRecords: number;

  @Column({ name: 'completeness_percentage', type: 'decimal' })
  completenessPercentage: number;

  // Validity metrics
  @Column({ name: 'expired_licenses' })
  expiredLicenses: number;

  @Column({ name: 'expiring_soon' })
  expiringSoon: number;

  @Column({ name: 'valid_licenses' })
  validLicenses: number;

  @Column({ name: 'duplicate_registration_numbers' })
  duplicateRegistrationNumbers: number;

  @Column({ name: 'invalid_email' })
  invalidEmail: number;

  @Column({ name: 'full_report', type: 'jsonb' })
  fullReport: any;

  @Column({ name: 'triggered_by', nullable: true })
  triggeredBy: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'NOW()' })
  createdAt: Date;
}
