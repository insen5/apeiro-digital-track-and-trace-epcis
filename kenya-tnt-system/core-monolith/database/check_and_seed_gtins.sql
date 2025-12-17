-- ============================================
-- Check and Seed GTINs for PPB Products
-- ============================================
-- This script checks which products in ppb_products don't have GTINs
-- and seeds GTINs from the seed_ppb_consignment_newest_structure.json file
-- by matching ETC ID (etcd_product_id) - NOT by product name
--
-- Run this script to:
-- 1. Check which products are missing GTINs
-- 2. Seed GTINs from the provided seed file by matching ETC ID
-- 3. Check which products are essential medicines (KEML not null)
-- ============================================

-- ============================================
-- STEP 1: Check products without GTINs
-- ============================================
SELECT 
  'Products without GTINs:' as status,
  COUNT(*) as count
FROM ppb_products
WHERE gtin IS NULL OR gtin = '';

-- List all products without GTINs
SELECT 
  id,
  etcd_product_id,
  brand_display_name,
  generic_display_name,
  brand_name,
  generic_name,
  ppb_registration_code,
  gtin,
  keml_status,
  keml_is_on_keml
FROM ppb_products
WHERE gtin IS NULL OR gtin = ''
ORDER BY etcd_product_id;

-- ============================================
-- STEP 2: Find ETC IDs for products that need GTINs
-- ============================================
-- First, let's see which ETC IDs correspond to our target products
-- This helps identify the correct etcd_product_id values to use in the UPDATE

SELECT 
  etcd_product_id,
  brand_display_name,
  generic_display_name,
  brand_name,
  generic_name,
  gtin,
  CASE 
    WHEN LOWER(brand_display_name) LIKE '%metformin%' 
         OR LOWER(generic_display_name) LIKE '%metformin%'
         OR LOWER(brand_name) LIKE '%metformin%'
         OR LOWER(generic_name) LIKE '%metformin%'
    THEN 'Metformin'
    WHEN LOWER(brand_display_name) LIKE '%amoxicillin%' 
         OR LOWER(generic_display_name) LIKE '%amoxicillin%'
         OR LOWER(brand_name) LIKE '%amoxicillin%'
         OR LOWER(generic_name) LIKE '%amoxicillin%'
    THEN 'Amoxicillin'
    WHEN LOWER(brand_display_name) LIKE '%paracetamol%' 
         OR LOWER(generic_display_name) LIKE '%paracetamol%'
         OR LOWER(brand_name) LIKE '%paracetamol%'
         OR LOWER(generic_name) LIKE '%paracetamol%'
    THEN 'Paracetamol'
    WHEN LOWER(brand_display_name) LIKE '%ibuprofen%' 
         OR LOWER(generic_display_name) LIKE '%ibuprofen%'
         OR LOWER(brand_name) LIKE '%ibuprofen%'
         OR LOWER(generic_name) LIKE '%ibuprofen%'
    THEN 'Ibuprofen'
    WHEN LOWER(brand_display_name) LIKE '%aspirin%' 
         OR LOWER(generic_display_name) LIKE '%aspirin%'
         OR LOWER(brand_name) LIKE '%aspirin%'
         OR LOWER(generic_name) LIKE '%aspirin%'
    THEN 'Aspirin'
    WHEN LOWER(brand_display_name) LIKE '%omeprazole%' 
         OR LOWER(generic_display_name) LIKE '%omeprazole%'
         OR LOWER(brand_name) LIKE '%omeprazole%'
         OR LOWER(generic_name) LIKE '%omeprazole%'
    THEN 'Omeprazole'
    ELSE NULL
  END as product_type
FROM ppb_products
WHERE (gtin IS NULL OR gtin = '')
  AND (
    LOWER(brand_display_name) LIKE '%metformin%' 
    OR LOWER(generic_display_name) LIKE '%metformin%'
    OR LOWER(brand_name) LIKE '%metformin%'
    OR LOWER(generic_name) LIKE '%metformin%'
    OR LOWER(brand_display_name) LIKE '%amoxicillin%' 
    OR LOWER(generic_display_name) LIKE '%amoxicillin%'
    OR LOWER(brand_name) LIKE '%amoxicillin%'
    OR LOWER(generic_name) LIKE '%amoxicillin%'
    OR LOWER(brand_display_name) LIKE '%paracetamol%' 
    OR LOWER(generic_display_name) LIKE '%paracetamol%'
    OR LOWER(brand_name) LIKE '%paracetamol%'
    OR LOWER(generic_name) LIKE '%paracetamol%'
    OR LOWER(brand_display_name) LIKE '%ibuprofen%' 
    OR LOWER(generic_display_name) LIKE '%ibuprofen%'
    OR LOWER(brand_name) LIKE '%ibuprofen%'
    OR LOWER(generic_name) LIKE '%ibuprofen%'
    OR LOWER(brand_display_name) LIKE '%aspirin%' 
    OR LOWER(generic_display_name) LIKE '%aspirin%'
    OR LOWER(brand_name) LIKE '%aspirin%'
    OR LOWER(generic_name) LIKE '%aspirin%'
    OR LOWER(brand_display_name) LIKE '%omeprazole%' 
    OR LOWER(generic_display_name) LIKE '%omeprazole%'
    OR LOWER(brand_name) LIKE '%omeprazole%'
    OR LOWER(generic_name) LIKE '%omeprazole%'
  )
ORDER BY product_type, etcd_product_id;

-- ============================================
-- STEP 3: Seed GTINs from seed file by ETC ID
-- ============================================
-- GTINs extracted from seed_ppb_consignment_newest_structure.json:
-- - Metformin 500mg Tablets -> 61640056789012
-- - Amoxicillin 250mg Capsules -> 61640056789013
-- - Paracetamol 500mg Tablets -> 61640056789016
-- - Ibuprofen 400mg Tablets -> 61640056789017
-- - Aspirin 100mg Tablets -> 61640056789020
-- - Omeprazole 20mg Capsules -> 61640056789021

-- Update GTINs by matching ETC ID (etcd_product_id) ONLY
-- This matches by ETC ID ONLY - NOT by product name or any other field
-- Replace the ETC IDs below with the actual etcd_product_id values from your database
-- (Use the query above to find the correct ETC IDs)

UPDATE ppb_products
SET 
  gtin = CASE
    -- Metformin 500mg Tablets
    WHEN etcd_product_id = 'PH10947' THEN '61640056789012'
    
    -- Amoxicillin 250mg Capsules
    WHEN etcd_product_id = 'PH11949' THEN '61640056789013'
    
    -- Paracetamol 500mg Tablets
    WHEN etcd_product_id = 'PH1223' THEN '61640056789016'
    
    -- Ibuprofen 400mg Tablets
    WHEN etcd_product_id = 'PH11403' THEN '61640056789017'
    
    -- Aspirin 100mg Tablets
    WHEN etcd_product_id = 'PH974' THEN '61640056789020'
    
    -- Omeprazole 20mg Capsules
    WHEN etcd_product_id = 'PH20556' THEN '61640056789021'
    
    ELSE NULL
  END,
  updated_at = NOW()
WHERE (gtin IS NULL OR gtin = '')
  AND etcd_product_id IN (
    'PH10947',  -- Metformin 500 mg Oral Tablet
    'PH11949',  -- Amoxicillin 250 mg Oral Capsule
    'PH1223',   -- Paracetamol 500 mg Oral Tablet
    'PH11403',  -- Ibuprofen 400 mg Oral Tablet
    'PH974',    -- Aspirin 100 mg Oral Tablet
    'PH20556'   -- Omeprazole 20 mg Oral Capsule
  );

-- ============================================
-- STEP 4: Check which products are Essential Medicines (KEML)
-- ============================================
-- Check which of the seeded products are essential medicines
-- KEML status is indicated by keml_status = 'Yes' or keml_is_on_keml = true

SELECT 
  'Essential Medicines (KEML) Status for Seeded Products' as report_title;

-- List all products that were just seeded with their KEML status
SELECT 
  id,
  etcd_product_id,
  brand_display_name,
  generic_display_name,
  gtin,
  keml_status,
  keml_is_on_keml,
  keml_category,
  keml_drug_class,
  CASE 
    WHEN keml_status = 'Yes' OR keml_is_on_keml = true THEN 'Essential Medicine (KEML)'
    WHEN keml_status = 'No' OR keml_is_on_keml = false THEN 'Not Essential Medicine'
    WHEN keml_status IS NULL AND keml_is_on_keml IS NULL THEN 'KEML Status Unknown'
    ELSE 'KEML Status: ' || COALESCE(keml_status::text, 'NULL')
  END as keml_indicator
FROM ppb_products
WHERE gtin IN (
  '61640056789012', -- Metformin
  '61640056789013', -- Amoxicillin
  '61640056789016', -- Paracetamol
  '61640056789017', -- Ibuprofen
  '61640056789020', -- Aspirin
  '61640056789021'  -- Omeprazole
)
ORDER BY gtin;

-- Summary of KEML status for seeded products
SELECT 
  gtin,
  CASE 
    WHEN gtin = '61640056789012' THEN 'Metformin 500mg Tablets'
    WHEN gtin = '61640056789013' THEN 'Amoxicillin 250mg Capsules'
    WHEN gtin = '61640056789016' THEN 'Paracetamol 500mg Tablets'
    WHEN gtin = '61640056789017' THEN 'Ibuprofen 400mg Tablets'
    WHEN gtin = '61640056789020' THEN 'Aspirin 100mg Tablets'
    WHEN gtin = '61640056789021' THEN 'Omeprazole 20mg Capsules'
    ELSE 'Unknown'
  END as product_name,
  COUNT(*) as product_count,
  COUNT(CASE WHEN keml_status = 'Yes' OR keml_is_on_keml = true THEN 1 END) as essential_medicine_count,
  COUNT(CASE WHEN keml_status = 'No' OR keml_is_on_keml = false THEN 1 END) as not_essential_count,
  COUNT(CASE WHEN keml_status IS NULL AND keml_is_on_keml IS NULL THEN 1 END) as unknown_keml_count
FROM ppb_products
WHERE gtin IN (
  '61640056789012', -- Metformin
  '61640056789013', -- Amoxicillin
  '61640056789016', -- Paracetamol
  '61640056789017', -- Ibuprofen
  '61640056789020', -- Aspirin
  '61640056789021'  -- Omeprazole
)
GROUP BY gtin
ORDER BY gtin;

-- List products that are Essential Medicines (KEML not null/Yes)
SELECT 
  'Products that are Essential Medicines (KEML)' as status;
  
SELECT 
  id,
  etcd_product_id,
  brand_display_name,
  generic_display_name,
  gtin,
  keml_status,
  keml_is_on_keml,
  keml_category,
  keml_drug_class
FROM ppb_products
WHERE gtin IN (
  '61640056789012', -- Metformin
  '61640056789013', -- Amoxicillin
  '61640056789016', -- Paracetamol
  '61640056789017', -- Ibuprofen
  '61640056789020', -- Aspirin
  '61640056789021'  -- Omeprazole
)
AND (keml_status = 'Yes' OR keml_is_on_keml = true)
ORDER BY gtin;

-- ============================================
-- STEP 5: Verify results
-- ============================================
-- Check how many products still don't have GTINs
SELECT 
  'Products still without GTINs:' as status,
  COUNT(*) as count
FROM ppb_products
WHERE gtin IS NULL OR gtin = '';

-- List products that were updated
SELECT 
  id,
  etcd_product_id,
  brand_display_name,
  generic_display_name,
  gtin,
  keml_status,
  keml_is_on_keml,
  updated_at
FROM ppb_products
WHERE gtin IS NOT NULL 
  AND gtin != ''
  AND updated_at >= NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- ============================================
-- STEP 6: Summary
-- ============================================
SELECT 
  'Total products' as metric,
  COUNT(*) as count
FROM ppb_products
UNION ALL
SELECT 
  'Products with GTINs' as metric,
  COUNT(*) as count
FROM ppb_products
WHERE gtin IS NOT NULL AND gtin != ''
UNION ALL
SELECT 
  'Products without GTINs' as metric,
  COUNT(*) as count
FROM ppb_products
WHERE gtin IS NULL OR gtin = ''
UNION ALL
SELECT 
  'Seeded products (from seed file)' as metric,
  COUNT(*) as count
FROM ppb_products
WHERE gtin IN (
  '61640056789012', -- Metformin
  '61640056789013', -- Amoxicillin
  '61640056789016', -- Paracetamol
  '61640056789017', -- Ibuprofen
  '61640056789020', -- Aspirin
  '61640056789021'  -- Omeprazole
)
UNION ALL
SELECT 
  'Seeded products that are Essential Medicines (KEML)' as metric,
  COUNT(*) as count
FROM ppb_products
WHERE gtin IN (
  '61640056789012', -- Metformin
  '61640056789013', -- Amoxicillin
  '61640056789016', -- Paracetamol
  '61640056789017', -- Ibuprofen
  '61640056789020', -- Aspirin
  '61640056789021'  -- Omeprazole
)
AND (keml_status = 'Yes' OR keml_is_on_keml = true);



