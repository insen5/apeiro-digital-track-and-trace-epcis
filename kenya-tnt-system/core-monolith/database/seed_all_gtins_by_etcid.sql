-- ============================================
-- Seed GTINs for All Products by ETC ID (PH codes)
-- ============================================
-- This script seeds GTINs for all products from the product catalogue
-- by matching ETC ID (etcd_product_id) which uses PH prefix (e.g., PH4883, PH12907)
--
-- Based on the product list provided:
-- - Column B: code (ETC ID with PH prefix, e.g., PH4883)
-- - Column G: gtin (dummy GTIN to be seeded, e.g., 8901234568118)
-- ============================================

-- ============================================
-- STEP 1: Check current status
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
WHERE gtin IS NULL OR gtin = '';

-- ============================================
-- STEP 2: Seed GTINs by ETC ID (PH codes)
-- ============================================
-- Using a VALUES clause for easy mapping
-- Add all PH codes and their corresponding GTINs from your product list

UPDATE ppb_products
SET 
  gtin = mapping.gtin,
  "updatedAt" = NOW()
FROM (
  VALUES
    -- Format: ('PH_CODE', 'GTIN')
    -- All 25 products from the product list:
    ('PH4883', '8901234568118'),
    ('PH12907', '8901234567913'),
    ('PH12389', '8901234567999'),
    ('PH4423', '8901234568002'),
    ('PH20558', '8901234567951'),
    ('PH8318', '8901234568019'),
    ('PH6611', '8901234568187'),
    ('PH3623', '8901234568064'),
    ('PH15133', '8901234568026'),
    ('PH436', '8901234568033'),
    ('PH7896', '8901234568040'),
    ('PH2079', '8901234568170'),
    ('PH12661', '8901234568163'),
    ('PH4410', '8901234567920'),
    ('PH10948', '8901234568095'),
    ('PH5061', '8901234568156'),
    ('PH8409', '8901234567968'),
    ('PH13984', '8901234568057'),
    ('PH20556', '8901234568132'),
    ('PH14479', '8901234567890'),
    ('PH10946', '8901234568149'),
    ('PH3546', '8901234567982'),
    ('PH24598', '8901234568071'),
    ('PH4523', '8901234568101'),
    ('PH3851', '8901234567944')
) AS mapping(etcd_id, gtin)
WHERE ppb_products.etcd_product_id = mapping.etcd_id
  AND (ppb_products.gtin IS NULL OR ppb_products.gtin = '');

-- ============================================
-- STEP 3: Verify seeded GTINs
-- ============================================
SELECT 
  etcd_product_id,
  brand_display_name,
  generic_display_name,
  gtin,
  keml_status,
  keml_is_on_keml,
  CASE 
    WHEN keml_status = 'Yes' OR keml_is_on_keml = true THEN 'Essential Medicine (KEML)'
    WHEN keml_status = 'No' OR keml_is_on_keml = false THEN 'Not Essential Medicine'
    WHEN keml_status IS NULL AND keml_is_on_keml IS NULL THEN 'KEML Status Unknown'
    ELSE 'KEML Status: ' || COALESCE(keml_status::text, 'NULL')
  END as keml_indicator
FROM ppb_products
WHERE etcd_product_id IN (
  SELECT etcd_id FROM (VALUES
    ('PH4883'),
    ('PH12907'),
    ('PH12389'),
    ('PH4423'),
    ('PH20558'),
    ('PH8318'),
    ('PH6611'),
    ('PH3623'),
    ('PH15133'),
    ('PH436'),
    ('PH7896'),
    ('PH2079'),
    ('PH12661'),
    ('PH4410'),
    ('PH10948'),
    ('PH5061'),
    ('PH8409'),
    ('PH13984'),
    ('PH20556'),
    ('PH14479'),
    ('PH10946'),
    ('PH3546'),
    ('PH24598'),
    ('PH4523'),
    ('PH3851')
  ) AS codes(etcd_id)
)
ORDER BY etcd_product_id;

-- ============================================
-- STEP 4: Summary of Essential Medicines (KEML)
-- ============================================
SELECT 
  'Essential Medicines (KEML) Summary' as report_title;

SELECT 
  etcd_product_id,
  brand_display_name,
  gtin,
  keml_status,
  keml_is_on_keml
FROM ppb_products
WHERE etcd_product_id IN (
  SELECT etcd_id FROM (VALUES
    ('PH4883'),
    ('PH12907'),
    ('PH12389'),
    ('PH4423'),
    ('PH20558'),
    ('PH8318'),
    ('PH6611'),
    ('PH3623'),
    ('PH15133'),
    ('PH436'),
    ('PH7896'),
    ('PH2079'),
    ('PH12661'),
    ('PH4410'),
    ('PH10948'),
    ('PH5061'),
    ('PH8409'),
    ('PH13984'),
    ('PH20556'),
    ('PH14479'),
    ('PH10946'),
    ('PH3546'),
    ('PH24598'),
    ('PH4523'),
    ('PH3851')
  ) AS codes(etcd_id)
)
AND (keml_status = 'Yes' OR keml_is_on_keml = true)
ORDER BY etcd_product_id;

-- Count summary
SELECT 
  COUNT(*) as total_products_seeded,
  COUNT(CASE WHEN keml_status = 'Yes' OR keml_is_on_keml = true THEN 1 END) as essential_medicines_count,
  COUNT(CASE WHEN keml_status = 'No' OR keml_is_on_keml = false THEN 1 END) as not_essential_count,
  COUNT(CASE WHEN keml_status IS NULL AND keml_is_on_keml IS NULL THEN 1 END) as unknown_keml_count
FROM ppb_products
WHERE etcd_product_id IN (
  SELECT etcd_id FROM (VALUES
    ('PH4883'),
    ('PH12907'),
    ('PH12389'),
    ('PH4423'),
    ('PH20558'),
    ('PH8318'),
    ('PH6611'),
    ('PH3623'),
    ('PH15133'),
    ('PH436'),
    ('PH7896'),
    ('PH2079'),
    ('PH12661'),
    ('PH4410'),
    ('PH10948'),
    ('PH5061'),
    ('PH8409'),
    ('PH13984'),
    ('PH20556'),
    ('PH14479'),
    ('PH10946'),
    ('PH3546'),
    ('PH24598'),
    ('PH4523'),
    ('PH3851')
  ) AS codes(etcd_id)
)
AND gtin IS NOT NULL AND gtin != '';



