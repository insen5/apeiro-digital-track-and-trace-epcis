import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * UAT Facility Entity
 * 
 * Represents healthcare facility master data synced from Safaricom HIE Facility Registry API.
 * Used for track and trace operations in the Kenya TNT system.
 * 
 * Data Source: Safaricom Health Information Exchange (HIE) Facility Registry API
 * Sync Method: Incremental sync every 3 hours using lastUpdated parameter
 * 
 * Note: GLN field is NULL from API - requires manual assignment via GS1 Kenya
 */
@Entity('uat_facilities')
@Index(['facilityCode'], { unique: true })
@Index(['mflCode'])
@Index(['county'])
@Index(['facilityType'])
@Index(['operationalStatus'])
@Index(['lastSyncedAt'])
export class UatFacility {
  @PrimaryGeneratedColumn()
  id: number;

  // ==================== Safaricom HIE Identifiers ====================
  
  @Column({ name: 'facility_code', type: 'varchar', length: 100, unique: true })
  facilityCode: string; // Primary identifier from Safaricom HIE

  @Column({ name: 'mfl_code', type: 'varchar', length: 50, nullable: true })
  mflCode?: string; // Master Facility List code (MOH)

  @Column({ name: 'kmhfl_code', type: 'varchar', length: 50, nullable: true })
  kmhflCode?: string; // Kenya Master Health Facility List code

  // ==================== Basic Information ====================

  @Column({ name: 'facility_name', type: 'varchar', length: 500 })
  facilityName: string;

  @Column({ name: 'facility_type', type: 'varchar', length: 100, nullable: true })
  facilityType?: string; // Hospital, Health Centre, Dispensary, Medical Clinic, etc.

  @Column({ name: 'ownership', type: 'varchar', length: 100, nullable: true })
  ownership?: string; // Government, Private, FBO, NGO, Parastatal

  // ==================== Location ====================

  @Column({ name: 'county', type: 'varchar', length: 100, nullable: true })
  county?: string;

  @Column({ name: 'sub_county', type: 'varchar', length: 100, nullable: true })
  subCounty?: string;

  @Column({ name: 'constituency', type: 'varchar', length: 100, nullable: true })
  constituency?: string;

  @Column({ name: 'ward', type: 'varchar', length: 100, nullable: true })
  ward?: string;

  // ==================== Address ====================

  @Column({ name: 'address_line1', type: 'varchar', length: 255, nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  // ==================== Contact ====================

  @Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email?: string;

  // ==================== GS1 Identifier ====================

  @Column({ name: 'gln', type: 'varchar', length: 13, nullable: true })
  gln?: string; // NULL from API - manual assignment via GS1 Kenya

  // ==================== Operating Status ====================

  @Column({ name: 'operational_status', type: 'varchar', length: 50, nullable: true })
  operationalStatus?: string; // Active, Inactive, Temporarily Closed

  @Column({ name: 'license_status', type: 'varchar', length: 50, nullable: true })
  licenseStatus?: string;

  @Column({ name: 'license_valid_until', type: 'date', nullable: true })
  licenseValidUntil?: Date;

  // ==================== KEPH Classification ====================

  @Column({ name: 'keph_level', type: 'varchar', length: 50, nullable: true })
  kephLevel?: string; // Kenya Essential Package for Health level (e.g., "Level 2", "Level 3", ... "Level 6")

  // ==================== Services ====================

  @Column({ name: 'services_offered', type: 'text', array: true, nullable: true })
  servicesOffered?: string[]; // PostgreSQL array

  @Column({ name: 'beds_capacity', type: 'integer', nullable: true })
  bedsCapacity?: number;

  // ==================== Geolocation ====================

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // ==================== Metadata ====================

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ name: 'last_synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * UAT Facilities Sync Log Entity
 * 
 * Tracks sync operations for audit and monitoring purposes.
 */
@Entity('uat_facilities_sync_log')
@Index(['syncStartedAt'])
@Index(['syncStatus'])
export class UatFacilitiesSyncLog {
  @PrimaryGeneratedColumn()
  id: number;

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
  lastUpdatedTimestamp?: Date; // The lastUpdated parameter used in API call

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * UAT Facilities Quality Audit Entity
 * 
 * Stores historical data quality metrics for trend analysis.
 */
@Entity('uat_facilities_quality_audit')
@Index(['auditDate'])
export class UatFacilitiesQualityAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'audit_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  auditDate: Date;

  @Column({ name: 'total_facilities', type: 'integer' })
  totalFacilities: number;

  @Column({ name: 'active_facilities', type: 'integer', default: 0 })
  activeFacilities: number;

  @Column({ name: 'inactive_facilities', type: 'integer', default: 0 })
  inactiveFacilities: number;

  // Completeness metrics
  @Column({ name: 'missing_gln', type: 'integer', default: 0 })
  missingGln: number;

  @Column({ name: 'missing_mfl_code', type: 'integer', default: 0 })
  missingMflCode: number;

  @Column({ name: 'missing_county', type: 'integer', default: 0 })
  missingCounty: number;

  @Column({ name: 'missing_facility_type', type: 'integer', default: 0 })
  missingFacilityType: number;

  @Column({ name: 'missing_ownership', type: 'integer', default: 0 })
  missingOwnership: number;

  @Column({ name: 'missing_contact_info', type: 'integer', default: 0 })
  missingContactInfo: number;

  @Column({ name: 'missing_coordinates', type: 'integer', default: 0 })
  missingCoordinates: number;

  @Column({ name: 'missing_latitude', type: 'integer', default: 0 })
  missingLatitude: number;

  @Column({ name: 'missing_longitude', type: 'integer', default: 0 })
  missingLongitude: number;

  @Column({ name: 'complete_records', type: 'integer', default: 0 })
  completeRecords: number;

  // Validity metrics
  @Column({ name: 'expired_licenses', type: 'integer', default: 0 })
  expiredLicenses: number;

  @Column({ name: 'expiring_soon', type: 'integer', default: 0 })
  expiringSoon: number;

  @Column({ name: 'duplicate_facility_codes', type: 'integer', default: 0 })
  duplicateFacilityCodes: number;

  @Column({ name: 'invalid_coordinates', type: 'integer', default: 0 })
  invalidCoordinates: number;

  // Quality scores
  @Column({ name: 'completeness_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  completenessScore?: number;

  @Column({ name: 'completeness_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  completenessPercentage?: number;

  @Column({ name: 'validity_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  validityScore?: number;

  @Column({ name: 'consistency_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  consistencyScore?: number;

  @Column({ name: 'timeliness_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  timelinessScore?: number;

  @Column({ name: 'overall_quality_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallQualityScore?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
