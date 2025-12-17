-- V7__Fix_L5_TNT_Product_FKs_And_Remove_Legacy_Tables.sql
-- 1. Fix L5 TNT tables to reference ppb_products instead of legacy products table
-- 2. Remove epcis_event_summary table (replaced by normalized epcis_events)
-- 3. Remove products table and all legacy references

-- ============================================
-- PART 1: Fix L5 TNT Foreign Keys
-- ============================================

-- Drop old foreign keys to products table
ALTER TABLE product_status DROP CONSTRAINT IF EXISTS product_status_product_id_fkey;
ALTER TABLE product_destruction DROP CONSTRAINT IF EXISTS product_destruction_product_id_fkey;
ALTER TABLE product_returns DROP CONSTRAINT IF EXISTS product_returns_product_id_fkey;
ALTER TABLE product_verifications DROP CONSTRAINT IF EXISTS product_verifications_product_id_fkey;
ALTER TABLE facility_dispensing DROP CONSTRAINT IF EXISTS facility_dispensing_product_id_fkey;
ALTER TABLE facility_inventory DROP CONSTRAINT IF EXISTS facility_inventory_product_id_fkey;

-- Add new foreign keys to ppb_products
ALTER TABLE product_status ADD CONSTRAINT product_status_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id);

ALTER TABLE product_destruction ADD CONSTRAINT product_destruction_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id);

ALTER TABLE product_returns ADD CONSTRAINT product_returns_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id);

ALTER TABLE product_verifications ADD CONSTRAINT product_verifications_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id);

ALTER TABLE facility_dispensing ADD CONSTRAINT facility_dispensing_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id);

ALTER TABLE facility_inventory ADD CONSTRAINT facility_inventory_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES ppb_products(id);

-- ============================================
-- PART 2: Remove epcis_event_summary table
-- ============================================

-- Drop all indexes first
DROP INDEX IF EXISTS idx_epcis_event_summary_event_time;
DROP INDEX IF EXISTS idx_epcis_event_summary_parent_id;
DROP INDEX IF EXISTS idx_epcis_event_summary_biz_step;
DROP INDEX IF EXISTS idx_epcis_event_summary_event_type;
DROP INDEX IF EXISTS idx_epcis_event_summary_read_point;
DROP INDEX IF EXISTS idx_epcis_event_summary_actor_type;
DROP INDEX IF EXISTS idx_epcis_event_summary_actor_user_id;
DROP INDEX IF EXISTS idx_epcis_event_summary_actor_gln;
DROP INDEX IF EXISTS idx_epcis_event_summary_source_entity;

-- Drop the table (CASCADE will handle any remaining foreign keys)
DROP TABLE IF EXISTS epcis_event_summary CASCADE;

-- ============================================
-- PART 3: Remove legacy products table and references
-- ============================================

-- First, drop foreign keys from other tables that reference products
-- (These should already be migrated, but drop them to be safe)

-- Drop foreign keys from legacy junction tables
ALTER TABLE product_programs DROP CONSTRAINT IF EXISTS product_programs_productId_fkey;
ALTER TABLE product_manufacturers DROP CONSTRAINT IF EXISTS product_manufacturers_productId_fkey;

-- Drop legacy junction tables
DROP TABLE IF EXISTS product_programs CASCADE;
DROP TABLE IF EXISTS product_manufacturers CASCADE;

-- Drop foreign keys from batches table (should already be using ppb_products, but check)
-- Note: batches.productId should already reference ppb_products, but if it references products, we need to fix it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'batches_productId_fkey' 
    AND table_name = 'batches'
  ) THEN
    ALTER TABLE batches DROP CONSTRAINT batches_productId_fkey;
    ALTER TABLE batches ADD CONSTRAINT batches_productId_fkey 
      FOREIGN KEY (productId) REFERENCES ppb_products(id);
  END IF;
END $$;

-- Drop foreign key from cases_products (should already be using ppb_products)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cases_products_productId_fkey' 
    AND table_name = 'cases_products'
  ) THEN
    ALTER TABLE cases_products DROP CONSTRAINT cases_products_productId_fkey;
    ALTER TABLE cases_products ADD CONSTRAINT cases_products_productId_fkey 
      FOREIGN KEY (productId) REFERENCES ppb_products(id);
  END IF;
END $$;

-- Drop indexes on products table
DROP INDEX IF EXISTS idx_products_gtin;
DROP INDEX IF EXISTS idx_products_user_id;
DROP INDEX IF EXISTS idx_products_is_enabled;

-- Finally, drop the products table
DROP TABLE IF EXISTS products CASCADE;

-- ============================================
-- Verification Queries (for manual check)
-- ============================================

-- Verify no foreign keys reference products table anymore
-- SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'products';

-- Verify epcis_event_summary is gone
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'epcis_event_summary';

-- Verify products table is gone
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'products';


