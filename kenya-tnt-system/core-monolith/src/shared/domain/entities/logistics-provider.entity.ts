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
import { Location } from './location.entity';

@Entity('logistics_providers')
@Unique(['lspId'])
export class LogisticsProvider extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lsp_id' })
  lspId: string; // e.g., "LSP-001"

  @Column()
  name: string;

  // Legal Entity Information
  @Column({ name: 'registration_number', nullable: true })
  registrationNumber?: string;

  @Column({ name: 'permit_id', nullable: true })
  permitId?: string;

  @Column({ name: 'license_expiry_date', type: 'date', nullable: true })
  licenseExpiryDate?: Date;

  @Column({ default: 'Active' })
  status: string;

  // Contact Information
  @Column({ name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ name: 'contact_website', nullable: true })
  contactWebsite?: string;

  // HQ Location (V08: normalized to locations table)
  @Column({ name: 'hq_location_id', nullable: true })
  @Index()
  hqLocationId?: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'hq_location_id' })
  hqLocation?: Location;

  @Column({ name: 'hq_country', default: 'KE' })
  hqCountry: string;

  // HQ Geographic Data (V09: Restored for analytics)
  @Column({ name: 'hq_county', nullable: true })
  hqCounty?: string;

  // Identifiers
  @Column({ nullable: true })
  gln?: string;

  @Column({ name: 'gs1_prefix', nullable: true })
  gs1Prefix?: string;

  @Column({ name: 'ppb_code', nullable: true })
  ppbCode?: string;

  @Column({ name: 'last_updated', type: 'timestamp with time zone', nullable: true })
  lastUpdated?: Date;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;
}

