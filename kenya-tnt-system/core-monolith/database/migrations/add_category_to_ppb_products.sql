-- Migration: Add category column to ppb_products table
-- Extracts product category from etcd_product_id prefix:
-- PH = medicine, FS = supplement, MD = medical_device, CO = cosmetic (if applicable)

-- Create enum type for product category
DO $$ BEGIN
  CREATE TYPE product_category AS ENUM ('medicine', 'supplement', 'medical_device', 'cosmetic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add category column to ppb_products table
ALTER TABLE ppb_products 
ADD COLUMN IF NOT EXISTS category product_category;

-- Create index for category column
CREATE INDEX IF NOT EXISTS idx_ppb_products_category ON ppb_products(category);

-- Add comment
COMMENT ON COLUMN ppb_products.category IS 'Product category extracted from etcd_product_id prefix: PH=medicine, FS=supplement, MD=medical_device';

-- Function to extract category from etcd_product_id
CREATE OR REPLACE FUNCTION extract_product_category(etcd_id VARCHAR) 
RETURNS product_category AS $$
BEGIN
  IF etcd_id IS NULL OR LENGTH(etcd_id) < 2 THEN
    RETURN NULL;
  END IF;
  
  CASE UPPER(LEFT(etcd_id, 2))
    WHEN 'PH' THEN RETURN 'medicine';
    WHEN 'FS' THEN RETURN 'supplement';
    WHEN 'MD' THEN RETURN 'medical_device';
    WHEN 'CO' THEN RETURN 'cosmetic';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill existing records with category based on etcd_product_id
UPDATE ppb_products 
SET category = extract_product_category(etcd_product_id)
WHERE category IS NULL;

