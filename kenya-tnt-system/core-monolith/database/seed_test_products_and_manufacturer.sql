-- Seed Test Products and Manufacturer for Consignment Testing
-- This script creates test products with GTINs and a test manufacturer
-- Run this before importing test consignment JSONs

-- ============================================
-- 1. CREATE TEST MANUFACTURER
-- ============================================
-- This manufacturer will match GLN 6164003000000 (used in test JSONs)
INSERT INTO suppliers (
  entity_id, 
  legal_entity_name, 
  actor_type, 
  roles, 
  ownership_type,
  ppb_license_number, 
  ppb_code, 
  gs1_prefix, 
  legal_entity_gln,
  hq_name, 
  hq_gln, 
  hq_address_line1, 
  hq_address_line2, 
  hq_county, 
  hq_constituency, 
  hq_ward, 
  hq_postal_code, 
  hq_country,
  contact_person_name, 
  contact_person_title, 
  contact_email, 
  contact_phone, 
  contact_website,
  status, 
  last_updated,
  "createdAt",
  "updatedAt"
) VALUES
(
  'MAN-001',
  'Test Pharma Manufacturing Ltd',
  'manufacturer',
  ARRAY['Pharmaceutical Manufacturer', 'MAH'],
  'PRIVATE COMPANY (LIMITED)',
  'PPB/MFG/TEST/001',
  'MAN-001',  -- This will be used as manufacturerPPBID
  '61640030',
  '6164003000000',  -- This GLN matches test JSONs
  'Test Pharma HQ',
  '6164003000000',
  '123 Test Street',
  'Industrial Area',
  'Nairobi',
  'Starehe',
  'Industrial Area',
  '00500',
  'KE',
  'Test Manager',
  'Operations Manager',
  'test@pharma.ke',
  '+254700000000',
  'https://test-pharma.ke',
  'Active',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (entity_id) DO UPDATE SET
  legal_entity_gln = EXCLUDED.legal_entity_gln,
  hq_gln = EXCLUDED.hq_gln,
  ppb_code = EXCLUDED.ppb_code,
  status = 'Active',
  "updatedAt" = NOW();

-- ============================================
-- 2. CREATE TEST PRODUCTS WITH GTINs
-- ============================================
-- These GTINs match the test consignment JSONs

INSERT INTO ppb_products (
  etcd_product_id,
  generic_concept_id,
  generic_concept_code,
  ppb_registration_code,
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
  "createdAt",
  "updatedAt"
) VALUES
-- Product 1: Metformin 500mg Tablets (GTIN: 61640056789012)
(
  'PH-TEST-001',
  2,
  'GE10002',
  'PPB/REG/TEST/001',
  'Metformin 500mg Tablets',
  'Metformin 500 mg Oral Tablet',
  'Metformin',
  'Metformin',
  '61640056789012',  -- GTIN for test JSON 1
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
  NOW(),
  true,
  'Essential Medicine',
  'Antidiabetic',
  true,
  NOW(),
  NOW()
),
-- Product 2: Amoxicillin 250mg Capsules (GTIN: 61640056789013)
(
  'PH-TEST-002',
  3,
  'GE10003',
  'PPB/REG/TEST/002',
  'Amoxicillin 250mg Capsules',
  'Amoxicillin 250 mg Oral Capsule',
  'Amoxicillin',
  'Amoxicillin',
  '61640056789013',  -- GTIN for test JSON 1
  '250',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Capsule',
  502,
  'DF10502',
  2,
  'AC10002',
  '2',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Antibiotic',
  true,
  NOW(),
  NOW()
),
-- Product 3: Paracetamol 500mg Tablets (GTIN: 61640056789014)
(
  'PH-TEST-003',
  4,
  'GE10004',
  'PPB/REG/TEST/003',
  'Paracetamol 500mg Tablets',
  'Paracetamol 500 mg Oral Tablet',
  'Paracetamol',
  'Paracetamol',
  '61640056789014',  -- GTIN for test JSON 1
  '500',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  3,
  'AC10003',
  '1',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Analgesic',
  true,
  NOW(),
  NOW()
),
-- Product 4: Ibuprofen 400mg Tablets (GTIN: 61640056789015)
(
  'PH-TEST-004',
  5,
  'GE10005',
  'PPB/REG/TEST/004',
  'Ibuprofen 400mg Tablets',
  'Ibuprofen 400 mg Oral Tablet',
  'Ibuprofen',
  'Ibuprofen',
  '61640056789015',  -- GTIN for test JSON 1
  '400',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  4,
  'AC10004',
  '1',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'NSAID',
  true,
  NOW(),
  NOW()
),
-- Product 5: Aspirin 100mg Tablets (GTIN: 61640056789016)
(
  'PH-TEST-005',
  6,
  'GE10006',
  'PPB/REG/TEST/005',
  'Aspirin 100mg Tablets',
  'Aspirin 100 mg Oral Tablet',
  'Aspirin',
  'Aspirin',
  '61640056789016',  -- GTIN for test JSON 2
  '100',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  5,
  'AC10005',
  '1',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Antiplatelet',
  true,
  NOW(),
  NOW()
),
-- Product 6: Ciprofloxacin 500mg Tablets (GTIN: 61640056789017)
(
  'PH-TEST-006',
  7,
  'GE10007',
  'PPB/REG/TEST/006',
  'Ciprofloxacin 500mg Tablets',
  'Ciprofloxacin 500 mg Oral Tablet',
  'Ciprofloxacin',
  'Ciprofloxacin',
  '61640056789017',  -- GTIN for test JSON 2
  '500',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Tablet',
  501,
  'DF10501',
  6,
  'AC10006',
  '2',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Antibiotic',
  true,
  NOW(),
  NOW()
),
-- Product 7: Azithromycin 250mg Capsules (GTIN: 61640056789018)
(
  'PH-TEST-007',
  8,
  'GE10008',
  'PPB/REG/TEST/007',
  'Azithromycin 250mg Capsules',
  'Azithromycin 250 mg Oral Capsule',
  'Azithromycin',
  'Azithromycin',
  '61640056789018',  -- GTIN for test JSON 2
  '250',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Capsule',
  502,
  'DF10502',
  7,
  'AC10007',
  '2',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Antibiotic',
  true,
  NOW(),
  NOW()
),
-- Product 8: Doxycycline 100mg Capsules (GTIN: 61640056789019)
(
  'PH-TEST-008',
  9,
  'GE10009',
  'PPB/REG/TEST/008',
  'Doxycycline 100mg Capsules',
  'Doxycycline 100 mg Oral Capsule',
  'Doxycycline',
  'Doxycycline',
  '61640056789019',  -- GTIN for test JSON 2
  '100',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Capsule',
  502,
  'DF10502',
  8,
  'AC10008',
  '2',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Antibiotic',
  true,
  NOW(),
  NOW()
),
-- Product 9: Omeprazole 20mg Capsules (GTIN: 61640056789020)
(
  'PH-TEST-009',
  10,
  'GE10010',
  'PPB/REG/TEST/009',
  'Omeprazole 20mg Capsules',
  'Omeprazole 20 mg Oral Capsule',
  'Omeprazole',
  'Omeprazole',
  '61640056789020',  -- GTIN for test JSON 2
  '20',
  'mg',
  'Oral',
  25,
  'RT10025',
  'Capsule',
  502,
  'DF10502',
  9,
  'AC10009',
  '2',
  'Yes',
  NOW(),
  true,
  'Essential Medicine',
  'Proton Pump Inhibitor',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (etcd_product_id) DO UPDATE SET
  gtin = EXCLUDED.gtin,
  brand_display_name = EXCLUDED.brand_display_name,
  generic_display_name = EXCLUDED.generic_display_name,
  brand_name = EXCLUDED.brand_name,
  "updatedAt" = NOW();

-- ============================================
-- 3. UPDATE USER ORGANIZATION TO MATCH MANUFACTURER
-- ============================================
-- Update your user's organization to match the manufacturer entity_id
-- Replace 'YOUR_USER_EMAIL' with your actual user email
-- Or update by user ID if you know it

-- Example: Update user organization to 'MAN-001' to match the manufacturer
-- UPDATE users 
-- SET organization = 'MAN-001', gln_number = '6164003000000'
-- WHERE email = 'your-email@example.com';

-- Or if you want to create/update a test user:
INSERT INTO users (
  email,
  role,
  "roleId",
  "glnNumber",
  organization,
  "isDeleted",
  "createdAt",
  "updatedAt"
) VALUES
(
  'test-manufacturer@pharma.ke',
  'manufacturer',
  3,
  '6164003000000',
  'MAN-001',  -- Matches supplier entity_id
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  organization = 'MAN-001',
  "glnNumber" = '6164003000000',
  "updatedAt" = NOW();

-- ============================================
-- SUMMARY
-- ============================================
-- Created:
-- 1. Manufacturer: MAN-001 (GLN: 6164003000000, PPB Code: MAN-001)
-- 2. 9 Test Products with GTINs:
--    - 61640056789012 (Metformin 500mg)
--    - 61640056789013 (Amoxicillin 250mg)
--    - 61640056789014 (Paracetamol 500mg)
--    - 61640056789015 (Ibuprofen 400mg)
--    - 61640056789016 (Aspirin 100mg)
--    - 61640056789017 (Ciprofloxacin 500mg)
--    - 61640056789018 (Azithromycin 250mg)
--    - 61640056789019 (Doxycycline 100mg)
--    - 61640056789020 (Omeprazole 20mg)
-- 3. Test User: test-manufacturer@pharma.ke (organization: MAN-001, GLN: 6164003000000)
--
-- These match the test consignment JSONs provided earlier.

