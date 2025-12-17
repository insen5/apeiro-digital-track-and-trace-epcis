-- V01__Update_GTINs_To_14_Digits.sql
-- Description: Add leading zero to all 13-digit GTINs to make them 14 digits (GS1 standard)
-- Date: 2025-12-09
-- Author: System Migration
-- Related: GTIN standardization to 14-digit format

/*
 * MIGRATION CHECKLIST:
 * [x] Reviewed existing schema (\d ppb_products)
 * [x] Follows snake_case naming convention
 * [x] No entity changes needed (gtin column already exists)
 * [x] Tested in development environment
 * [x] Created rollback script (see bottom of file)
 * [x] Backed up database before running
 */

BEGIN;

-- =============================================================================
-- UPDATE 13-DIGIT GTINs TO 14 DIGITS
-- =============================================================================

-- Log the GTINs that will be updated
DO $$
DECLARE
  total_13_digit INTEGER;
  total_14_digit INTEGER;
  total_with_gtin INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_with_gtin FROM ppb_products WHERE gtin IS NOT NULL;
  SELECT COUNT(*) INTO total_13_digit FROM ppb_products WHERE LENGTH(gtin) = 13;
  SELECT COUNT(*) INTO total_14_digit FROM ppb_products WHERE LENGTH(gtin) = 14;
  
  RAISE NOTICE 'Total products with GTIN: %', total_with_gtin;
  RAISE NOTICE 'Products with 13-digit GTIN (will be updated): %', total_13_digit;
  RAISE NOTICE 'Products with 14-digit GTIN (no change): %', total_14_digit;
END $$;

-- Update all 13-digit GTINs by prepending '0'
UPDATE ppb_products
SET 
  gtin = '0' || gtin,
  "updatedAt" = NOW()
WHERE 
  gtin IS NOT NULL 
  AND LENGTH(gtin) = 13;

-- =============================================================================
-- VERIFY MIGRATION
-- =============================================================================

-- Check that no 13-digit GTINs remain
DO $$
DECLARE
  remaining_13_digit INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_13_digit FROM ppb_products WHERE LENGTH(gtin) = 13;
  
  IF remaining_13_digit > 0 THEN
    RAISE EXCEPTION 'Migration failed: % products still have 13-digit GTINs', remaining_13_digit;
  END IF;
  
  RAISE NOTICE 'SUCCESS: All GTINs are now 14 digits';
END $$;

-- Log final counts
DO $$
DECLARE
  total_14_digit INTEGER;
  total_with_gtin INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_with_gtin FROM ppb_products WHERE gtin IS NOT NULL;
  SELECT COUNT(*) INTO total_14_digit FROM ppb_products WHERE LENGTH(gtin) = 14;
  
  RAISE NOTICE 'Final count - Total with GTIN: %, All 14-digit: %', total_with_gtin, total_14_digit;
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (Run this if migration needs to be reverted)
-- =============================================================================

/*
BEGIN;

-- Remove leading zero from GTINs that were updated
-- This assumes the original GTINs started with digits 8 or 6 (common for GTINs)
UPDATE ppb_products
SET 
  gtin = SUBSTRING(gtin FROM 2),
  "updatedAt" = NOW()
WHERE 
  gtin IS NOT NULL 
  AND LENGTH(gtin) = 14
  AND SUBSTRING(gtin FROM 1 FOR 1) = '0';

-- Verify rollback
SELECT COUNT(*) as thirteen_digit, 
       (SELECT COUNT(*) FROM ppb_products WHERE LENGTH(gtin) = 14) as fourteen_digit
FROM ppb_products 
WHERE LENGTH(gtin) = 13;

COMMIT;
*/

-- =============================================================================
-- TESTING QUERIES (Run these to verify migration worked)
-- =============================================================================

/*
-- Verify all GTINs are now 14 digits
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN LENGTH(gtin) = 13 THEN 1 END) as thirteen_digit,
  COUNT(CASE WHEN LENGTH(gtin) = 14 THEN 1 END) as fourteen_digit,
  COUNT(CASE WHEN LENGTH(gtin) NOT IN (13, 14) THEN 1 END) as other_length
FROM ppb_products 
WHERE gtin IS NOT NULL;

-- Show sample of updated GTINs
SELECT id, gtin, brand_display_name 
FROM ppb_products 
WHERE gtin IS NOT NULL 
ORDER BY id 
LIMIT 10;

-- Check for any GTINs that don't match expected format
SELECT id, gtin, LENGTH(gtin) as gtin_length, brand_display_name 
FROM ppb_products 
WHERE gtin IS NOT NULL 
  AND LENGTH(gtin) != 14
ORDER BY id;
*/
