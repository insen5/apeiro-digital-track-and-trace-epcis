-- Migration: V10__Create_UAT_Facilities_Table.sql
-- Description: Create uat_facilities table for Safaricom HIE Facility Registry sync
-- Author: Data Integration Team
-- Date: 2025-12-14

-- Create uat_facilities table
CREATE TABLE uat_facilities (
  id SERIAL PRIMARY KEY,
  
  -- Safaricom HIE Identifiers
  facility_code VARCHAR(100) UNIQUE NOT NULL,
  mfl_code VARCHAR(50),
  kmhfl_code VARCHAR(50),
  
  -- Basic Information
  facility_name VARCHAR(500) NOT NULL,
  facility_type VARCHAR(100),
  ownership VARCHAR(100),
  
  -- Location
  county VARCHAR(100),
  sub_county VARCHAR(100),
  constituency VARCHAR(100),
  ward VARCHAR(100),
  
  -- Address (may be incomplete from API)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  postal_code VARCHAR(20),
  
  -- Contact
  phone_number VARCHAR(50),
  email VARCHAR(255),
  
  -- GS1 Identifier (manual assignment - NULL from API)
  gln VARCHAR(13),
  
  -- Operating Status
  operational_status VARCHAR(50),
  license_status VARCHAR(50),
  license_valid_until DATE,
  
  -- Services
  services_offered TEXT[], -- PostgreSQL array of services
  beds_capacity INTEGER,
  
  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  is_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_uat_facilities_facility_code ON uat_facilities(facility_code);
CREATE INDEX idx_uat_facilities_mfl_code ON uat_facilities(mfl_code) WHERE mfl_code IS NOT NULL;
CREATE INDEX idx_uat_facilities_kmhfl_code ON uat_facilities(kmhfl_code) WHERE kmhfl_code IS NOT NULL;
CREATE INDEX idx_uat_facilities_county ON uat_facilities(county);
CREATE INDEX idx_uat_facilities_facility_type ON uat_facilities(facility_type);
CREATE INDEX idx_uat_facilities_ownership ON uat_facilities(ownership);
CREATE INDEX idx_uat_facilities_gln ON uat_facilities(gln) WHERE gln IS NOT NULL;
CREATE INDEX idx_uat_facilities_operational_status ON uat_facilities(operational_status);
CREATE INDEX idx_uat_facilities_license_valid_until ON uat_facilities(license_valid_until);
CREATE INDEX idx_uat_facilities_last_synced_at ON uat_facilities(last_synced_at);

-- Comments for documentation
COMMENT ON TABLE uat_facilities IS 'UAT Facility master data synced from Safaricom HIE Facility Registry API. Provides healthcare facility information for track and trace operations.';
COMMENT ON COLUMN uat_facilities.facility_code IS 'Primary facility identifier from Safaricom HIE (unique across system)';
COMMENT ON COLUMN uat_facilities.mfl_code IS 'Master Facility List code from Ministry of Health (MOH)';
COMMENT ON COLUMN uat_facilities.kmhfl_code IS 'Kenya Master Health Facility List code';
COMMENT ON COLUMN uat_facilities.facility_name IS 'Full name of the healthcare facility';
COMMENT ON COLUMN uat_facilities.facility_type IS 'Type of facility (Hospital, Health Centre, Dispensary, Medical Clinic, etc.)';
COMMENT ON COLUMN uat_facilities.ownership IS 'Ownership type (Government, Private, FBO, NGO, Parastatal)';
COMMENT ON COLUMN uat_facilities.county IS 'County where facility is located (47 counties in Kenya)';
COMMENT ON COLUMN uat_facilities.sub_county IS 'Sub-county administrative division';
COMMENT ON COLUMN uat_facilities.constituency IS 'Parliamentary constituency';
COMMENT ON COLUMN uat_facilities.ward IS 'Electoral ward (smallest administrative unit)';
COMMENT ON COLUMN uat_facilities.gln IS 'GS1 Global Location Number (13 digits). NULL from API - requires manual assignment via GS1 Kenya. CRITICAL for EPCIS compliance.';
COMMENT ON COLUMN uat_facilities.operational_status IS 'Current operational status (Active, Inactive, Temporarily Closed)';
COMMENT ON COLUMN uat_facilities.license_status IS 'License status from regulatory authority';
COMMENT ON COLUMN uat_facilities.license_valid_until IS 'License expiration date';
COMMENT ON COLUMN uat_facilities.services_offered IS 'Array of services offered by the facility (e.g., Outpatient, Inpatient, Laboratory, Pharmacy)';
COMMENT ON COLUMN uat_facilities.beds_capacity IS 'Total number of beds (for hospitals and health centres)';
COMMENT ON COLUMN uat_facilities.latitude IS 'GPS latitude coordinate (Kenya: -5 to 5)';
COMMENT ON COLUMN uat_facilities.longitude IS 'GPS longitude coordinate (Kenya: 33 to 42)';
COMMENT ON COLUMN uat_facilities.is_enabled IS 'Soft delete flag (false = disabled/archived)';
COMMENT ON COLUMN uat_facilities.last_synced_at IS 'Timestamp of last sync from Safaricom HIE API';
COMMENT ON COLUMN uat_facilities.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN uat_facilities.updated_at IS 'Record last update timestamp';

-- Create sync metadata table for tracking sync history
CREATE TABLE uat_facilities_sync_log (
  id SERIAL PRIMARY KEY,
  sync_started_at TIMESTAMP NOT NULL,
  sync_completed_at TIMESTAMP,
  sync_status VARCHAR(20) NOT NULL, -- 'in_progress', 'completed', 'failed'
  records_fetched INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  last_updated_timestamp TIMESTAMP, -- The lastUpdated parameter used in API call
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_uat_facilities_sync_log_sync_started_at ON uat_facilities_sync_log(sync_started_at);
CREATE INDEX idx_uat_facilities_sync_log_sync_status ON uat_facilities_sync_log(sync_status);

COMMENT ON TABLE uat_facilities_sync_log IS 'Audit log for UAT facility sync operations. Tracks sync history, success/failure, and metrics.';
COMMENT ON COLUMN uat_facilities_sync_log.sync_status IS 'Status of sync operation (in_progress, completed, failed)';
COMMENT ON COLUMN uat_facilities_sync_log.last_updated_timestamp IS 'The lastUpdated timestamp used in Safaricom HIE API call for incremental sync';

-- Create quality audit table for tracking data quality over time
CREATE TABLE uat_facilities_quality_audit (
  id SERIAL PRIMARY KEY,
  audit_date TIMESTAMP NOT NULL DEFAULT NOW(),
  total_facilities INTEGER NOT NULL,
  active_facilities INTEGER DEFAULT 0,
  inactive_facilities INTEGER DEFAULT 0,
  
  -- Completeness metrics
  missing_gln INTEGER DEFAULT 0,
  missing_mfl_code INTEGER DEFAULT 0,
  missing_county INTEGER DEFAULT 0,
  missing_facility_type INTEGER DEFAULT 0,
  missing_ownership INTEGER DEFAULT 0,
  missing_contact_info INTEGER DEFAULT 0,
  
  -- Validity metrics
  expired_licenses INTEGER DEFAULT 0,
  expiring_soon INTEGER DEFAULT 0,
  duplicate_facility_codes INTEGER DEFAULT 0,
  invalid_coordinates INTEGER DEFAULT 0,
  
  -- Quality scores
  completeness_score DECIMAL(5,2),
  validity_score DECIMAL(5,2),
  consistency_score DECIMAL(5,2),
  timeliness_score DECIMAL(5,2),
  overall_quality_score DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_uat_facilities_quality_audit_audit_date ON uat_facilities_quality_audit(audit_date);

COMMENT ON TABLE uat_facilities_quality_audit IS 'Historical data quality metrics for UAT facilities. Used for trend analysis and quality improvement tracking.';
COMMENT ON COLUMN uat_facilities_quality_audit.overall_quality_score IS 'Weighted average of all quality dimensions (0-100 scale)';

-- Insert initial sync log entry
INSERT INTO uat_facilities_sync_log (
  sync_started_at,
  sync_status,
  last_updated_timestamp
) VALUES (
  NOW(),
  'pending',
  NOW() - INTERVAL '6 months' -- Default: fetch last 6 months on first sync
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_uat_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trg_uat_facilities_updated_at
  BEFORE UPDATE ON uat_facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_uat_facilities_updated_at();

COMMENT ON FUNCTION update_uat_facilities_updated_at IS 'Automatically updates updated_at timestamp on record modification';

-- Grant permissions (adjust roles as needed)
GRANT SELECT, INSERT, UPDATE ON uat_facilities TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON uat_facilities_sync_log TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON uat_facilities_quality_audit TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE uat_facilities_id_seq TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE uat_facilities_sync_log_id_seq TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE uat_facilities_quality_audit_id_seq TO tnt_user;

-- Migration completed
