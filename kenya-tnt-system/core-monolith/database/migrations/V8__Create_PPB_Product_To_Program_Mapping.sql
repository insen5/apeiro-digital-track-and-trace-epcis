-- V8__Create_PPB_Product_To_Program_Mapping.sql
-- Recreate product programs mapping table with new name and reference to ppb_products

-- ============================================
-- Create ppb_product_to_program_mapping Table
-- ============================================
CREATE TABLE IF NOT EXISTS ppb_product_to_program_mapping (
  id SERIAL PRIMARY KEY,
  ppb_product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE CASCADE,
  program_code VARCHAR(50) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ppb_product_id, program_code)
);

CREATE INDEX idx_ppb_product_to_program_mapping_product_id ON ppb_product_to_program_mapping(ppb_product_id);
CREATE INDEX idx_ppb_product_to_program_mapping_code ON ppb_product_to_program_mapping(program_code);

COMMENT ON TABLE ppb_product_to_program_mapping IS 'Many-to-many relationship: PPB Products to Programs (e.g., Essential Commodities, ARV). Maps products to various healthcare programs.';
COMMENT ON COLUMN ppb_product_to_program_mapping.ppb_product_id IS 'Foreign key to ppb_products table';
COMMENT ON COLUMN ppb_product_to_program_mapping.program_code IS 'Program code (e.g., "ESSENTIAL", "ARV", "MALARIA")';
COMMENT ON COLUMN ppb_product_to_program_mapping.program_name IS 'Program name (e.g., "Essential Commodities", "Antiretroviral Therapy")';


