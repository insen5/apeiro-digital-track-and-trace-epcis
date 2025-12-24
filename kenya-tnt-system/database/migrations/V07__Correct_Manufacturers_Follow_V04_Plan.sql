-- V07__Correct_Manufacturers_Follow_V04_Plan.sql
-- Description: Fix V06 mistake - use parties table for manufacturers instead of separate table
-- Date: 2025-12-14
-- Purpose: Align with V04's original vision - unified party model

BEGIN;

-- ============================================================================
-- PART 1: Fix product_manufacturers to use party_id (V04's original plan)
-- ============================================================================

-- Drop the wrong FK constraint
ALTER TABLE product_manufacturers 
DROP CONSTRAINT IF EXISTS product_manufacturers_manufacturer_id_fkey;

-- Rename column to match V04's plan
ALTER TABLE product_manufacturers 
RENAME COLUMN manufacturer_id TO party_id;

-- Add correct FK to parties table
ALTER TABLE product_manufacturers 
ADD CONSTRAINT product_manufacturers_party_id_fkey 
FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE;

-- Update index name
DROP INDEX IF EXISTS idx_product_manufacturers_manufacturer;
CREATE INDEX idx_product_manufacturers_party ON product_manufacturers(party_id);

-- Update unique constraint name
ALTER TABLE product_manufacturers 
DROP CONSTRAINT IF EXISTS product_manufacturers_product_id_manufacturer_id_key;

ALTER TABLE product_manufacturers 
ADD CONSTRAINT product_manufacturers_product_id_party_id_key 
UNIQUE(product_id, party_id);

COMMENT ON TABLE product_manufacturers IS 'Product-Party mapping for manufacturers. Links products to manufacturer parties (party_type=manufacturer).';

-- ============================================================================
-- PART 2: Fix batches to use party_id instead of manufacturer_id
-- ============================================================================

-- Drop the wrong FK
ALTER TABLE batches 
DROP CONSTRAINT IF EXISTS batches_manufacturer_id_fkey;

-- Rename column
ALTER TABLE batches 
RENAME COLUMN manufacturer_id TO manufacturer_party_id;

-- Add correct FK to parties
ALTER TABLE batches 
ADD CONSTRAINT batches_manufacturer_party_id_fkey 
FOREIGN KEY (manufacturer_party_id) REFERENCES parties(id);

-- Update index
DROP INDEX IF EXISTS idx_batches_manufacturer;
CREATE INDEX idx_batches_manufacturer_party ON batches(manufacturer_party_id);

COMMENT ON COLUMN batches.manufacturer_party_id IS 'FK to parties table (party_type=manufacturer). Identifies WHO manufactured this batch.';

-- ============================================================================
-- PART 3: Migrate data from manufacturers table to parties
-- ============================================================================

-- Ensure all manufacturers from separate table are in parties
INSERT INTO parties (name, gln, party_type, ppb_id, country)
SELECT 
  m.name,
  m.gln,
  'manufacturer' AS party_type,
  m.entity_id,
  m.country
FROM manufacturers m
WHERE NOT EXISTS (
  SELECT 1 FROM parties p 
  WHERE p.name = m.name AND p.party_type = 'manufacturer'
)
ON CONFLICT (gln, party_type) DO NOTHING;

-- Update batches to use party_id
UPDATE batches b
SET manufacturer_party_id = p.id
FROM manufacturers m
JOIN parties p ON p.name = m.name AND p.party_type = 'manufacturer'
WHERE b.manufacturer_party_id = m.id;

-- ============================================================================
-- PART 4: Drop manufacturers table (no longer needed)
-- ============================================================================

-- Drop the separate manufacturers table
DROP TABLE IF EXISTS manufacturers CASCADE;

COMMENT ON COLUMN parties.party_type IS 'Type of party: manufacturer, supplier, importer, distributor, logistics_provider, etc.';

-- ============================================================================
-- PART 5: Apply remaining V04 changes that were never applied
-- ============================================================================

-- Create contacts table (from V04)
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  person_name VARCHAR(255),
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  organization_id INTEGER,
  organization_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id, organization_type);

COMMENT ON TABLE contacts IS 'Contact information for parties, suppliers, premises, etc.';

-- Create supplier_roles table (from V04)
CREATE TABLE IF NOT EXISTS supplier_roles (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  UNIQUE(supplier_id, role)
);

-- Migrate from text[] array if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'roles'
  ) THEN
    INSERT INTO supplier_roles (supplier_id, role)
    SELECT s.id, unnest(s.roles)
    FROM suppliers s
    WHERE s.roles IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    ALTER TABLE suppliers DROP COLUMN roles;
  END IF;
END $$;

COMMENT ON TABLE supplier_roles IS 'Supplier roles (normalized). Was text[] array, now proper junction table.';

-- ============================================================================
-- PART 6: Helper View for Easy Manufacturer Queries
-- ============================================================================

CREATE OR REPLACE VIEW manufacturers_view AS
SELECT 
  p.id,
  p.name,
  p.gln,
  p.country,
  p.ppb_id as entity_id,
  p.created_at,
  COUNT(DISTINCT pm.product_id) as product_count,
  COUNT(DISTINCT b.id) as batch_count
FROM parties p
LEFT JOIN product_manufacturers pm ON pm.party_id = p.id
LEFT JOIN batches b ON b.manufacturer_party_id = p.id
WHERE p.party_type = 'manufacturer'
GROUP BY p.id, p.name, p.gln, p.country, p.ppb_id, p.created_at;

COMMENT ON VIEW manufacturers_view IS 'Convenience view for manufacturer queries. Shows manufacturers from parties table with counts.';

-- ============================================================================
-- PART 7: Grant Permissions
-- ============================================================================

GRANT ALL ON contacts TO tnt_user;
GRANT ALL ON supplier_roles TO tnt_user;
GRANT USAGE ON SEQUENCE contacts_id_seq TO tnt_user;
GRANT USAGE ON SEQUENCE supplier_roles_id_seq TO tnt_user;
GRANT SELECT ON manufacturers_view TO tnt_user;

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- SELECT COUNT(*) FROM parties WHERE party_type = 'manufacturer';
-- SELECT COUNT(*) FROM batches WHERE manufacturer_party_id IS NOT NULL;
-- SELECT * FROM manufacturers_view;
-- \d product_manufacturers  -- Should show party_id now
-- \d batches  -- Should show manufacturer_party_id now




