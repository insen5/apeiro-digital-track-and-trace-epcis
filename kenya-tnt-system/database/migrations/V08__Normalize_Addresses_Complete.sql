-- V08__Normalize_Addresses_Complete.sql
-- Description: Normalize all address data to locations table
-- Date: 2025-12-14
-- Purpose: Eliminate address denormalization in premises, suppliers, logistics_providers

BEGIN;

-- ============================================================================
-- PART 0: Extend locations table to store address details
-- ============================================================================

-- Add address-related columns to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS county VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS constituency VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

COMMENT ON COLUMN locations.address_line1 IS 'Primary address line (street, building, etc.)';
COMMENT ON COLUMN locations.address_line2 IS 'Secondary address line (unit, floor, etc.)';
COMMENT ON COLUMN locations.city IS 'City or town';
COMMENT ON COLUMN locations.county IS 'Kenyan administrative division - County level';
COMMENT ON COLUMN locations.constituency IS 'Kenyan administrative division - Constituency level';
COMMENT ON COLUMN locations.ward IS 'Kenyan administrative division - Ward level';
COMMENT ON COLUMN locations.postal_code IS 'Postal/ZIP code';

-- ============================================================================
-- PART 1: Normalize Premises Addresses
-- ============================================================================

-- Add location_id FK column
ALTER TABLE premises ADD COLUMN IF NOT EXISTS location_id INTEGER;

-- Migrate premise addresses to locations table
-- Note: Many premises don't have GLN (11543 total, 0 with GLN)
-- We'll use premise_id as fallback for SGLN
INSERT INTO locations (sgln, label, location_type, address_line1, address_line2, county, constituency, ward, postal_code, country)
SELECT 
  COALESCE(p.gln, 'PREM-' || p.id) AS sgln, -- Use premise_id if no GLN
  p.premise_name AS label,
  'premise' AS location_type,
  p.address_line1,
  p.address_line2,
  p.county,
  p.constituency,
  p.ward,
  p.postal_code,
  p.country
FROM premises p
WHERE p.address_line1 IS NOT NULL -- Only migrate records with addresses
ON CONFLICT (sgln) DO UPDATE 
SET 
  label = EXCLUDED.label,
  address_line1 = EXCLUDED.address_line1,
  address_line2 = EXCLUDED.address_line2,
  county = EXCLUDED.county,
  constituency = EXCLUDED.constituency,
  ward = EXCLUDED.ward,
  postal_code = EXCLUDED.postal_code;

-- Link premises to their locations
UPDATE premises p
SET location_id = l.id
FROM locations l
WHERE l.sgln = COALESCE(p.gln, 'PREM-' || p.id)
AND p.address_line1 IS NOT NULL;

-- Add FK constraint
ALTER TABLE premises 
ADD CONSTRAINT fk_premises_location 
FOREIGN KEY (location_id) REFERENCES locations(id);

CREATE INDEX IF NOT EXISTS idx_premises_location ON premises(location_id);

-- Drop denormalized address columns
ALTER TABLE premises 
DROP COLUMN IF EXISTS address_line1,
DROP COLUMN IF EXISTS address_line2,
DROP COLUMN IF EXISTS county,
DROP COLUMN IF EXISTS constituency,
DROP COLUMN IF EXISTS ward,
DROP COLUMN IF EXISTS postal_code;

COMMENT ON COLUMN premises.location_id IS 'FK to locations table - single source of truth for premise address';

-- ============================================================================
-- PART 2: Normalize Suppliers
-- ============================================================================

-- Add hq_location_id FK column
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS hq_location_id INTEGER;

-- Migrate supplier HQ addresses
-- Note: Some suppliers share the same HQ GLN, so we use row_number to make SGLN unique
WITH numbered_suppliers AS (
  SELECT 
    s.*,
    ROW_NUMBER() OVER (PARTITION BY s.hq_gln ORDER BY s.id) as rn
  FROM suppliers s
  WHERE s.hq_address_line1 IS NOT NULL
)
INSERT INTO locations (sgln, label, location_type, address_line1, address_line2, county, constituency, ward, postal_code, country)
SELECT 
  CASE 
    WHEN hq_gln IS NOT NULL AND rn = 1 THEN hq_gln
    ELSE 'SUP-' || id
  END AS sgln,
  COALESCE(hq_name, legal_entity_name) || ' HQ' AS label,
  'headquarters' AS location_type,
  hq_address_line1,
  hq_address_line2,
  hq_county,
  hq_constituency,
  hq_ward,
  hq_postal_code,
  hq_country
FROM numbered_suppliers
ON CONFLICT (sgln) DO UPDATE 
SET 
  label = EXCLUDED.label,
  address_line1 = EXCLUDED.address_line1,
  address_line2 = EXCLUDED.address_line2,
  county = EXCLUDED.county,
  constituency = EXCLUDED.constituency,
  ward = EXCLUDED.ward,
  postal_code = EXCLUDED.postal_code;

-- Link suppliers to locations (handle duplicates)
WITH supplier_sgln AS (
  SELECT 
    s.id,
    CASE 
      WHEN s.hq_gln IS NOT NULL AND 
           (SELECT COUNT(*) FROM suppliers s2 WHERE s2.hq_gln = s.hq_gln AND s2.id < s.id) = 0
      THEN s.hq_gln
      ELSE 'SUP-' || s.id
    END as sgln
  FROM suppliers s
)
UPDATE suppliers s
SET hq_location_id = l.id
FROM locations l, supplier_sgln ss
WHERE ss.id = s.id AND l.sgln = ss.sgln;

-- Add FK constraint
ALTER TABLE suppliers 
ADD CONSTRAINT fk_suppliers_hq_location 
FOREIGN KEY (hq_location_id) REFERENCES locations(id);

CREATE INDEX IF NOT EXISTS idx_suppliers_hq_location ON suppliers(hq_location_id);

-- Drop denormalized address columns
ALTER TABLE suppliers 
DROP COLUMN IF EXISTS hq_address_line1,
DROP COLUMN IF EXISTS hq_address_line2,
DROP COLUMN IF EXISTS hq_county,
DROP COLUMN IF EXISTS hq_constituency,
DROP COLUMN IF EXISTS hq_ward,
DROP COLUMN IF EXISTS hq_postal_code;

COMMENT ON COLUMN suppliers.hq_location_id IS 'FK to locations table - single source of truth for supplier HQ address';

-- ============================================================================
-- PART 3: Normalize Logistics Providers
-- ============================================================================

-- Add hq_location_id FK column
ALTER TABLE logistics_providers ADD COLUMN IF NOT EXISTS hq_location_id INTEGER;

-- Migrate LSP HQ addresses
INSERT INTO locations (sgln, label, location_type, address_line1, city, county, postal_code, country)
SELECT 
  COALESCE(lp.gln, 'LSP-' || lp.id) AS sgln,
  lp.name || ' HQ' AS label,
  'logistics_hq' AS location_type,
  lp.hq_address_line,
  lp.hq_city,
  lp.hq_county,
  lp.hq_postal_code,
  lp.hq_country
FROM logistics_providers lp
WHERE lp.hq_address_line IS NOT NULL
ON CONFLICT (sgln) DO UPDATE 
SET 
  label = EXCLUDED.label,
  address_line1 = EXCLUDED.address_line1,
  city = EXCLUDED.city,
  county = EXCLUDED.county,
  postal_code = EXCLUDED.postal_code;

-- Link logistics providers to locations
UPDATE logistics_providers lp
SET hq_location_id = l.id
FROM locations l
WHERE l.sgln = COALESCE(lp.gln, 'LSP-' || lp.id);

-- Add FK constraint
ALTER TABLE logistics_providers 
ADD CONSTRAINT fk_logistics_providers_hq_location 
FOREIGN KEY (hq_location_id) REFERENCES locations(id);

CREATE INDEX IF NOT EXISTS idx_logistics_providers_hq_location ON logistics_providers(hq_location_id);

-- Drop denormalized address columns
ALTER TABLE logistics_providers 
DROP COLUMN IF EXISTS hq_address_line,
DROP COLUMN IF EXISTS hq_city,
DROP COLUMN IF EXISTS hq_county,
DROP COLUMN IF EXISTS hq_postal_code;

COMMENT ON COLUMN logistics_providers.hq_location_id IS 'FK to locations table - single source of truth for LSP HQ address';

-- ============================================================================
-- PART 4: Create Convenience Views
-- ============================================================================

-- View: Premises with full addresses
CREATE OR REPLACE VIEW premises_with_addresses AS
SELECT 
  p.*,
  l.sgln,
  l.address_line1,
  l.address_line2,
  l.city,
  l.county,
  l.constituency,
  l.ward,
  l.postal_code,
  l.country AS location_country
FROM premises p
LEFT JOIN locations l ON l.id = p.location_id;

COMMENT ON VIEW premises_with_addresses IS 'Denormalized view for easy querying of premises with addresses';

-- View: Suppliers with full addresses
CREATE OR REPLACE VIEW suppliers_with_addresses AS
SELECT 
  s.*,
  l.sgln AS hq_sgln,
  l.address_line1 AS hq_address_line1,
  l.address_line2 AS hq_address_line2,
  l.city AS hq_city,
  l.county AS hq_county,
  l.ward AS hq_ward,
  l.postal_code AS hq_postal_code
FROM suppliers s
LEFT JOIN locations l ON l.id = s.hq_location_id;

COMMENT ON VIEW suppliers_with_addresses IS 'Denormalized view for easy querying of suppliers with HQ addresses';

-- View: Logistics Providers with full addresses
CREATE OR REPLACE VIEW logistics_providers_with_addresses AS
SELECT 
  lp.*,
  l.sgln AS hq_sgln,
  l.address_line1 AS hq_address_line,
  l.city AS hq_city,
  l.county AS hq_county,
  l.postal_code AS hq_postal_code
FROM logistics_providers lp
LEFT JOIN locations l ON l.id = lp.hq_location_id;

COMMENT ON VIEW logistics_providers_with_addresses IS 'Denormalized view for easy querying of LSPs with HQ addresses';

-- ============================================================================
-- PART 5: Grant permissions
-- ============================================================================

GRANT SELECT ON premises_with_addresses TO tnt_user;
GRANT SELECT ON suppliers_with_addresses TO tnt_user;
GRANT SELECT ON logistics_providers_with_addresses TO tnt_user;

-- ============================================================================
-- PART 6: Migration Statistics
-- ============================================================================

DO $$
DECLARE
  premises_migrated INTEGER;
  suppliers_migrated INTEGER;
  lsps_migrated INTEGER;
  premises_total INTEGER;
  suppliers_total INTEGER;
  lsps_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO premises_migrated FROM premises WHERE location_id IS NOT NULL;
  SELECT COUNT(*) INTO premises_total FROM premises;
  SELECT COUNT(*) INTO suppliers_migrated FROM suppliers WHERE hq_location_id IS NOT NULL;
  SELECT COUNT(*) INTO suppliers_total FROM suppliers;
  SELECT COUNT(*) INTO lsps_migrated FROM logistics_providers WHERE hq_location_id IS NOT NULL;
  SELECT COUNT(*) INTO lsps_total FROM logistics_providers;

  RAISE NOTICE '=== V08 Address Normalization Complete ===';
  RAISE NOTICE 'Premises: % / % migrated (% with addresses)', premises_migrated, premises_total, premises_migrated;
  RAISE NOTICE 'Suppliers: % / % migrated', suppliers_migrated, suppliers_total;
  RAISE NOTICE 'Logistics Providers: % / % migrated', lsps_migrated, lsps_total;
  RAISE NOTICE 'Total locations created/updated: %', premises_migrated + suppliers_migrated + lsps_migrated;
END $$;

COMMIT;




