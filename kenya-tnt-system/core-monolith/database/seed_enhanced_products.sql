-- Enhanced Products Seed Data
-- This script seeds the products table with sample data that includes all PPB Terminology API fields
-- Run this after the migration: enhance_products_table.sql

-- Note: This is sample data. In production, products are synced from PPB Terminology API.

-- Insert sample products with full PPB catalog fields
INSERT INTO products (
  etcd_product_id,
  generic_concept_id,
  generic_concept_code,
  ppb_registration_code,
  product_name,
  brand_display_name,
  generic_display_name,
  brand_name,
  generic_name,
  gtin,
  strength_amount,
  strength_unit,
  route_description,
  route_id,
  route_code,
  form_description,
  form_id,
  form_code,
  active_component_id,
  active_component_code,
  level_of_use,
  keml_status,
  updation_date,
  keml_is_on_keml,
  keml_category,
  keml_drug_class,
  formulary_included,
  user_id,
  is_enabled,
  created_at,
  updated_at
) VALUES
(
  'PH11231',
  547,
  'GE10547',
  'PPB/CTD1811/027',
  'Abacavir And Lamivudine 600 mg/300 mg Oral Tablet',
  'Abacavir And Lamivudine 600 mg/300 mg Oral Tablet',
  'Abacavir 600 mg/Lamivudine 300 mg Oral Tablet',
  'Abacavir And Lamivudine',
  'Abacavir/Lamivudine',
  '213123',
  '600/300',
  'mg/mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  1652,
  'AC11652',
  '2',
  'Yes',
  '2025-06-29T15:35:57.573Z'::timestamp,
  true,
  'Essential Medicine',
  'Antiretroviral Combination',
  true,
  (SELECT id FROM users WHERE email = 'ppb-system@kenya-tnt.gov' LIMIT 1),
  true,
  NOW(),
  NOW()
),
(
  'PH13828',
  2,
  'GE10002',
  'PPB/CTD3898',
  'Atformin 500 mg Oral Tablet',
  'Atformin 500 mg Oral Tablet',
  'Metformin 500 mg Oral Tablet',
  'Atformin',
  'Metformin',
  '61640056789016',
  '500',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  1,
  'AC10001',
  '3',
  'Yes',
  '2025-04-21T02:22:31.376Z'::timestamp,
  true,
  'Essential Medicine',
  'Antidiabetic',
  true,
  (SELECT id FROM users WHERE email = 'ppb-system@kenya-tnt.gov' LIMIT 1),
  true,
  NOW(),
  NOW()
),
(
  'PH22731',
  2,
  'GE10002',
  'PPB/CTD10150',
  'Xelmet 500 mg Oral Tablet',
  'Xelmet 500 mg Oral Tablet',
  'Metformin 500 mg Oral Tablet',
  'Xelmet',
  'Metformin',
  '61640056789017',
  '500',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  1,
  'AC10001',
  '3',
  'Yes',
  '2025-04-21T02:26:07.669Z'::timestamp,
  true,
  'Essential Medicine',
  'Antidiabetic',
  true,
  (SELECT id FROM users WHERE email = 'ppb-system@kenya-tnt.gov' LIMIT 1),
  true,
  NOW(),
  NOW()
)
ON CONFLICT (gtin) DO UPDATE SET
  etcd_product_id = EXCLUDED.etcd_product_id,
  ppb_registration_code = EXCLUDED.ppb_registration_code,
  brand_display_name = EXCLUDED.brand_display_name,
  generic_display_name = EXCLUDED.generic_display_name,
  updated_at = NOW();

-- Insert product programs
INSERT INTO product_programs (product_id, program_code, program_name, created_at)
SELECT 
  p.id,
  'ESSENTIAL',
  'Essential Commodities',
  NOW()
FROM products p
WHERE p.etcd_product_id IN ('PH11231', 'PH13828', 'PH22731')
ON CONFLICT (product_id, program_code) DO NOTHING;

INSERT INTO product_programs (product_id, program_code, program_name, created_at)
SELECT 
  p.id,
  'ARV',
  'ARV',
  NOW()
FROM products p
WHERE p.etcd_product_id = 'PH11231'
ON CONFLICT (product_id, program_code) DO NOTHING;

-- Insert product manufacturers
INSERT INTO product_manufacturers (product_id, manufacturer_entity_id, manufacturer_name, created_at)
SELECT 
  p.id,
  'MFG-001',
  'KEM Pharma Ltd',
  NOW()
FROM products p
WHERE p.etcd_product_id IN ('PH11231', 'PH13828', 'PH22731')
ON CONFLICT (product_id, manufacturer_entity_id) DO NOTHING;

INSERT INTO product_manufacturers (product_id, manufacturer_entity_id, manufacturer_name, created_at)
SELECT 
  p.id,
  'MFG-002',
  'Apex Pharmaceuticals',
  NOW()
FROM products p
WHERE p.etcd_product_id = 'PH22731'
ON CONFLICT (product_id, manufacturer_entity_id) DO NOTHING;

