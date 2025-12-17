-- V06__Cleanup_PPB_Batches_And_Add_Manufacturers.sql
-- Description: Complete cleanup of ppb_batches and add proper manufacturer master data
-- Date: 2025-12-14
-- Purpose: Fix normalization issues - remove redundant columns from ppb_batches and create manufacturers table

BEGIN;

-- ============================================================================
-- PART 1: Create Manufacturers Master Data Table (CRITICAL FIX)
-- ============================================================================

CREATE TABLE IF NOT EXISTS manufacturers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  entity_id VARCHAR(100) UNIQUE,
  gln VARCHAR(100) UNIQUE,
  country VARCHAR(2),
  party_id INTEGER REFERENCES parties(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manufacturers_gln ON manufacturers(gln);
CREATE INDEX IF NOT EXISTS idx_manufacturers_entity_id ON manufacturers(entity_id);
CREATE INDEX IF NOT EXISTS idx_manufacturers_party_id ON manufacturers(party_id);

COMMENT ON TABLE manufacturers IS 'Manufacturer master data with GLN support for EPCIS compliance';

-- ============================================================================
-- PART 2: Migrate Manufacturer Data from ppb_batches
-- ============================================================================

-- Extract unique manufacturers from ppb_batches and create entries
-- Note: manufacturer_gln column was already dropped, so we'll only use name
INSERT INTO manufacturers (name, entity_id)
SELECT DISTINCT
  pb.manufacturer_name AS name,
  'MFG-' || md5(pb.manufacturer_name) AS entity_id
FROM ppb_batches pb
WHERE pb.manufacturer_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM manufacturers m 
    WHERE m.name = pb.manufacturer_name
  )
ON CONFLICT (entity_id) DO NOTHING;

-- Create corresponding party entries for manufacturers
INSERT INTO parties (name, party_type, ppb_id)
SELECT DISTINCT
  m.name,
  'manufacturer' AS party_type,
  m.entity_id
FROM manufacturers m
WHERE NOT EXISTS (
  SELECT 1 FROM parties p 
  WHERE p.name = m.name AND p.party_type = 'manufacturer'
);
-- Note: May have conflicts if gln is null, so we skip the ON CONFLICT clause

-- Link manufacturers to parties
UPDATE manufacturers m
SET party_id = p.id
FROM parties p
WHERE p.name = m.name 
  AND p.party_type = 'manufacturer'
  AND m.party_id IS NULL;

-- ============================================================================
-- PART 3: Create product_manufacturers Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_manufacturers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE CASCADE,
  manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, manufacturer_id)
);

CREATE INDEX IF NOT EXISTS idx_product_manufacturers_product ON product_manufacturers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_manufacturers_manufacturer ON product_manufacturers(manufacturer_id);

COMMENT ON TABLE product_manufacturers IS 'Product-Manufacturer mapping (normalized). Replaces deprecated manufacturers JSONB column in ppb_products.';

-- ============================================================================
-- PART 4: Add manufacturer_id to batches table
-- ============================================================================

ALTER TABLE batches ADD COLUMN IF NOT EXISTS manufacturer_id INTEGER REFERENCES manufacturers(id);

CREATE INDEX IF NOT EXISTS idx_batches_manufacturer ON batches(manufacturer_id);

-- Link batches to manufacturers via ppb_batches
UPDATE batches b
SET manufacturer_id = m.id
FROM ppb_batches pb
JOIN manufacturers m ON m.name = pb.manufacturer_name
WHERE b.batchno = pb.batch_number
  AND b.manufacturer_id IS NULL;

-- ============================================================================
-- PART 5: Clean Up ppb_batches (Remove Remaining Normalized Columns)
-- ============================================================================

-- Drop remaining columns that should have been normalized
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS manufacturer_name;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS approval_status;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS approval_date_stamp;

-- ppb_batches NOW CONTAINS ONLY:
-- id, gtin, batch_number, product_code, permit_id, consignment_ref_number,
-- is_partial_approval, serialization_range, status, expiration_date,
-- processed_status, processing_error, validation_errors, validation_warnings,
-- validation_info, created_date, last_modified_date (17 columns total)

COMMENT ON TABLE ppb_batches IS 'PPB import audit log (minimal). All operational data migrated to normalized tables (batches, consignments, manufacturers). Retain for audit trail and serialization_range JSONB only.';

-- ============================================================================
-- PART 6: Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON manufacturers TO tnt_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_manufacturers TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE manufacturers_id_seq TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE product_manufacturers_id_seq TO tnt_user;

COMMIT;

-- ============================================================================
-- Verification Queries (Run these after migration)
-- ============================================================================

-- SELECT COUNT(*) as total_manufacturers FROM manufacturers;
-- SELECT COUNT(*) as batches_with_manufacturer FROM batches WHERE manufacturer_id IS NOT NULL;
-- SELECT COUNT(*) as ppb_batches_columns FROM information_schema.columns WHERE table_name = 'ppb_batches';
-- Expected ppb_batches columns: ~17 (down from 30+)
