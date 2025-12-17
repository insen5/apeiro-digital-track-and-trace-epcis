-- V02__Add_ILMD_And_Clinical_Data_Support.sql
-- Description: Adds ILMD metadata, clinical events, and regulatory compliance support
-- Date: 2025-12-09
-- Purpose: Implement data persistence improvements

BEGIN;

-- Part 1: Enhance Batches Table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS manufacturing_date DATE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(2);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS permit_id VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS approval_status BOOLEAN DEFAULT TRUE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS manufacturer_gln VARCHAR(13);

CREATE INDEX IF NOT EXISTS idx_batches_manufacturing_date ON batches(manufacturing_date);
CREATE INDEX IF NOT EXISTS idx_batches_country_of_origin ON batches(country_of_origin);
CREATE INDEX IF NOT EXISTS idx_batches_permit_id ON batches(permit_id);

-- Part 2: Enhance Consignments Table
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS mah_name VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS mah_ppb_id VARCHAR(100);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS mah_gln VARCHAR(13);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS raw_json JSONB;

CREATE INDEX IF NOT EXISTS idx_consignments_mah_gln ON consignments(mah_gln);
CREATE INDEX IF NOT EXISTS idx_consignments_raw_json ON consignments USING GIN (raw_json);

-- Part 3: Facility Dispense Events Table
CREATE TABLE IF NOT EXISTS facility_dispense_events (
  id SERIAL PRIMARY KEY,
  facility_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  epcis_event_id VARCHAR(255),
  prescription_number VARCHAR(255),
  prescribed_by VARCHAR(255),
  patient_id VARCHAR(255),
  ward VARCHAR(100),
  department VARCHAR(100),
  dosage_instructions TEXT,
  quantity_dispensed NUMERIC(15,2) NOT NULL,
  product_gtin VARCHAR(14) NOT NULL,
  batch_number VARCHAR(100),
  dispensed_by VARCHAR(255) NOT NULL,
  dispensed_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_dispense_facility ON facility_dispense_events(facility_id);
CREATE INDEX idx_facility_dispense_prescription ON facility_dispense_events(prescription_number);
CREATE INDEX idx_facility_dispense_gtin ON facility_dispense_events(product_gtin);

-- Part 4: Facility Waste Events Table
CREATE TABLE IF NOT EXISTS facility_waste_events (
  id SERIAL PRIMARY KEY,
  facility_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  epcis_event_id VARCHAR(255),
  waste_category VARCHAR(50),
  reason_code VARCHAR(50),
  reason_description TEXT,
  disposal_method VARCHAR(100),
  product_gtin VARCHAR(14) NOT NULL,
  batch_number VARCHAR(100),
  quantity_wasted NUMERIC(15,2) NOT NULL,
  authorized_by VARCHAR(255) NOT NULL,
  waste_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_waste_facility ON facility_waste_events(facility_id);
CREATE INDEX idx_facility_waste_gtin ON facility_waste_events(product_gtin);

-- Part 5: Consignment Metadata Table
CREATE TABLE IF NOT EXISTS consignment_metadata (
  id SERIAL PRIMARY KEY,
  consignment_id INTEGER NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
  header_event_id VARCHAR(255),
  mah_name VARCHAR(255),
  mah_gln VARCHAR(13),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(consignment_id)
);

CREATE INDEX idx_consignment_metadata_consignment ON consignment_metadata(consignment_id);

-- Part 6: Enhance Facility Inventory
ALTER TABLE facility_inventory ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_facility_inventory_storage ON facility_inventory(storage_location);

-- Part 7: Grant Permissions
GRANT SELECT, INSERT, UPDATE ON facility_dispense_events TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON facility_waste_events TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON consignment_metadata TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE facility_dispense_events_id_seq TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE facility_waste_events_id_seq TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE consignment_metadata_id_seq TO tnt_user;

COMMIT;
