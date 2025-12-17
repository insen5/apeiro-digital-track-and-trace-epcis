-- PPB Products Table
-- Stores product catalog data from PPB Terminology API
CREATE TABLE IF NOT EXISTS ppb_products (
  id SERIAL PRIMARY KEY,
  
  -- Basic Identifiers
  etcd_product_id VARCHAR(100) UNIQUE NOT NULL,
  generic_concept_id INTEGER,
  generic_concept_code VARCHAR(50),
  ppb_registration_code VARCHAR(100),
  
  -- Display Names
  brand_display_name VARCHAR(500),
  generic_display_name VARCHAR(500),
  brand_name VARCHAR(255),
  generic_name VARCHAR(255),
  
  -- GTIN
  gtin VARCHAR(50),
  
  -- Strength and Form
  strength_amount VARCHAR(50),
  strength_unit VARCHAR(50),
  route_description VARCHAR(100),
  route_id INTEGER,
  route_code VARCHAR(50),
  form_description VARCHAR(100),
  form_id INTEGER,
  form_code VARCHAR(50),
  
  -- Active Component
  active_component_id INTEGER,
  active_component_code VARCHAR(50),
  
  -- Status and Metadata
  level_of_use VARCHAR(10),
  keml_status VARCHAR(10),
  updation_date TIMESTAMP,
  
  -- KEML Info (stored as JSONB for flexibility)
  keml_is_on_keml BOOLEAN DEFAULT FALSE,
  keml_category VARCHAR(100),
  keml_drug_class VARCHAR(100),
  
  -- Formulary
  formulary_included BOOLEAN DEFAULT FALSE,
  
  -- Programs (stored as JSONB array)
  programs_mapping JSONB DEFAULT '[]'::jsonb,
  
  -- Manufacturers (stored as JSONB array)
  manufacturers JSONB DEFAULT '[]'::jsonb,
  
  -- Sync Metadata
  last_synced_at TIMESTAMP DEFAULT NOW(),
  ppb_last_modified TIMESTAMP, -- From PPB Terminology API updation_date
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ppb_products_etcd_id ON ppb_products(etcd_product_id);
CREATE INDEX IF NOT EXISTS idx_ppb_products_gtin ON ppb_products(gtin);
CREATE INDEX IF NOT EXISTS idx_ppb_products_ppb_registration ON ppb_products(ppb_registration_code);
CREATE INDEX IF NOT EXISTS idx_ppb_products_brand_name ON ppb_products(brand_name);
CREATE INDEX IF NOT EXISTS idx_ppb_products_generic_name ON ppb_products(generic_name);
CREATE INDEX IF NOT EXISTS idx_ppb_products_keml_status ON ppb_products(keml_status);
CREATE INDEX IF NOT EXISTS idx_ppb_products_last_synced ON ppb_products(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_ppb_products_ppb_last_modified ON ppb_products(ppb_last_modified);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_ppb_products_search ON ppb_products 
  USING gin(to_tsvector('english', 
    COALESCE(brand_display_name, '') || ' ' || 
    COALESCE(generic_display_name, '') || ' ' || 
    COALESCE(brand_name, '') || ' ' || 
    COALESCE(generic_name, '')
  ));

COMMENT ON TABLE ppb_products IS 'Product catalog from PPB Terminology API, synced daily';
COMMENT ON COLUMN ppb_products.etcd_product_id IS 'Unique identifier from PPB Terminology API (ETCD Product ID)';
COMMENT ON COLUMN ppb_products.ppb_last_modified IS 'Last modification date from PPB Terminology API (updation_date)';
COMMENT ON COLUMN ppb_products.last_synced_at IS 'When this record was last synced from PPB Terminology API';

