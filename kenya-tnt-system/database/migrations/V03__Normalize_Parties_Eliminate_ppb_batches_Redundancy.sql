-- V03__Normalize_Parties_Eliminate_ppb_batches_Redundancy.sql
-- Description: Full normalization of parties and elimination of ppb_batches redundancy
-- Date: 2025-12-09

BEGIN;

-- ====================================================================================
-- PART 1: Create Normalized Party and Location Tables
-- ====================================================================================

CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ppb_id VARCHAR(100),
  gln VARCHAR(100),
  party_type VARCHAR(50) NOT NULL,
  country VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(gln, party_type)
);

CREATE INDEX idx_parties_gln ON parties(gln);
CREATE INDEX idx_parties_ppb_id ON parties(ppb_id);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  sgln VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255),
  location_type VARCHAR(50),
  country VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_sgln ON locations(sgln);

CREATE TABLE IF NOT EXISTS consignment_parties (
  id SERIAL PRIMARY KEY,
  consignment_id INTEGER NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
  party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  UNIQUE(consignment_id, party_id, role)
);

CREATE INDEX idx_consignment_parties_consignment ON consignment_parties(consignment_id);

CREATE TABLE IF NOT EXISTS consignment_locations (
  id SERIAL PRIMARY KEY,
  consignment_id INTEGER NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  UNIQUE(consignment_id, location_id, role)
);

-- ====================================================================================
-- PART 2: Move Fields from ppb_batches to consignments
-- ====================================================================================

ALTER TABLE consignments ADD COLUMN IF NOT EXISTS consignment_ref_number VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS importer_name VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS importer_gln VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS carrier VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS origin VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS port_of_entry VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS declared_total NUMERIC(15,2);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS declared_sent NUMERIC(15,2);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS is_partial_approval BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_consignments_ref_number ON consignments(consignment_ref_number);

-- ====================================================================================
-- PART 3: Add Manufacturing Site to Batches
-- ====================================================================================

ALTER TABLE batches ADD COLUMN IF NOT EXISTS manufacturing_site_sgln VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_batches_manufacturing_site ON batches(manufacturing_site_sgln);

-- ====================================================================================
-- PART 4: Migrate Data from ppb_batches
-- ====================================================================================

-- Migrate to consignments (aggregate per consignment)
UPDATE consignments c
SET
  consignment_ref_number = COALESCE(c.consignment_ref_number, pb.consignment_ref_number),
  importer_name = pb.importer_name,
  importer_gln = pb.importer_gln,
  carrier = pb.carrier,
  origin = pb.origin,
  port_of_entry = pb.port_of_entry,
  declared_total = (
    SELECT SUM(declared_total) FROM ppb_batches 
    WHERE consignment_ref_number = pb.consignment_ref_number
  ),
  declared_sent = (
    SELECT SUM(declared_sent) FROM ppb_batches 
    WHERE consignment_ref_number = pb.consignment_ref_number
  ),
  is_partial_approval = (
    SELECT bool_or(is_partial_approval) FROM ppb_batches 
    WHERE consignment_ref_number = pb.consignment_ref_number
  )
FROM (
  SELECT DISTINCT ON (consignment_ref_number)
    consignment_ref_number, importer_name, importer_gln,
    carrier, origin, port_of_entry
  FROM ppb_batches
  WHERE consignment_ref_number IS NOT NULL
  ORDER BY consignment_ref_number, id
) pb
WHERE c.consignment_ref_number = pb.consignment_ref_number
   OR c."consignmentID" = pb.consignment_ref_number;

-- Migrate to batches
UPDATE batches b
SET manufacturing_site_sgln = pb.manufacturing_site_sgln
FROM ppb_batches pb
WHERE b.batchno = pb.batch_number;

-- ====================================================================================
-- PART 5: Drop Columns from ppb_batches (NOW REDUNDANT)
-- ====================================================================================

ALTER TABLE ppb_batches DROP COLUMN IF EXISTS manufacture_date;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS manufacturer_gln;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS manufacturing_site_sgln;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS manufacturing_site_label;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS importer_name;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS importer_gln;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS importer_country;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS carrier;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS origin;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS port_of_entry;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS final_destination_sgln;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS final_destination_address;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS product_name;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS declared_total;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS declared_sent;

-- ppb_batches NOW CONTAINS ONLY:
-- id, gtin, batch_number, product_code, permit_id, consignment_ref_number,
-- approval_status, approval_date_stamp, is_partial_approval, serialization_range,
-- status, expiration_date, created_at

COMMENT ON TABLE ppb_batches IS 'PPB import audit log (minimal). Most data normalized to batches/consignments tables. Keep for serialization_range JSONB and PPB audit trail.';

GRANT SELECT, INSERT, UPDATE ON parties TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON locations TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON consignment_parties TO tnt_user;
GRANT SELECT, INSERT, UPDATE ON consignment_locations TO tnt_user;
GRANT USAGE ON SEQUENCE parties_id_seq TO tnt_user;
GRANT USAGE ON SEQUENCE locations_id_seq TO tnt_user;
GRANT USAGE ON SEQUENCE consignment_parties_id_seq TO tnt_user;
GRANT USAGE ON SEQUENCE consignment_locations_id_seq TO tnt_user;

COMMIT;
