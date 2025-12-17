-- V05__Complete_Parties_Object_Persistence.sql
-- Description: Add ALL missing party fields from parties JSON object
-- Date: 2025-12-11
-- Purpose: Persist ALL 13 fields from parties object (currently only 8/13)

BEGIN;

-- Add missing party fields to consignments
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS manufacturer_name VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS importer_country VARCHAR(2);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS destination_party_name VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS destination_party_gln VARCHAR(100);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS destination_location_sgln VARCHAR(100);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS destination_location_label VARCHAR(255);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS manufacturing_site_sgln VARCHAR(100);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS manufacturing_site_label VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consignments_destination_gln ON consignments(destination_party_gln);
CREATE INDEX IF NOT EXISTS idx_consignments_dest_location_sgln ON consignments(destination_location_sgln);
CREATE INDEX IF NOT EXISTS idx_consignments_mfg_site_sgln ON consignments(manufacturing_site_sgln);
CREATE INDEX IF NOT EXISTS idx_consignments_manufacturer_name ON consignments(manufacturer_name);

COMMENT ON COLUMN consignments.destination_party_name IS 'Destination party/organization name from PPB parties.destination_party.name';
COMMENT ON COLUMN consignments.destination_location_sgln IS 'Physical destination location SGLN from PPB parties.destination_location.sgln';

COMMIT;
