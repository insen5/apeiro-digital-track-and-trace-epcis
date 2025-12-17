-- =====================================================================================
-- Migration: V11 - Add is_test Flag to Products & Fix GTIN Duplicates
-- =====================================================================================
-- Description: 
--   1. Add is_test column to ppb_products table (similar to premises)
--   2. Mark test products (PH-TEST-* pattern) as is_test = true
--   3. Fix duplicate GTIN issue for 3 production products sharing same GTIN
--   4. Add index on is_test for efficient filtering
--
-- Author: Data Quality Team
-- Date: December 14, 2025
-- Ticket: DATA-QUALITY-001
-- =====================================================================================

-- =====================================================================================
-- PART 1: ADD is_test COLUMN TO ppb_products
-- =====================================================================================

-- Add is_test column with default false
ALTER TABLE ppb_products 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

COMMENT ON COLUMN ppb_products.is_test IS 'Flag to indicate if this is test/demo/seeded data (true) or production data (false)';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_ppb_products_is_test ON ppb_products(is_test);

COMMENT ON INDEX idx_ppb_products_is_test IS 'Index for filtering test vs production products';

-- =====================================================================================
-- PART 2: MARK TEST PRODUCTS
-- =====================================================================================

-- Mark products with PH-TEST-* pattern as test data
UPDATE ppb_products
SET is_test = true
WHERE etcd_product_id LIKE 'PH-TEST-%'
   OR etcd_product_id ~* '(test|demo|sample|dummy|seed|example|xxx|zzz|temp)';

-- Log how many products were marked as test
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO test_count FROM ppb_products WHERE is_test = true;
  RAISE NOTICE 'Marked % products as test data', test_count;
END $$;

-- =====================================================================================
-- PART 3: FIX DUPLICATE GTIN ISSUE (Production Products)
-- =====================================================================================

-- CRITICAL ISSUE: GTIN 08901234568118 is shared by 3 DIFFERENT production products:
--   - PH4883  (Amlodip)      - Blood pressure medication (Amlodipine)
--   - PH12389 (Injzathine)   - Antibiotic (Benzathine Benzylpenicillin)
--   - PH12907 (Amoxicillin)  - Antibiotic (Amoxicillin)
--
-- These are CLEARLY different products and should have unique GTINs.
-- Without manufacturer verification, the safest approach is to:
--   1. Keep the GTIN for the first product (PH4883 - lowest ID, likely first registered)
--   2. NULL out GTINs for the other two products until correct GTINs can be obtained

-- Create a backup of the duplicate GTIN data for audit trail
CREATE TABLE IF NOT EXISTS ppb_products_gtin_duplicates_audit (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  etcd_product_id VARCHAR NOT NULL,
  brand_name VARCHAR,
  generic_name VARCHAR,
  original_gtin VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  reason TEXT,
  fixed_at TIMESTAMP DEFAULT NOW(),
  fixed_by VARCHAR DEFAULT 'V11_Migration'
);

-- Record the duplicate GTIN issue before fixing
INSERT INTO ppb_products_gtin_duplicates_audit 
  (product_id, etcd_product_id, brand_name, generic_name, original_gtin, action, reason)
SELECT 
  id,
  etcd_product_id,
  brand_name,
  generic_name,
  gtin,
  CASE 
    WHEN id = 3215 THEN 'KEPT_GTIN'
    ELSE 'NULLED_GTIN'
  END as action,
  'Duplicate GTIN 08901234568118 found on 3 different products. Keeping GTIN for lowest ID (PH4883), nulling others pending manufacturer verification.'
FROM ppb_products
WHERE gtin = '08901234568118'
  AND is_test = false
ORDER BY id;

-- NULL out duplicate GTINs (keep only the first product's GTIN)
UPDATE ppb_products
SET gtin = NULL
WHERE gtin = '08901234568118'
  AND id != 3215  -- Keep GTIN for PH4883 (Amlodip) - first product with this GTIN
  AND is_test = false;

-- Log the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count 
  FROM ppb_products_gtin_duplicates_audit 
  WHERE action = 'NULLED_GTIN';
  
  RAISE NOTICE 'Fixed duplicate GTIN issue: Kept GTIN for PH4883, nulled GTIN for % other products', fixed_count;
END $$;

-- =====================================================================================
-- PART 4: VALIDATION & VERIFICATION
-- =====================================================================================

-- Verify no duplicate GTINs remain (excluding NULLs and test data)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT gtin, COUNT(*) as cnt
    FROM ppb_products
    WHERE gtin IS NOT NULL
      AND is_test = false
    GROUP BY gtin
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'WARNING: % duplicate GTINs still exist in production data', duplicate_count;
  ELSE
    RAISE NOTICE 'SUCCESS: No duplicate GTINs in production data';
  END IF;
END $$;

-- Report statistics
DO $$
DECLARE
  total_products INTEGER;
  test_products INTEGER;
  production_products INTEGER;
  products_with_gtin INTEGER;
  products_without_gtin INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM ppb_products;
  SELECT COUNT(*) INTO test_products FROM ppb_products WHERE is_test = true;
  SELECT COUNT(*) INTO production_products FROM ppb_products WHERE is_test = false;
  SELECT COUNT(*) INTO products_with_gtin FROM ppb_products WHERE gtin IS NOT NULL AND is_test = false;
  SELECT COUNT(*) INTO products_without_gtin FROM ppb_products WHERE gtin IS NULL AND is_test = false;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION V11 SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Products:        %', total_products;
  RAISE NOTICE 'Test Products:         %', test_products;
  RAISE NOTICE 'Production Products:   %', production_products;
  RAISE NOTICE 'With GTIN:             %', products_with_gtin;
  RAISE NOTICE 'Without GTIN:          %', products_without_gtin;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================================================
-- PART 5: ADD CONSTRAINTS AND ADDITIONAL INDEXES
-- =====================================================================================

-- Add unique constraint on GTIN for production products only
-- Note: PostgreSQL doesn't support filtered unique constraints easily,
-- so we create a unique partial index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_ppb_products_gtin_unique_production 
ON ppb_products(gtin) 
WHERE gtin IS NOT NULL AND is_test = false;

COMMENT ON INDEX idx_ppb_products_gtin_unique_production IS 
'Ensures GTINs are unique among production products (test products excluded)';

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ppb_products_test_and_gtin 
ON ppb_products(is_test, gtin) 
WHERE gtin IS NOT NULL;

COMMENT ON INDEX idx_ppb_products_test_and_gtin IS 
'Composite index for filtering production products with GTINs';

-- =====================================================================================
-- ROLLBACK INSTRUCTIONS (For reference only - not executed)
-- =====================================================================================
/*
-- To rollback this migration:

-- 1. Restore GTINs from audit table
UPDATE ppb_products p
SET gtin = a.original_gtin
FROM ppb_products_gtin_duplicates_audit a
WHERE p.id = a.product_id
  AND a.action = 'NULLED_GTIN';

-- 2. Drop audit table
DROP TABLE IF EXISTS ppb_products_gtin_duplicates_audit;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_ppb_products_gtin_unique_production;
DROP INDEX IF EXISTS idx_ppb_products_test_and_gtin;
DROP INDEX IF EXISTS idx_ppb_products_is_test;

-- 4. Drop column
ALTER TABLE ppb_products DROP COLUMN IF EXISTS is_test;
*/

-- =====================================================================================
-- NOTES FOR OPERATIONS TEAM
-- =====================================================================================

-- Next Steps:
-- 1. Contact manufacturers to obtain correct GTINs for:
--    - PH12389 (Injzathine - Benzathine Benzylpenicillin)
--    - PH12907 (Amoxicillin)
-- 
-- 2. Update GTINs once verified:
--    UPDATE ppb_products SET gtin = 'correct_gtin' WHERE etcd_product_id = 'PH12389';
--    UPDATE ppb_products SET gtin = 'correct_gtin' WHERE etcd_product_id = 'PH12907';
--
-- 3. Query to check current duplicate status:
--    SELECT gtin, COUNT(*) as count, array_agg(etcd_product_id) as products
--    FROM ppb_products
--    WHERE gtin IS NOT NULL AND is_test = false
--    GROUP BY gtin
--    HAVING COUNT(*) > 1;
--
-- 4. Query to find test products:
--    SELECT * FROM ppb_products WHERE is_test = true;
--
-- 5. Exclude test products from production queries:
--    SELECT * FROM ppb_products WHERE is_test = false;

-- =====================================================================================
-- END OF MIGRATION V11
-- =====================================================================================

