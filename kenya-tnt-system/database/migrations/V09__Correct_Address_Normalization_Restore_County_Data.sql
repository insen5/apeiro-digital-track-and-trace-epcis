-- V09__Correct_Address_Normalization_Restore_County_Data.sql
-- Description: Fix V08 issues - restore county/ward, support hierarchical location precision
-- Date: 2025-12-14
-- Purpose: Make locations work with Kenya data reality (county-level precision)

BEGIN;

-- ============================================================================
-- PART 1: Restore County/Ward Columns to Premises
-- ============================================================================

-- Add back the geographic columns that V08 dropped prematurely
ALTER TABLE premises ADD COLUMN IF NOT EXISTS county VARCHAR(100);
ALTER TABLE premises ADD COLUMN IF NOT EXISTS constituency VARCHAR(100);
ALTER TABLE premises ADD COLUMN IF NOT EXISTS ward VARCHAR(100);

COMMENT ON COLUMN premises.county IS 'County (from PPB API) - kept for fast analytics queries';
COMMENT ON COLUMN premises.constituency IS 'Constituency (from PPB API) - kept for fast analytics queries';
COMMENT ON COLUMN premises.ward IS 'Ward (from PPB API) - kept for fast analytics queries';

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_premises_county ON premises(county);
CREATE INDEX IF NOT EXISTS idx_premises_ward ON premises(ward);

-- ============================================================================
-- PART 2: Restore Data from Locations (for the 10 that were migrated)
-- ============================================================================

-- Copy back county/ward data from locations for premises that were linked
UPDATE premises p
SET 
  county = l.county,
  constituency = l.constituency,
  ward = l.ward
FROM locations l
WHERE p.location_id = l.id
AND l.county IS NOT NULL;

-- ============================================================================
-- PART 3: Create Locations for ALL Premises (not just those with addresses)
-- ============================================================================

-- Strategy: Create locations based on county+ward, even without street addresses
-- SGLN format: KE-{COUNTY}-{WARD}-{PREMISE_ID} (practical for Kenya)

INSERT INTO locations (sgln, label, location_type, county, constituency, ward, country)
SELECT 
  CASE 
    WHEN p.gln IS NOT NULL AND p.gln != '' THEN p.gln
    WHEN p.county IS NOT NULL AND p.ward IS NOT NULL THEN 
      'KE-' || UPPER(REPLACE(p.county, ' ', '-')) || '-' || UPPER(REPLACE(p.ward, ' ', '-')) || '-' || p.id
    WHEN p.county IS NOT NULL THEN 
      'KE-' || UPPER(REPLACE(p.county, ' ', '-')) || '-' || p.id
    ELSE 
      'KE-UNKNOWN-' || p.id
  END AS sgln,
  p.premise_name AS label,
  CASE 
    WHEN p.ward IS NOT NULL THEN 'ward'
    WHEN p.county IS NOT NULL THEN 'county'
    ELSE 'country'
  END AS location_type,
  p.county,
  p.constituency,
  p.ward,
  p.country
FROM premises p
WHERE p.location_id IS NULL  -- Only create for premises not already linked
AND p.county IS NOT NULL
ON CONFLICT (sgln) DO UPDATE 
SET 
  label = EXCLUDED.label,
  county = EXCLUDED.county,
  constituency = EXCLUDED.constituency,
  ward = EXCLUDED.ward;

-- Link premises to their new locations
UPDATE premises p
SET location_id = l.id
FROM locations l
WHERE p.location_id IS NULL
AND l.sgln = CASE 
  WHEN p.gln IS NOT NULL AND p.gln != '' THEN p.gln
  WHEN p.county IS NOT NULL AND p.ward IS NOT NULL THEN 
    'KE-' || UPPER(REPLACE(p.county, ' ', '-')) || '-' || UPPER(REPLACE(p.ward, ' ', '-')) || '-' || p.id
  WHEN p.county IS NOT NULL THEN 
    'KE-' || UPPER(REPLACE(p.county, ' ', '-')) || '-' || p.id
  ELSE 
    'KE-UNKNOWN-' || p.id
END;

-- ============================================================================
-- PART 4: Restore Supplier Geographic Data
-- ============================================================================

-- Add back county/ward to suppliers (keep lightweight for analytics)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS hq_county VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS hq_ward VARCHAR(100);

COMMENT ON COLUMN suppliers.hq_county IS 'HQ County - kept for analytics (duplicates location data)';
COMMENT ON COLUMN suppliers.hq_ward IS 'HQ Ward - kept for analytics (duplicates location data)';

-- Restore from locations where available
UPDATE suppliers s
SET 
  hq_county = l.county,
  hq_ward = l.ward
FROM locations l
WHERE s.hq_location_id = l.id
AND l.county IS NOT NULL;

-- ============================================================================
-- PART 5: Restore Logistics Provider Geographic Data
-- ============================================================================

-- Add back county to logistics providers
ALTER TABLE logistics_providers ADD COLUMN IF NOT EXISTS hq_county VARCHAR(100);

COMMENT ON COLUMN logistics_providers.hq_county IS 'HQ County - kept for analytics (duplicates location data)';

-- Restore from locations where available
UPDATE logistics_providers lp
SET hq_county = l.county
FROM locations l
WHERE lp.hq_location_id = l.id
AND l.county IS NOT NULL;

-- ============================================================================
-- PART 6: Update Convenience Views to Use Direct Columns
-- ============================================================================

-- Drop existing views first (from V08)
DROP VIEW IF EXISTS premises_with_addresses CASCADE;
DROP VIEW IF EXISTS suppliers_with_addresses CASCADE;
DROP VIEW IF EXISTS logistics_providers_with_addresses CASCADE;

-- Update premises view to prefer direct columns (faster)
CREATE VIEW premises_with_addresses AS
SELECT 
  p.*,
  l.sgln,
  l.address_line1,
  l.address_line2,
  l.city,
  COALESCE(p.county, l.county) AS location_county,  -- Prefer direct column
  COALESCE(p.constituency, l.constituency) AS location_constituency,
  COALESCE(p.ward, l.ward) AS location_ward,
  l.postal_code,
  COALESCE(p.country, l.country) AS location_country
FROM premises p
LEFT JOIN locations l ON l.id = p.location_id;

COMMENT ON VIEW premises_with_addresses IS 'Premises with address data (prefers direct county/ward for performance)';

-- Update suppliers view
CREATE VIEW suppliers_with_addresses AS
SELECT 
  s.*,
  l.sgln AS hq_sgln,
  l.address_line1 AS hq_address_line1,
  l.address_line2 AS hq_address_line2,
  l.city AS hq_city,
  COALESCE(s.hq_county, l.county) AS hq_location_county,  -- Prefer direct column
  COALESCE(s.hq_ward, l.ward) AS hq_ward_full,
  l.postal_code AS hq_postal_code
FROM suppliers s
LEFT JOIN locations l ON l.id = s.hq_location_id;

-- ============================================================================
-- PART 7: Create Helper View for Location Hierarchy
-- ============================================================================

-- View showing location precision levels
CREATE OR REPLACE VIEW location_precision_summary AS
SELECT 
  location_type,
  COUNT(*) as count,
  COUNT(address_line1) as with_street_address,
  COUNT(ward) as with_ward,
  COUNT(county) as with_county,
  ROUND(100.0 * COUNT(address_line1) / NULLIF(COUNT(*), 0), 2) as street_address_pct,
  ROUND(100.0 * COUNT(ward) / NULLIF(COUNT(*), 0), 2) as ward_pct,
  ROUND(100.0 * COUNT(county) / NULLIF(COUNT(*), 0), 2) as county_pct
FROM locations
GROUP BY location_type
ORDER BY count DESC;

COMMENT ON VIEW location_precision_summary IS 'Shows geographic precision levels across locations';

-- ============================================================================
-- PART 8: Statistics and Verification
-- ============================================================================

DO $$
DECLARE
  premises_with_county INTEGER;
  premises_with_location INTEGER;
  premises_total INTEGER;
  locations_total INTEGER;
  locations_with_address INTEGER;
BEGIN
  SELECT COUNT(*) INTO premises_total FROM premises;
  SELECT COUNT(*) INTO premises_with_county FROM premises WHERE county IS NOT NULL;
  SELECT COUNT(*) INTO premises_with_location FROM premises WHERE location_id IS NOT NULL;
  SELECT COUNT(*) INTO locations_total FROM locations WHERE location_type IN ('premise', 'ward', 'county');
  SELECT COUNT(*) INTO locations_with_address FROM locations WHERE address_line1 IS NOT NULL;

  RAISE NOTICE '=== V09 Address Normalization Correction Complete ===';
  RAISE NOTICE 'Premises total: %', premises_total;
  RAISE NOTICE 'Premises with county data: % (%.1f%%)', 
    premises_with_county, 
    100.0 * premises_with_county / NULLIF(premises_total, 0);
  RAISE NOTICE 'Premises linked to locations: % (%.1f%%)', 
    premises_with_location,
    100.0 * premises_with_location / NULLIF(premises_total, 0);
  RAISE NOTICE 'Location entities created: %', locations_total;
  RAISE NOTICE 'Locations with street addresses: % (%.1f%%)',
    locations_with_address,
    100.0 * locations_with_address / NULLIF(locations_total, 0);
  RAISE NOTICE '';
  RAISE NOTICE 'Strategy: Dual pattern - direct county/ward columns + location FK';
  RAISE NOTICE 'Analytics: Use direct columns (fast, no JOIN)';
  RAISE NOTICE 'EPCIS: Use location_id (normalized, reusable)';
END $$;

COMMIT;
