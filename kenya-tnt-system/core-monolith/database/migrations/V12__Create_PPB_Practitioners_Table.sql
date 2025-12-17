-- ============================================================================
-- Migration: V12 - Create PPB Practitioners Table
-- Description: Create table to store healthcare practitioners from PPB API
-- Date: 2024-12-16
-- Author: System
-- ============================================================================

-- Create ppb_practitioners table
CREATE TABLE IF NOT EXISTS ppb_practitioners (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Practitioner Identification
    practitioner_id VARCHAR(100),
    registration_number VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    
    -- Professional Information
    cadre VARCHAR(100),  -- e.g., Pharmacist, Pharmaceutical Technologist
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    
    -- License Information
    license_number VARCHAR(100),
    license_status VARCHAR(50),  -- Active, Suspended, Expired
    license_valid_from DATE,
    license_valid_until DATE,
    license_validity_year INTEGER,
    
    -- Contact Information
    email VARCHAR(255),
    phone_number VARCHAR(50),
    mobile_number VARCHAR(50),
    
    -- Location/Address Information
    county VARCHAR(100),
    sub_county VARCHAR(100),
    constituency VARCHAR(100),
    ward VARCHAR(100),
    postal_code VARCHAR(20),
    address_line1 TEXT,
    address_line2 TEXT,
    
    -- Employment/Practice Information
    practice_type VARCHAR(100),  -- Private, Public, Both
    employer_name VARCHAR(255),
    facility_name VARCHAR(255),
    facility_mfl_code VARCHAR(50),
    
    -- Regulatory Council Information
    regulatory_body VARCHAR(100) DEFAULT 'PPB',
    council_registration_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Active',
    is_enabled BOOLEAN DEFAULT true,
    is_test BOOLEAN DEFAULT false,
    
    -- Sync Metadata
    last_synced_at TIMESTAMP WITH TIME ZONE,
    source_system VARCHAR(50) DEFAULT 'PPB_CATALOGUE',
    raw_data JSONB,  -- Store original API response
    
    -- Audit fields (from BaseEntity)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_registration_number ON ppb_practitioners(registration_number);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_cadre ON ppb_practitioners(cadre);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_county ON ppb_practitioners(county);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_license_status ON ppb_practitioners(license_status);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_license_valid_until ON ppb_practitioners(license_valid_until);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_status ON ppb_practitioners(status);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_is_test ON ppb_practitioners(is_test);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_last_synced_at ON ppb_practitioners(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_ppb_practitioners_practitioner_id ON ppb_practitioners(practitioner_id);

-- Add comment to table
COMMENT ON TABLE ppb_practitioners IS 'Healthcare practitioners from PPB Practitioner Catalogue API';

-- Add comments to key columns
COMMENT ON COLUMN ppb_practitioners.registration_number IS 'Professional registration number - unique identifier';
COMMENT ON COLUMN ppb_practitioners.cadre IS 'Professional cadre (e.g., Pharmacist, Pharmaceutical Technologist)';
COMMENT ON COLUMN ppb_practitioners.license_status IS 'Current license status (Active, Suspended, Expired)';
COMMENT ON COLUMN ppb_practitioners.raw_data IS 'Original API response stored as JSONB for reference';
COMMENT ON COLUMN ppb_practitioners.source_system IS 'Source system identifier (PPB_CATALOGUE)';

-- ============================================================================
-- End of Migration V12
-- ============================================================================
