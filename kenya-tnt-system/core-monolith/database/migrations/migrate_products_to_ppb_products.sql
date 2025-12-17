-- Migration: Migrate from legacy products table to ppb_products table
-- This migration moves all foreign key references from products to ppb_products

-- ============================================
-- STEP 1: Add new foreign key columns
-- ============================================
ALTER TABLE batches ADD COLUMN IF NOT EXISTS ppb_product_id INTEGER;
ALTER TABLE cases_products ADD COLUMN IF NOT EXISTS ppb_product_id INTEGER;

-- ============================================
-- STEP 2: Migrate data by matching GTIN or etcd_product_id
-- ============================================
-- Migrate batches: Match products to ppb_products by GTIN or etcd_product_id
UPDATE batches b
SET ppb_product_id = pp.id
FROM products p
LEFT JOIN ppb_products pp ON (
  (p.gtin IS NOT NULL AND p.gtin = pp.gtin) OR
  (p.etcd_product_id IS NOT NULL AND p.etcd_product_id = pp.etcd_product_id)
)
WHERE b.product_id = p.id
  AND pp.id IS NOT NULL;

-- Migrate cases_products: Match products to ppb_products by GTIN or etcd_product_id
UPDATE cases_products cp
SET ppb_product_id = pp.id
FROM products p
LEFT JOIN ppb_products pp ON (
  (p.gtin IS NOT NULL AND p.gtin = pp.gtin) OR
  (p.etcd_product_id IS NOT NULL AND p.etcd_product_id = pp.etcd_product_id)
)
WHERE cp.product_id = p.id
  AND pp.id IS NOT NULL;

-- ============================================
-- STEP 3: Handle orphaned records (products not found in ppb_products)
-- ============================================
-- Log warning for batches that couldn't be migrated
DO $$
DECLARE
  orphaned_batches INTEGER;
  orphaned_cases INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_batches
  FROM batches
  WHERE product_id IS NOT NULL AND ppb_product_id IS NULL;
  
  SELECT COUNT(*) INTO orphaned_cases
  FROM cases_products
  WHERE product_id IS NOT NULL AND ppb_product_id IS NULL;
  
  IF orphaned_batches > 0 OR orphaned_cases > 0 THEN
    RAISE WARNING 'Found % batches and % cases_products records that could not be migrated to ppb_products. These may need manual intervention.', 
      orphaned_batches, orphaned_cases;
  END IF;
END $$;

-- ============================================
-- STEP 4: Drop old foreign key constraints
-- ============================================
ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_product_id_fkey;
ALTER TABLE cases_products DROP CONSTRAINT IF EXISTS cases_products_product_id_fkey;

-- ============================================
-- STEP 5: Drop old product_id columns
-- ============================================
ALTER TABLE batches DROP COLUMN IF EXISTS product_id;
ALTER TABLE cases_products DROP COLUMN IF EXISTS product_id;

-- ============================================
-- STEP 6: Rename new columns to product_id
-- ============================================
ALTER TABLE batches RENAME COLUMN ppb_product_id TO product_id;
ALTER TABLE cases_products RENAME COLUMN ppb_product_id TO product_id;

-- ============================================
-- STEP 7: Add new foreign key constraints to ppb_products
-- ============================================
ALTER TABLE batches 
  ADD CONSTRAINT batches_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id) ON DELETE CASCADE;

ALTER TABLE cases_products 
  ADD CONSTRAINT cases_products_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id) ON DELETE CASCADE;

-- ============================================
-- STEP 8: Update indexes
-- ============================================
-- Indexes should already exist, but ensure they're correct
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_cases_products_product_id ON cases_products(product_id);

-- ============================================
-- STEP 9: Drop legacy product tables (after migration is verified)
-- ============================================
-- NOTE: Uncomment these lines after verifying the migration worked correctly
-- DROP TABLE IF EXISTS product_programs CASCADE;
-- DROP TABLE IF EXISTS product_manufacturers CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN batches.product_id IS 'Foreign key: Product from ppb_products (PPB Terminology API catalog)';
COMMENT ON COLUMN cases_products.product_id IS 'Foreign key: Product from ppb_products (PPB Terminology API catalog)';

