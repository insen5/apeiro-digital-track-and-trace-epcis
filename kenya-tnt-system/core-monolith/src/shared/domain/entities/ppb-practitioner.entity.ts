import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * PPB Practitioner Entity
 * 
 * Stores healthcare practitioners from PPB Catalogue API
 * Source: http://164.92.70.219:4010/catalogue-0.0.1/view/practionercatalogue
 */
@Entity('ppb_practitioners')
@Unique(['registrationNumber'])
export class PPBPractitioner {
  @PrimaryGeneratedColumn()
  id: number;

  // Practitioner Identification
  @Column({ name: 'practitioner_id', nullable: true })
  @Index()
  practitionerId: string;

  @Column({ name: 'registration_number', nullable: true })
  @Index()
  registrationNumber: string; // Professional registration number

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'middle_name', nullable: true })
  middleName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  // Professional Information
  @Column({ name: 'cadre', nullable: true })
  @Index()
  cadre?: string; // e.g., Pharmacist, Pharmaceutical Technologist, etc.

  @Column({ name: 'qualification', nullable: true })
  qualification?: string;

  @Column({ name: 'specialization', nullable: true })
  specialization?: string;

  // License Information
  @Column({ name: 'license_number', nullable: true })
  licenseNumber?: string;

  @Column({ name: 'license_status', nullable: true })
  @Index()
  licenseStatus?: string; // Active, Suspended, Expired

  @Column({ name: 'license_valid_from', type: 'date', nullable: true })
  licenseValidFrom?: Date;

  @Column({ name: 'license_valid_until', type: 'date', nullable: true })
  @Index()
  licenseValidUntil?: Date;

  @Column({ name: 'license_validity_year', nullable: true })
  licenseValidityYear?: number;

  // Contact Information
  @Column({ name: 'email', nullable: true })
  email?: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'mobile_number', nullable: true })
  mobileNumber?: string;

  // Location/Address Information
  @Column({ name: 'county', nullable: true })
  @Index()
  county?: string;

  @Column({ name: 'sub_county', nullable: true })
  subCounty?: string;

  @Column({ name: 'constituency', nullable: true })
  constituency?: string;

  @Column({ name: 'ward', nullable: true })
  ward?: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column({ name: 'address_line1', nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line2', nullable: true })
  addressLine2?: string;

  // Employment/Practice Information
  @Column({ name: 'practice_type', nullable: true })
  practiceType?: string; // e.g., Private, Public, Both

  @Column({ name: 'employer_name', nullable: true })
  employerName?: string;

  @Column({ name: 'facility_name', nullable: true })
  facilityName?: string;

  @Column({ name: 'facility_mfl_code', nullable: true })
  facilityMflCode?: string;

  // Regulatory Council Information
  @Column({ name: 'regulatory_body', nullable: true })
  regulatoryBody?: string; // e.g., PPB, Pharmacy and Poisons Board

  @Column({ name: 'council_registration_date', type: 'date', nullable: true })
  councilRegistrationDate?: Date;

  // Status
  @Column({ default: 'Active' })
  @Index()
  status: string; // Active, Inactive, Suspended

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'is_test', default: false })
  @Index()
  isTest: boolean;

  // Sync Metadata
  @Column({ name: 'last_synced_at', type: 'timestamp with time zone', nullable: true })
  @Index()
  lastSyncedAt?: Date;

  @Column({ name: 'source_system', default: 'PPB_CATALOGUE' })
  sourceSystem: string;

  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData?: Record<string, any>; // Store original API response

  // Timestamps (snake_case for database, camelCase for TypeScript)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
