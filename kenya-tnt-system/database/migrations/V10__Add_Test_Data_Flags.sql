-- V10__Add_Test_Data_Flags.sql
-- Description: Add is_test flags to mark test/demo data clearly
-- Date: December 14, 2025
-- Purpose: Distinguish between production data (from PPB API) and test/demo data

BEGIN;

-- ============================================================================
-- PART 1: Add is_test columns to master data tables
-- ============================================================================

-- Add is_test flag to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_suppliers_is_test ON suppliers(is_test);

COMMENT ON COLUMN suppliers.is_test IS 'TRUE for test/demo data, FALSE for production data from APIs or real registrations';

-- Add is_test flag to premises table
ALTER TABLE premises 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_premises_is_test ON premises(is_test);

COMMENT ON COLUMN premises.is_test IS 'TRUE for test/demo data, FALSE for production data from PPB Catalogue API';

-- Add is_test flag to logistics_providers table
ALTER TABLE logistics_providers 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_logistics_providers_is_test ON logistics_providers(is_test);

COMMENT ON COLUMN logistics_providers.is_test IS 'TRUE for test/demo data, FALSE for production data';

-- ============================================================================
-- PART 2: Mark existing seed data as test data
-- ============================================================================

-- Mark the 7 existing suppliers/manufacturers as test data
UPDATE suppliers 
SET is_test = TRUE
WHERE entity_id IN (
  'SUP-001', -- HealthSup Distributors Ltd
  'SUP-002', -- MediCare Pharmaceuticals Kenya
  'SUP-003', -- PharmaLink East Africa Ltd
  'SUP-004', -- Kenya Medical Supplies Authority
  'MFG-001', -- Cosmos Pharmaceuticals Ltd
  'MFG-002', -- Universal Pharmaceuticals Kenya Ltd
  'MFG-003'  -- Kenya Pharmaceutical Industries Ltd
);

-- Update supplier names to include TEST prefix for clarity
UPDATE suppliers 
SET legal_entity_name = 'TEST - ' || legal_entity_name
WHERE is_test = TRUE 
  AND legal_entity_name NOT LIKE 'TEST -%';

-- Mark the 3 existing logistics providers as test data
UPDATE logistics_providers 
SET is_test = TRUE
WHERE lsp_id IN (
  'LSP-001', -- e-lock Ltd
  'LSP-002', -- TransLogistics Kenya
  'LSP-003'  -- SecurePharma Transport
);

-- Update LSP names to include TEST prefix
UPDATE logistics_providers 
SET name = 'TEST - ' || name
WHERE is_test = TRUE 
  AND name NOT LIKE 'TEST -%';

-- ============================================================================
-- PART 3: Restore the 10 test premises (that were deleted earlier)
-- ============================================================================

-- These are the premises from seed_master_data.sql that had street addresses
-- They were deleted but should be kept as test data

-- Note: Premises table schema after V09 has these columns:
-- supplierId, premise_id, legacy_premise_id, premise_name, gln,
-- business_type, premise_classification, ownership,
-- superintendent_name, superintendent_cadre, superintendent_registration_number,
-- ppb_license_number, license_valid_until, license_validity_year, license_status,
-- county, constituency, ward, location_id, country, status, is_test

INSERT INTO premises (
  "supplierId", premise_id, legacy_premise_id, premise_name, gln,
  business_type, premise_classification, ownership,
  superintendent_name, superintendent_cadre, superintendent_registration_number,
  ppb_license_number, license_valid_until, license_validity_year, license_status,
  county, constituency, ward, country, status, is_test, last_updated
) VALUES
-- HealthSup Premises (2)
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-001'),
  'SUP-001-WH1',
  33078,
  'TEST - Central Distribution Warehouse',
  '7351002000013',
  'WHOLESALE',
  'WAREHOUSE',
  'PRIVATE COMPANY (LIMITED)',
  'DANIEL BARASA WAFULA',
  'PHARMACIST',
  3237,
  'PPB/WHL/002/2025-WH1',
  '2025-12-31',
  2025,
  'Active',
  'Nairobi',
  'Embakasi North',
  'Embakasi',
  'KE',
  'Active',
  TRUE,
  NOW()
),
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-001'),
  'SUP-001-WH2',
  33079,
  'TEST - Mombasa Regional Warehouse',
  '7351002000022',
  'WHOLESALE',
  'WAREHOUSE',
  'PRIVATE COMPANY (LIMITED)',
  'MARY WANJIRU',
  'PHARMACIST',
  3456,
  'PPB/WHL/002/2025-WH2',
  '2025-12-31',
  2025,
  'Active',
  'Mombasa',
  'Changamwe',
  'Port Reitz',
  'KE',
  'Active',
  TRUE,
  NOW()
),
-- MediCare Premises (1)
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-002'),
  'SUP-002-WH1',
  34001,
  'TEST - Westlands Distribution Center',
  '6164001000015',
  'WHOLESALE',
  'DISTRIBUTION_CENTER',
  'PRIVATE COMPANY (LIMITED)',
  'JAMES OTIENO',
  'PHARMACIST',
  4123,
  'PPB/WHL/015/2025-WH1',
  '2025-12-31',
  2025,
  'Active',
  'Nairobi',
  'Westlands',
  'Westlands',
  'KE',
  'Active',
  TRUE,
  NOW()
),
-- PharmaLink Premises (1)
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-003'),
  'SUP-003-WH1',
  35012,
  'TEST - Embakasi Logistics Hub',
  '6164002000012',
  'WHOLESALE',
  'LOGISTICS_HUB',
  'PRIVATE COMPANY (LIMITED)',
  'LUCY AKINYI',
  'PHARMACIST',
  5234,
  'PPB/WHL/028/2025-WH1',
  '2025-12-31',
  2025,
  'Active',
  'Nairobi',
  'Embakasi',
  'Embakasi',
  'KE',
  'Active',
  TRUE,
  NOW()
),
-- KEMSA Premises (5)
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-004'),
  'SUP-004-HQ',
  40001,
  'TEST - National Supply Chain Centre (Headquarters)',
  '6164003000019',
  'WHOLESALE',
  'WAREHOUSE',
  'STATE CORPORATION',
  'JOHN KAMAU',
  'PHARMACIST',
  6123,
  'PPB/GOV/001/2025-HQ',
  '2025-12-31',
  2025,
  'Active',
  'Nairobi',
  'Embakasi',
  'Embakasi',
  'KE',
  'Active',
  TRUE,
  NOW()
),
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-004'),
  'SUP-004-ELD',
  40002,
  'TEST - Eldoret Regional Depot',
  '6164003000028',
  'WHOLESALE',
  'DEPOT',
  'STATE CORPORATION',
  'MARY CHEPKEMOI',
  'PHARMACIST',
  6234,
  'PPB/GOV/001/2025-ELD',
  '2025-12-31',
  2025,
  'Active',
  'Uasin Gishu',
  'Eldoret Town',
  'Eldoret',
  'KE',
  'Active',
  TRUE,
  NOW()
),
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-004'),
  'SUP-004-MSA',
  40003,
  'TEST - Mombasa Regional Depot',
  '6164003000037',
  'WHOLESALE',
  'DEPOT',
  'STATE CORPORATION',
  'AHMED HASSAN',
  'PHARMACIST',
  6345,
  'PPB/GOV/001/2025-MSA',
  '2025-12-31',
  2025,
  'Active',
  'Mombasa',
  'Mvita',
  'Mvita',
  'KE',
  'Active',
  TRUE,
  NOW()
),
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-004'),
  'SUP-004-KSM',
  40004,
  'TEST - Kisumu Regional Depot',
  '6164003000046',
  'WHOLESALE',
  'DEPOT',
  'STATE CORPORATION',
  'JANE ACHIENG',
  'PHARMACIST',
  6456,
  'PPB/GOV/001/2025-KSM',
  '2025-12-31',
  2025,
  'Active',
  'Kisumu',
  'Kisumu Central',
  'Kisumu',
  'KE',
  'Active',
  TRUE,
  NOW()
),
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-004'),
  'SUP-004-NKR',
  40005,
  'TEST - Nakuru Regional Depot',
  '6164003000055',
  'WHOLESALE',
  'DEPOT',
  'STATE CORPORATION',
  'PETER KIPROTICH',
  'PHARMACIST',
  6567,
  'PPB/GOV/001/2025-NKR',
  '2025-12-31',
  2025,
  'Active',
  'Nakuru',
  'Nakuru Town',
  'Nakuru',
  'KE',
  'Active',
  TRUE,
  NOW()
),
-- Manufacturer Premise (1) - PHILMED LIMITED
(
  (SELECT id FROM suppliers WHERE entity_id = 'MFG-001'),
  'MFG-001-MFG',
  50001,
  'TEST - Cosmos Manufacturing Plant',
  '6164004000020',
  'MANUFACTURING',
  'FACTORY',
  'PRIVATE COMPANY (LIMITED)',
  'DR JAMES KARIUKI',
  'PHARMACIST',
  7123,
  'PPB/MFG/001/2025-PLANT',
  '2025-12-31',
  2025,
  'Active',
  'Kiambu',
  'Thika',
  'Thika Town',
  'KE',
  'Active',
  TRUE,
  NOW()
)
ON CONFLICT (premise_id) DO UPDATE SET
  premise_name = EXCLUDED.premise_name,
  is_test = EXCLUDED.is_test,
  last_updated = NOW();

-- ============================================================================
-- PART 4: Create locations for test premises (for V09 dual-pattern)
-- ============================================================================

-- Create location entries for test premises with county/ward
INSERT INTO locations (sgln, label, location_type, county, constituency, ward, country)
SELECT 
  'KE-' || UPPER(p.county) || '-' || UPPER(COALESCE(p.ward, 'UNKNOWN')) || '-TEST-' || p.id AS sgln,
  p.premise_name AS label,
  'test_premise' AS location_type,
  p.county,
  p.constituency,
  p.ward,
  'KE' AS country
FROM premises p
WHERE p.is_test = TRUE
  AND p.location_id IS NULL
ON CONFLICT (sgln) DO NOTHING;

-- Link test premises to their locations
UPDATE premises p
SET location_id = l.id
FROM locations l
WHERE p.is_test = TRUE
  AND p.location_id IS NULL
  AND l.sgln = 'KE-' || UPPER(p.county) || '-' || UPPER(COALESCE(p.ward, 'UNKNOWN')) || '-TEST-' || p.id;

-- ============================================================================
-- PART 5: Add comments and constraints
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Supplier and manufacturer entities. PPB API data (is_test=FALSE) + manual test data (is_test=TRUE)';
COMMENT ON TABLE premises IS 'Premise master data. PPB Catalogue API data (is_test=FALSE) + manual test data (is_test=TRUE)';
COMMENT ON TABLE logistics_providers IS 'Logistics service providers. No PPB API - all manual. Test data (is_test=TRUE), production TBD';

-- Create view for production-only data (commonly used)
CREATE OR REPLACE VIEW suppliers_production AS
SELECT * FROM suppliers WHERE is_test = FALSE OR is_test IS NULL;

CREATE OR REPLACE VIEW premises_production AS
SELECT * FROM premises WHERE is_test = FALSE OR is_test IS NULL;

CREATE OR REPLACE VIEW logistics_providers_production AS
SELECT * FROM logistics_providers WHERE is_test = FALSE OR is_test IS NULL;

-- Create view for test-only data
CREATE OR REPLACE VIEW suppliers_test AS
SELECT * FROM suppliers WHERE is_test = TRUE;

CREATE OR REPLACE VIEW premises_test AS
SELECT * FROM premises WHERE is_test = TRUE;

CREATE OR REPLACE VIEW logistics_providers_test AS
SELECT * FROM logistics_providers WHERE is_test = TRUE;

COMMENT ON VIEW suppliers_production IS 'Production suppliers only (excludes test data)';
COMMENT ON VIEW premises_production IS 'Production premises only (from PPB API, excludes test data)';
COMMENT ON VIEW suppliers_test IS 'Test/demo suppliers only';
COMMENT ON VIEW premises_test IS 'Test/demo premises only';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================

-- Check test data counts
-- SELECT 'Suppliers (test)' as entity, COUNT(*) as count FROM suppliers WHERE is_test = TRUE
-- UNION ALL
-- SELECT 'Suppliers (production)', COUNT(*) FROM suppliers WHERE is_test = FALSE
-- UNION ALL
-- SELECT 'Premises (test)', COUNT(*) FROM premises WHERE is_test = TRUE
-- UNION ALL
-- SELECT 'Premises (production)', COUNT(*) FROM premises WHERE is_test = FALSE
-- UNION ALL
-- SELECT 'LSPs (test)', COUNT(*) FROM logistics_providers WHERE is_test = TRUE
-- UNION ALL
-- SELECT 'LSPs (production)', COUNT(*) FROM logistics_providers WHERE is_test = FALSE;

-- List test suppliers/manufacturers
-- SELECT entity_id, legal_entity_name, actor_type, is_test 
-- FROM suppliers 
-- WHERE is_test = TRUE 
-- ORDER BY entity_id;

-- List test premises
-- SELECT premise_id, premise_name, county, is_test 
-- FROM premises 
-- WHERE is_test = TRUE 
-- ORDER BY premise_id;
