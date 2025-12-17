import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Supplier } from './supplier.entity';
import { Location } from './location.entity';

@Entity('premises')
@Unique(['premiseId'])
export class Premise extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplierId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.premises)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'premise_id' })
  premiseId: string; // e.g., "SUP-001-WH1"

  @Column({ name: 'legacy_premise_id', nullable: true })
  legacyPremiseId?: number;

  @Column({ name: 'premise_name' })
  premiseName: string;

  @Column({ nullable: true })
  gln?: string; // GLN not provided by PPB API - will be null until assigned

  @Column({ name: 'business_type', nullable: true })
  businessType?: string; // e.g., "WHOLESALE"

  @Column({ name: 'premise_classification', nullable: true })
  premiseClassification?: string; // e.g., "WAREHOUSE/DISTRIBUTION"

  @Column({ nullable: true })
  ownership?: string;

  // Superintendent Information
  @Column({ name: 'superintendent_name', nullable: true })
  superintendentName?: string;

  @Column({ name: 'superintendent_cadre', nullable: true })
  superintendentCadre?: string; // e.g., "PHARMACIST"

  @Column({ name: 'superintendent_registration_number', nullable: true })
  superintendentRegistrationNumber?: number;

  // License Information
  @Column({ name: 'ppb_license_number', nullable: true })
  ppbLicenseNumber?: string;

  @Column({ name: 'license_valid_until', type: 'date', nullable: true })
  licenseValidUntil?: Date;

  @Column({ name: 'license_validity_year', nullable: true })
  licenseValidityYear?: number;

  @Column({ name: 'license_status', nullable: true })
  licenseStatus?: string;

  // Geographic Data (V09: Restored for analytics performance)
  // Kept directly on entity for fast queries without JOINs
  // Also available via location relation for EPCIS compliance
  @Column({ nullable: true })
  @Index()
  county?: string;

  @Column({ nullable: true })
  constituency?: string;

  @Column({ nullable: true })
  ward?: string;

  // Location (V08: normalized to locations table)
  // Used for EPCIS events and detailed address data
  @Column({ name: 'location_id', nullable: true })
  @Index()
  locationId?: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ default: 'KE' })
  country: string;

  @Column({ default: 'Active' })
  status: string;

  @Column({ name: 'last_updated', type: 'timestamp with time zone', nullable: true })
  lastUpdated?: Date;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;
}

