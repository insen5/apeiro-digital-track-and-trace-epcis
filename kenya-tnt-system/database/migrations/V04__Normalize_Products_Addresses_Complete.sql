-- V04__Normalize_Products_Addresses_Complete.sql
-- Description: Complete normalization - products, addresses, contacts
-- Date: 2025-12-11
-- Purpose: Eliminate ALL denormalization issues found in audit

BEGIN;

-- ============================================================================
-- PART 1: Normalize ppb_products.manufacturers (CRITICAL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_manufacturers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE CASCADE,
  party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, party_id)
);

CREATE INDEX idx_product_manufacturers_product ON product_manufacturers(product_id);
CREATE INDEX idx_product_manufacturers_party ON product_manufacturers(party_id);

-- Drop JSONB column (data will be migrated via application code on next sync)
ALTER TABLE ppb_products DROP COLUMN IF EXISTS manufacturers;

-- ============================================================================
-- PART 2: Use Existing programs Junction Table (CRITICAL)
-- ============================================================================

-- Drop JSONB column (junction table ppb_product_to_program_mapping already exists!)
ALTER TABLE ppb_products DROP COLUMN IF EXISTS programs_mapping;

COMMENT ON TABLE ppb_product_to_program_mapping IS 'Product-Program mapping (normalized). Replaces deprecated programs_mapping JSONB column.';

-- ============================================================================
-- PART 3: Create Contacts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  person_name VARCHAR(255),
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  organization_id INTEGER, -- Can link to suppliers, premises, etc.
  organization_type VARCHAR(50), -- 'supplier', 'premise', 'logistics_provider'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_organization ON contacts(organization_id, organization_type);

-- ============================================================================
-- PART 4: Normalize Premises Addresses
-- ============================================================================

ALTER TABLE premises ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id);

-- Migrate premise addresses to locations
INSERT INTO locations (sgln, label, location_type, country)
SELECT 
  p.gln AS sgln,
  p.premise_name AS label,
  'premise' AS location_type,
  p.country
FROM premises p
WHERE p.location_id IS NULL
ON CONFLICT (sgln) DO UPDATE SET label = EXCLUDED.label;

-- Link premises to locations
UPDATE premises p
SET location_id = l.id
FROM locations l
WHERE l.sgln = p.gln;

-- Drop address columns (data now in locations)
ALTER TABLE premises DROP COLUMN IF EXISTS address_line1;
ALTER TABLE premises DROP COLUMN IF EXISTS address_line2;
ALTER TABLE premises DROP COLUMN IF EXISTS county;
ALTER TABLE premises DROP COLUMN IF EXISTS constituency;
ALTER TABLE premises DROP COLUMN IF EXISTS ward;
ALTER TABLE premises DROP COLUMN IF EXISTS postal_code;

-- ============================================================================
-- PART 5: Normalize Suppliers
-- ============================================================================

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS hq_location_id INTEGER REFERENCES locations(id);

-- Migrate HQ addresses
INSERT INTO locations (sgln, label, location_type, country)
SELECT 
  COALESCE(s.hq_gln, s.entity_id || '000') AS sgln,
  s.hq_name || ' HQ' AS label,
  'headquarters' AS location_type,
  s.hq_country
FROM suppliers s
WHERE s.hq_location_id IS NULL
ON CONFLICT (sgln) DO UPDATE SET label = EXCLUDED.label;

-- Link suppliers
UPDATE suppliers s
SET hq_location_id = l.id
FROM locations l
WHERE l.sgln = COALESCE(s.hq_gln, s.entity_id || '000');

-- Drop address columns
ALTER TABLE suppliers DROP COLUMN IF EXISTS hq_address_line1;
ALTER TABLE suppliers DROP COLUMN IF EXISTS hq_address_line2;
ALTER TABLE suppliers DROP COLUMN IF EXISTS hq_county;
ALTER TABLE suppliers DROP COLUMN IF EXISTS hq_constituency;
ALTER TABLE suppliers DROP COLUMN IF EXISTS hq_ward;
ALTER TABLE suppliers DROP COLUMN IF EXISTS hq_postal_code;

-- ============================================================================
-- PART 6: Normalize Logistics Providers
-- ============================================================================

ALTER TABLE logistics_providers ADD COLUMN IF NOT EXISTS hq_location_id INTEGER REFERENCES locations(id);

-- Migrate LSP addresses
INSERT INTO locations (sgln, label, location_type, country)
SELECT 
  COALESCE(lp.gln, lp.lsp_id || '000') AS sgln,
  lp.name || ' HQ' AS label,
  'logistics_hq' AS location_type,
  lp.hq_country
FROM logistics_providers lp
WHERE lp.hq_location_id IS NULL
ON CONFLICT (sgln) DO UPDATE SET label = EXCLUDED.label;

-- Link LSPs
UPDATE logistics_providers lp
SET hq_location_id = l.id
FROM locations l
WHERE l.sgln = COALESCE(lp.gln, lp.lsp_id || '000');

-- Drop address columns
ALTER TABLE logistics_providers DROP COLUMN IF EXISTS hq_address_line;
ALTER TABLE logistics_providers DROP COLUMN IF EXISTS hq_city;
ALTER TABLE logistics_providers DROP COLUMN IF EXISTS hq_county;
ALTER TABLE logistics_providers DROP COLUMN IF EXISTS hq_postal_code;

-- ============================================================================
-- PART 7: Normalize Supplier Roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_roles (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  UNIQUE(supplier_id, role)
);

-- Migrate from text[] array
INSERT INTO supplier_roles (supplier_id, role)
SELECT s.id, unnest(s.roles)
FROM suppliers s
WHERE s.roles IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE suppliers DROP COLUMN IF EXISTS roles;

-- ============================================================================
-- PART 8: Final ppb_batches Cleanup
-- ============================================================================

ALTER TABLE ppb_batches DROP COLUMN IF EXISTS manufacturer_name;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS approval_status;
ALTER TABLE ppb_batches DROP COLUMN IF EXISTS approval_date_stamp;

-- ppb_batches NOW: 10 fields (audit log only)

GRANT ALL ON product_manufacturers TO tnt_user;
GRANT ALL ON contacts TO tnt_user;
GRANT ALL ON supplier_roles TO tnt_user;
GRANT USAGE ON SEQUENCE product_manufacturers_id_seq TO tnt_user;
GRANT USAGE ON SEQUENCE contacts_id_seq TO tnt_user;
GRANT USAGE ON SEQUENCE supplier_roles_id_seq TO tnt_user;

COMMIT;
