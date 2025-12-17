-- Enhanced Products Table Migration
-- Adds all fields from PPB Terminology API response
-- Run this migration to enhance the products table with full PPB catalog data

-- ============================================
-- 1. Add new columns to products table
-- ============================================

-- Basic Identifiers
ALTER TABLE products ADD COLUMN IF NOT EXISTS etcd_product_id VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS generic_concept_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS generic_concept_code VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ppb_registration_code VARCHAR(100);

-- Display Names (enhance existing)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_display_name VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS generic_display_name VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS generic_name VARCHAR(255);

-- Strength and Form
ALTER TABLE products ADD COLUMN IF NOT EXISTS strength_amount VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS strength_unit VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS route_description VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS route_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS route_code VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS form_description VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS form_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS form_code VARCHAR(50);

-- Active Component
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_component_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_component_code VARCHAR(50);

-- Status and Metadata
ALTER TABLE products ADD COLUMN IF NOT EXISTS level_of_use VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS keml_status VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS updation_date TIMESTAMP;

-- KEML Info
ALTER TABLE products ADD COLUMN IF NOT EXISTS keml_is_on_keml BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS keml_category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS keml_drug_class VARCHAR(100);

-- Formulary
ALTER TABLE products ADD COLUMN IF NOT EXISTS formulary_included BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. Create Programs Mapping Table (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS product_programs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  program_code VARCHAR(50) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, program_code)
);

CREATE INDEX IF NOT EXISTS idx_product_programs_product_id ON product_programs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_programs_code ON product_programs(program_code);

-- ============================================
-- 3. Create Product Manufacturers Table (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS product_manufacturers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  manufacturer_entity_id VARCHAR(100) NOT NULL,
  manufacturer_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, manufacturer_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_product_manufacturers_product_id ON product_manufacturers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_manufacturers_entity_id ON product_manufacturers(manufacturer_entity_id);

-- ============================================
-- 4. Add Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_etcd_product_id ON products(etcd_product_id);
CREATE INDEX IF NOT EXISTS idx_products_ppb_registration_code ON products(ppb_registration_code);
CREATE INDEX IF NOT EXISTS idx_products_generic_concept_id ON products(generic_concept_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_display_name ON products(brand_display_name);
CREATE INDEX IF NOT EXISTS idx_products_generic_display_name ON products(generic_display_name);
CREATE INDEX IF NOT EXISTS idx_products_keml_status ON products(keml_status);
CREATE INDEX IF NOT EXISTS idx_products_formulary_included ON products(formulary_included);

-- ============================================
-- 5. Add Comments for Documentation
-- ============================================
COMMENT ON COLUMN products.etcd_product_id IS 'ETCD Product ID from PPB Terminology API - unique identifier';
COMMENT ON COLUMN products.generic_concept_id IS 'Generic concept identifier for grouping similar products';
COMMENT ON COLUMN products.generic_concept_code IS 'Generic concept code (e.g., GE10547)';
COMMENT ON COLUMN products.ppb_registration_code IS 'PPB registration code (e.g., PPB/CTD1811/027)';
COMMENT ON COLUMN products.brand_display_name IS 'Brand display name with strength and form (e.g., "Abacavir And Lamivudine 600 mg/300 mg Oral Tablet")';
COMMENT ON COLUMN products.generic_display_name IS 'Generic display name with strength and form';
COMMENT ON COLUMN products.generic_name IS 'Generic name without strength/form';
COMMENT ON COLUMN products.strength_amount IS 'Product strength amount (e.g., "600/300")';
COMMENT ON COLUMN products.strength_unit IS 'Strength unit (e.g., "mg/mg", "mg")';
COMMENT ON COLUMN products.route_description IS 'Administration route (e.g., "Oral", "IV", "IM")';
COMMENT ON COLUMN products.form_description IS 'Dosage form (e.g., "Tablet", "Capsule", "Injection")';
COMMENT ON COLUMN products.active_component_id IS 'Active component identifier';
COMMENT ON COLUMN products.level_of_use IS 'Level of use classification (1-3)';
COMMENT ON COLUMN products.keml_status IS 'KEML status (Yes/No)';
COMMENT ON COLUMN products.keml_is_on_keml IS 'Whether product is on Kenya Essential Medicines List';
COMMENT ON COLUMN products.keml_category IS 'KEML category (e.g., "Essential Medicine")';
COMMENT ON COLUMN products.keml_drug_class IS 'Drug class (e.g., "Antiretroviral Combination")';
COMMENT ON COLUMN products.formulary_included IS 'Whether product is included in formulary';
COMMENT ON COLUMN products.updation_date IS 'Last update date from PPB Terminology API';

COMMENT ON TABLE product_programs IS 'Many-to-many relationship: Products to Programs (e.g., Essential Commodities, ARV)';
COMMENT ON TABLE product_manufacturers IS 'Many-to-many relationship: Products to Manufacturers';

