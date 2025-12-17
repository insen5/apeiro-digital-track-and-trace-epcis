-- Migration V06: Add missing facility fields and normalize administrator/bed capacity data
-- Date: 2025-12-17
-- Description: Add missing columns from Safaricom HIE API and create normalized tables

-- Add missing columns to uat_facilities
ALTER TABLE uat_facilities 
  ADD COLUMN IF NOT EXISTS keph_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pcn_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_hub BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS facility_agent VARCHAR(255),
  ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS regulatory_body VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sha_contract_status VARCHAR(100),
  ADD COLUMN IF NOT EXISTS town VARCHAR(255);

-- Add missing columns to prod_facilities  
ALTER TABLE prod_facilities 
  ADD COLUMN IF NOT EXISTS keph_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pcn_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_hub BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS facility_agent VARCHAR(255),
  ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS regulatory_body VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sha_contract_status VARCHAR(100),
  ADD COLUMN IF NOT EXISTS town VARCHAR(255);

-- Create facility_administrators table (for both UAT and Prod)
CREATE TABLE IF NOT EXISTS facility_administrators (
  id SERIAL PRIMARY KEY,
  facility_code VARCHAR(100) NOT NULL,
  facility_source VARCHAR(10) NOT NULL CHECK (facility_source IN ('UAT', 'PROD')),
  administrator_name VARCHAR(500),
  administrator_email VARCHAR(255),
  administrator_phone VARCHAR(50),
  administrator_identifier VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(facility_code, facility_source)
);

CREATE INDEX idx_facility_administrators_code ON facility_administrators(facility_code);
CREATE INDEX idx_facility_administrators_source ON facility_administrators(facility_source);

-- Create facility_bed_capacity table (for both UAT and Prod)
CREATE TABLE IF NOT EXISTS facility_bed_capacity (
  id SERIAL PRIMARY KEY,
  facility_code VARCHAR(100) NOT NULL,
  facility_source VARCHAR(10) NOT NULL CHECK (facility_source IN ('UAT', 'PROD')),
  total_beds INTEGER DEFAULT 0,
  normal_beds INTEGER DEFAULT 0,
  icu_beds INTEGER DEFAULT 0,
  hdu_beds INTEGER DEFAULT 0,
  dialysis_beds INTEGER DEFAULT 0,
  number_of_cots INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(facility_code, facility_source)
);

CREATE INDEX idx_facility_bed_capacity_code ON facility_bed_capacity(facility_code);
CREATE INDEX idx_facility_bed_capacity_source ON facility_bed_capacity(facility_source);

-- Add comments
COMMENT ON TABLE facility_administrators IS 'Facility administrator information from Safaricom HIE API';
COMMENT ON TABLE facility_bed_capacity IS 'Detailed bed capacity breakdown from Safaricom HIE API';

COMMENT ON COLUMN uat_facilities.keph_level IS 'Kenya Essential Package for Health (KEPH) level (e.g., LEVEL 2, LEVEL 4)';
COMMENT ON COLUMN uat_facilities.pcn_code IS 'Primary Care Network code';
COMMENT ON COLUMN uat_facilities.is_hub IS 'Whether facility serves as a hub for the region';
COMMENT ON COLUMN uat_facilities.facility_agent IS 'Facility agent/operator (e.g., COUNTY GOVERNMENT)';
COMMENT ON COLUMN uat_facilities.license_number IS 'Regulatory license number';
COMMENT ON COLUMN uat_facilities.town IS 'Town/city where facility is located';
