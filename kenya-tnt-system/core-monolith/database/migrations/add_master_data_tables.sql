-- Master Data Tables for Suppliers, Premises, and Logistics Service Providers
-- This provides a centralized master data layer accessible to all users

-- ============================================
-- SUPPLIERS TABLE
-- ============================================
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  entity_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., "SUP-001"
  legal_entity_name VARCHAR(255) NOT NULL,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'supplier', -- supplier, manufacturer, etc.
  roles TEXT[], -- Array of roles: ["National Distributor", "Wholesaler"]
  ownership_type VARCHAR(100), -- e.g., "PRIVATE COMPANY (LIMITED)"
  
  -- Identifiers
  ppb_license_number VARCHAR(100),
  ppb_code VARCHAR(50),
  gs1_prefix VARCHAR(20),
  legal_entity_gln VARCHAR(20),
  
  -- HQ Location
  hq_name VARCHAR(255),
  hq_gln VARCHAR(20),
  hq_address_line1 VARCHAR(255),
  hq_address_line2 VARCHAR(255),
  hq_county VARCHAR(100),
  hq_constituency VARCHAR(100),
  hq_ward VARCHAR(100),
  hq_postal_code VARCHAR(20),
  hq_country VARCHAR(10) DEFAULT 'KE',
  
  -- Contact Information
  contact_person_name VARCHAR(255),
  contact_person_title VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_website VARCHAR(255),
  
  status VARCHAR(50) DEFAULT 'Active',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suppliers_entity_id ON suppliers(entity_id);
CREATE INDEX idx_suppliers_ppb_code ON suppliers(ppb_code);
CREATE INDEX idx_suppliers_legal_entity_gln ON suppliers(legal_entity_gln);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- ============================================
-- PREMISES TABLE (Warehouses/Distribution Centers)
-- ============================================
CREATE TABLE premises (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  premise_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., "SUP-001-WH1"
  legacy_premise_id INTEGER, -- Legacy PPB premise ID
  premise_name VARCHAR(255) NOT NULL,
  gln VARCHAR(20) NOT NULL,
  business_type VARCHAR(50), -- e.g., "WHOLESALE"
  premise_classification VARCHAR(100), -- e.g., "WAREHOUSE/DISTRIBUTION"
  ownership VARCHAR(100),
  
  -- Superintendent Information
  superintendent_name VARCHAR(255),
  superintendent_cadre VARCHAR(100), -- e.g., "PHARMACIST"
  superintendent_registration_number INTEGER,
  
  -- License Information
  ppb_license_number VARCHAR(100),
  license_valid_until DATE,
  license_validity_year INTEGER,
  license_status VARCHAR(50),
  
  -- Location
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  county VARCHAR(100),
  constituency VARCHAR(100),
  ward VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(10) DEFAULT 'KE',
  
  status VARCHAR(50) DEFAULT 'Active',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_premises_supplier_id ON premises(supplier_id);
CREATE INDEX idx_premises_premise_id ON premises(premise_id);
CREATE INDEX idx_premises_gln ON premises(gln);
CREATE INDEX idx_premises_status ON premises(status);

-- ============================================
-- LOGISTICS SERVICE PROVIDERS (LSPs) TABLE
-- ============================================
CREATE TABLE logistics_providers (
  id SERIAL PRIMARY KEY,
  lsp_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., "LSP-001"
  name VARCHAR(255) NOT NULL,
  
  -- Legal Entity Information
  registration_number VARCHAR(100),
  permit_id VARCHAR(100),
  license_expiry_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  
  -- Contact Information
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_website VARCHAR(255),
  
  -- HQ Location
  hq_address_line VARCHAR(255),
  hq_city VARCHAR(100),
  hq_county VARCHAR(100),
  hq_country VARCHAR(10) DEFAULT 'KE',
  hq_postal_code VARCHAR(20),
  
  -- Identifiers
  gln VARCHAR(20),
  gs1_prefix VARCHAR(20),
  ppb_code VARCHAR(50),
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logistics_providers_lsp_id ON logistics_providers(lsp_id);
CREATE INDEX idx_logistics_providers_gln ON logistics_providers(gln);
CREATE INDEX idx_logistics_providers_ppb_code ON logistics_providers(ppb_code);
CREATE INDEX idx_logistics_providers_status ON logistics_providers(status);

-- ============================================
-- UPDATE SHIPMENT TABLE TO REFERENCE MASTER DATA
-- ============================================
-- Add foreign key references (keeping existing fields for backward compatibility)
ALTER TABLE shipment 
  ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id),
  ADD COLUMN premise_id INTEGER REFERENCES premises(id),
  ADD COLUMN logistics_provider_id INTEGER REFERENCES logistics_providers(id);

CREATE INDEX idx_shipment_supplier_id ON shipment(supplier_id);
CREATE INDEX idx_shipment_premise_id ON shipment(premise_id);
CREATE INDEX idx_shipment_logistics_provider_id ON shipment(logistics_provider_id);

-- Add comments for documentation
COMMENT ON TABLE suppliers IS 'Master data for suppliers/manufacturers with HQ locations and contact info';
COMMENT ON TABLE premises IS 'Master data for supplier premises (warehouses, distribution centers) with GLNs and locations';
COMMENT ON TABLE logistics_providers IS 'Master data for logistics service providers (carriers)';
COMMENT ON COLUMN shipment.supplier_id IS 'Reference to supplier (customer) from master data';
COMMENT ON COLUMN shipment.premise_id IS 'Reference to premise (pickup/destination location) from master data';
COMMENT ON COLUMN shipment.logistics_provider_id IS 'Reference to logistics provider (carrier) from master data';

