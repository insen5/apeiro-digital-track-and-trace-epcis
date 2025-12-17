-- =====================================================================================
-- Migration V12: Separate Test GTINs from Production Products
-- =====================================================================================
-- Date: December 14, 2025
-- Purpose: 
--   - 30 dummy GTINs were assigned to REAL production products for demos
--   - This migration creates dedicated test products for those GTINs
--   - Restores production products to their proper state (without dummy GTINs)
-- =====================================================================================

BEGIN;

-- Step 1: Create audit table to track the changes
CREATE TABLE IF NOT EXISTS ppb_products_test_gtin_migration_audit (
    id SERIAL PRIMARY KEY,
    original_product_id INTEGER,
    original_etcd_id VARCHAR(255),
    original_brand_name TEXT,
    dummy_gtin VARCHAR(14),
    new_test_product_id INTEGER,
    migration_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Step 2: Store the current state for audit
INSERT INTO ppb_products_test_gtin_migration_audit (
    original_product_id,
    original_etcd_id,
    original_brand_name,
    dummy_gtin,
    notes
)
SELECT 
    id,
    etcd_product_id,
    brand_display_name,
    gtin,
    'Production product with dummy GTIN - will be separated'
FROM ppb_products
WHERE LENGTH(gtin) = 14
  AND etcd_product_id NOT LIKE 'PH-TEST-%'  -- Exclude already-test products
  AND etcd_product_id != 'PH12345'           -- Exclude test product
ORDER BY id;

-- Step 3: Create dedicated test products for each dummy GTIN
-- These will be VERY SIMILAR to the real products (for realistic demos)
-- Only difference: marked as test and have TEST- prefix
INSERT INTO ppb_products (
    etcd_product_id,
    generic_concept_id,
    generic_concept_code,
    ppb_registration_code,
    brand_name,
    brand_display_name,
    generic_name,
    generic_display_name,
    gtin,
    strength_amount,
    strength_unit,
    route_description,
    route_id,
    route_code,
    form_description,
    form_id,
    form_code,
    active_component_id,
    active_component_code,
    level_of_use,
    keml_status,
    updation_date,
    keml_is_on_keml,
    keml_category,
    keml_drug_class,
    formulary_included,
    category,
    manufacturers,
    programs_mapping,
    is_test,
    "createdAt",
    "updatedAt"
)
SELECT 
    'TEST-' || etcd_product_id AS etcd_product_id,
    generic_concept_id,
    generic_concept_code,
    ppb_registration_code,
    brand_name,  -- Keep original name (realistic for demos)
    brand_display_name,  -- Keep original display name
    generic_name,
    generic_display_name,
    gtin,  -- Keep the dummy GTIN
    strength_amount,
    strength_unit,
    route_description,
    route_id,
    route_code,
    form_description,
    form_id,
    form_code,
    active_component_id,
    active_component_code,
    level_of_use,
    keml_status,
    updation_date,
    keml_is_on_keml,
    keml_category,
    keml_drug_class,
    formulary_included,
    category,
    manufacturers,  -- Keep manufacturer info for realistic demos
    programs_mapping,
    true AS is_test,  -- ONLY difference: marked as test
    NOW(),
    NOW()
FROM ppb_products
WHERE LENGTH(gtin) = 14
  AND etcd_product_id NOT LIKE 'PH-TEST-%'
  AND etcd_product_id != 'PH12345'
RETURNING id, etcd_product_id, brand_display_name, gtin;

-- Step 4: Update audit table with new test product IDs
UPDATE ppb_products_test_gtin_migration_audit a
SET new_test_product_id = (
    SELECT id 
    FROM ppb_products 
    WHERE etcd_product_id = 'TEST-' || a.original_etcd_id
    LIMIT 1
);

-- Step 5: Clear dummy GTINs from original production products and mark as production
UPDATE ppb_products
SET 
    gtin = NULL,
    is_test = false,
    "updatedAt" = NOW()
WHERE LENGTH(gtin) = 14
  AND etcd_product_id NOT LIKE 'PH-TEST-%'
  AND etcd_product_id NOT LIKE 'TEST-%'
  AND etcd_product_id != 'PH12345';

-- Step 6: Verify the migration
DO $$
DECLARE
    test_products_count INTEGER;
    production_with_14digit INTEGER;
    new_test_count INTEGER;
BEGIN
    -- Count test products with 14-digit GTINs
    SELECT COUNT(*) INTO test_products_count
    FROM ppb_products
    WHERE is_test = true AND LENGTH(gtin) = 14;
    
    -- Count production products still with 14-digit GTINs (should be 0)
    SELECT COUNT(*) INTO production_with_14digit
    FROM ppb_products
    WHERE (is_test IS NOT TRUE OR is_test IS NULL) AND LENGTH(gtin) = 14;
    
    -- Count newly created test products
    SELECT COUNT(*) INTO new_test_count
    FROM ppb_products
    WHERE etcd_product_id LIKE 'TEST-%' AND etcd_product_id NOT LIKE 'PH-TEST-%';
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  - Test products with 14-digit GTINs: %', test_products_count;
    RAISE NOTICE '  - Production products with 14-digit GTINs: %', production_with_14digit;
    RAISE NOTICE '  - Newly created TEST products: %', new_test_count;
    
    IF production_with_14digit > 0 THEN
        RAISE EXCEPTION 'Migration failed: % production products still have 14-digit GTINs', production_with_14digit;
    END IF;
    
    IF new_test_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: No test products were created';
    END IF;
END $$;

-- Step 7: Add comment to migration audit table
COMMENT ON TABLE ppb_products_test_gtin_migration_audit IS 
'Audit trail for V12 migration: Separated dummy test GTINs from production products';

COMMIT;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Summary:
--   1. Created dedicated test products with dummy GTINs for demos
--   2. Cleared dummy GTINs from real production products
--   3. Marked production products as is_test=false
--   4. All test products now have etcd_product_id starting with 'TEST-'
--   5. Audit trail saved in ppb_products_test_gtin_migration_audit
-- =====================================================================================

