-- Seed Master Data for Kafka Validation Testing
-- This script seeds data that matches SOME test Kafka messages (so they pass validation)
-- and leaves others unmatched (so they fail validation)

-- ============================================
-- CLEAR EXISTING TEST DATA (Optional - comment out if you want to keep existing data)
-- ============================================
-- DELETE FROM premises;
-- DELETE FROM suppliers WHERE entity_id LIKE 'SUP-%' OR entity_id LIKE 'MFG-%';

-- ============================================
-- SUPPLIERS/IMPORTERS (for Kafka test messages)
-- ============================================
-- These match the test Kafka messages so they PASS validation

INSERT INTO suppliers (
  entity_id, legal_entity_name, actor_type, roles, ownership_type,
  ppb_license_number, ppb_code, gs1_prefix, legal_entity_gln,
  hq_name, hq_gln, hq_address_line1, hq_address_line2, hq_county, hq_constituency, hq_ward, hq_postal_code, hq_country,
  contact_person_name, contact_person_title, contact_email, contact_phone, contact_website,
  status, last_updated
) VALUES
-- HealthSup Distributors Ltd (matches Kafka message 2 importer)
(
  'SUP-001',
  'HealthSup Distributors Ltd',
  'supplier',
  ARRAY['National Distributor', 'Wholesaler'],
  'PRIVATE COMPANY (LIMITED)',
  'PPB/WHL/002/2025',
  'PPB-SUP-001',
  '73510020',
  '7351002000000',  -- Matches Kafka message GLN
  'HealthSup HQ',
  '7351002000000',
  'Plot 23, Industrial Area',
  'Off Enterprise Road',
  'Nairobi',
  'Starehe',
  'Industrial Area',
  '00500',
  'KE',
  'Jane Mwangi',
  'Supply Chain Manager',
  'operations@healthsup.co.ke',
  '+254710111222',
  'https://www.healthsup.co.ke',
  'Active',
  NOW()
)
ON CONFLICT (entity_id) DO UPDATE SET
  legal_entity_gln = EXCLUDED.legal_entity_gln,
  hq_gln = EXCLUDED.hq_gln,
  status = 'Active';

-- MediCare Pharmaceuticals Kenya (matches Kafka message 3 importer)
INSERT INTO suppliers (
  entity_id, legal_entity_name, actor_type, roles, ownership_type,
  ppb_license_number, ppb_code, gs1_prefix, legal_entity_gln,
  hq_name, hq_gln, hq_address_line1, hq_address_line2, hq_county, hq_constituency, hq_ward, hq_postal_code, hq_country,
  contact_person_name, contact_person_title, contact_email, contact_phone, contact_website,
  status, last_updated
) VALUES
(
  'SUP-002',
  'MediCare Pharmaceuticals Kenya',
  'supplier',
  ARRAY['National Distributor'],
  'PRIVATE COMPANY (LIMITED)',
  'PPB/WHL/015/2025',
  'PPB-SUP-002',
  '61640010',
  '6164001000006',  -- Matches Kafka message GLN
  'MediCare HQ',
  '6164001000006',
  'Westlands Business Park',
  'Waiyaki Way',
  'Nairobi',
  'Westlands',
  'Westlands',
  '00100',
  'KE',
  'Peter Kamau',
  'Operations Director',
  'info@medicarepharma.co.ke',
  '+254722333444',
  'https://www.medicarepharma.co.ke',
  'Active',
  NOW()
)
ON CONFLICT (entity_id) DO UPDATE SET
  legal_entity_gln = EXCLUDED.legal_entity_gln,
  hq_gln = EXCLUDED.hq_gln,
  status = 'Active';

-- ============================================
-- MANUFACTURERS (for Kafka test messages)
-- ============================================
-- Cosmos Pharmaceuticals Ltd (matches Kafka message 2 - should PASS)
INSERT INTO suppliers (
  entity_id, legal_entity_name, actor_type, roles, ownership_type,
  ppb_license_number, ppb_code, gs1_prefix, legal_entity_gln,
  hq_name, hq_gln, hq_address_line1, hq_address_line2, hq_county, hq_constituency, hq_ward, hq_postal_code, hq_country,
  contact_person_name, contact_person_title, contact_email, contact_phone, contact_website,
  status, last_updated
) VALUES
(
  'MFG-001',
  'Cosmos Pharmaceuticals Ltd',
  'manufacturer',
  ARRAY['Pharmaceutical Manufacturer', 'MAH'],
  'PRIVATE COMPANY (LIMITED)',
  'PPB/MFG/001/2025',
  'PPB-MFG-001',
  '61640040',
  '6164004000007',  -- Matches Kafka message GLN
  'Cosmos Pharmaceuticals Manufacturing Plant',
  '6164004000007',
  'Thika Road',
  'Industrial Area',
  'Kiambu',
  'Thika',
  'Thika Town',
  '01000',
  'KE',
  'Dr. James Kariuki',
  'Manufacturing Director',
  'manufacturing@cosmospharma.co.ke',
  '+254720111222',
  'https://www.cosmospharma.co.ke',
  'Active',
  NOW()
)
ON CONFLICT (entity_id) DO UPDATE SET
  legal_entity_gln = EXCLUDED.legal_entity_gln,
  hq_gln = EXCLUDED.hq_gln,
  status = 'Active';

-- Universal Pharmaceuticals Kenya Ltd (matches Kafka message 3 - should PASS)
INSERT INTO suppliers (
  entity_id, legal_entity_name, actor_type, roles, ownership_type,
  ppb_license_number, ppb_code, gs1_prefix, legal_entity_gln,
  hq_name, hq_gln, hq_address_line1, hq_address_line2, hq_county, hq_constituency, hq_ward, hq_postal_code, hq_country,
  contact_person_name, contact_person_title, contact_email, contact_phone, contact_website,
  status, last_updated
) VALUES
(
  'MFG-002',
  'Universal Pharmaceuticals Kenya Ltd',
  'manufacturer',
  ARRAY['Pharmaceutical Manufacturer', 'MAH'],
  'PRIVATE COMPANY (LIMITED)',
  'PPB/MFG/002/2025',
  'PPB-MFG-002',
  '61640050',
  '6164005000004',  -- Matches Kafka message GLN
  'Universal Pharmaceuticals HQ',
  '6164005000004',
  'Mombasa Road',
  'Athi River Industrial Park',
  'Machakos',
  'Athi River',
  'Athi River',
  '00204',
  'KE',
  'Dr. Mary Wanjala',
  'Quality Assurance Manager',
  'qa@universalpharma.co.ke',
  '+254721222333',
  'https://www.universalpharma.co.ke',
  'Active',
  NOW()
)
ON CONFLICT (entity_id) DO UPDATE SET
  legal_entity_gln = EXCLUDED.legal_entity_gln,
  hq_gln = EXCLUDED.hq_gln,
  status = 'Active';

-- Note: KEM Pharma Ltd (from Kafka message 1) is NOT seeded - this will FAIL validation
-- Note: Pharma Imports Ltd (from Kafka message 1) is NOT seeded - this will FAIL validation

-- ============================================
-- PREMISES (for Kafka test messages)
-- ============================================

-- HealthSup Premise (matches Kafka message 2 final destination)
-- SGLN: urn:epc:id:sgln:7351002.00001.0 -> GLN: 7351002000010
INSERT INTO premises (
  "supplierId", premise_id, legacy_premise_id, premise_name, gln,
  business_type, premise_classification, ownership,
  superintendent_name, superintendent_cadre, superintendent_registration_number,
  ppb_license_number, license_valid_until, license_validity_year, license_status,
  address_line1, address_line2, county, constituency, ward, postal_code, country,
  status, last_updated
) VALUES
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-001'),
  'SUP-001-WH1',
  33078,
  'Central Distribution Warehouse',
  '7351002000010',  -- Matches Kafka message final_destination_sgln (extracted GLN from urn:epc:id:sgln:7351002.00001.0)
  'WHOLESALE',
  'WAREHOUSE/DISTRIBUTION',
  'PRIVATE COMPANY (LIMITED)',
  'DANIEL BARASA WAFULA',
  'PHARMACIST',
  3237,
  'PPB/WHL/002/2025-WH1',
  '2025-12-31',
  2025,
  'Active',
  'North Airport Road',
  NULL,
  'Nairobi',
  'Embakasi North',
  'Embakasi',
  '00501',
  'KE',
  'Active',
  NOW()
)
ON CONFLICT (premise_id) DO UPDATE SET
  gln = EXCLUDED.gln,
  status = 'Active';

-- HealthSup Retail Premise (matches Kafka message premise data)
INSERT INTO premises (
  "supplierId", premise_id, legacy_premise_id, premise_name, gln,
  business_type, premise_classification, ownership,
  superintendent_name, superintendent_cadre, superintendent_registration_number,
  ppb_license_number, license_valid_until, license_validity_year, license_status,
  address_line1, address_line2, county, constituency, ward, postal_code, country,
  status, last_updated
) VALUES
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-001'),
  'SUP-001-WH2',
  34014,
  'LIBWOB CHEMIST',
  '7351002000200',  -- Matches Kafka premise message GLN
  'RETAIL',
  'RETAIL PHARMACY',
  'SOLE PROPRIETOR',
  'KIPLAGAT K AMON',
  'PHARMTECH',
  11363,
  'PPB/RET/001/2025',
  '2025-12-31',
  2025,
  'Active',
  'Main Street',
  NULL,
  'Uasin Gishu',
  'TURBO',
  'KAMAGUT',
  '30100',
  'KE',
  'Active',
  NOW()
)
ON CONFLICT (premise_id) DO UPDATE SET
  gln = EXCLUDED.gln,
  status = 'Active';

-- Cosmos Manufacturing Plant Premise (matches Kafka message 2 manufacturing site)
INSERT INTO premises (
  "supplierId", premise_id, legacy_premise_id, premise_name, gln,
  business_type, premise_classification, ownership,
  superintendent_name, superintendent_cadre, superintendent_registration_number,
  ppb_license_number, license_valid_until, license_validity_year, license_status,
  address_line1, address_line2, county, constituency, ward, postal_code, country,
  status, last_updated
) VALUES
(
  (SELECT id FROM suppliers WHERE entity_id = 'MFG-001'),
  'MFG-001-MFG',
  33079,
  'Cosmos Manufacturing Plant - Thika',
  '6164004000008',  -- Matches Kafka manufacturing site SGLN (extracted GLN)
  'MANUFACTURING',
  'MANUFACTURING FACILITY',
  'PRIVATE COMPANY (LIMITED)',
  'Dr. James Kariuki',
  'PHARMACIST',
  5001,
  'PPB/MFG/001/2025-MFG',
  '2026-12-31',
  2026,
  'Active',
  'Thika Road',
  'Industrial Area',
  'Kiambu',
  'Thika',
  'Thika Town',
  '01000',
  'KE',
  'Active',
  NOW()
)
ON CONFLICT (premise_id) DO UPDATE SET
  gln = EXCLUDED.gln,
  status = 'Active';

-- MediCare Warehouse (matches Kafka message 3 final destination)
-- SGLN: urn:epc:id:sgln:6164001.00001.0 -> GLN: 6164001000010
INSERT INTO premises (
  "supplierId", premise_id, legacy_premise_id, premise_name, gln,
  business_type, premise_classification, ownership,
  superintendent_name, superintendent_cadre, superintendent_registration_number,
  ppb_license_number, license_valid_until, license_validity_year, license_status,
  address_line1, address_line2, county, constituency, ward, postal_code, country,
  status, last_updated
) VALUES
(
  (SELECT id FROM suppliers WHERE entity_id = 'SUP-002'),
  'SUP-002-WH1',
  34015,
  'MediCare Warehouse - Westlands',
  '6164001000010',  -- Matches Kafka message final_destination_sgln (extracted GLN from urn:epc:id:sgln:6164001.00001.0)
  'WHOLESALE',
  'WAREHOUSE/DISTRIBUTION',
  'PRIVATE COMPANY (LIMITED)',
  'Peter Kamau',
  'PHARMACIST',
  5002,
  'PPB/WHL/015/2025-WH1',
  '2025-12-31',
  2025,
  'Active',
  'Westlands Business Park',
  'Waiyaki Way',
  'Nairobi',
  'Westlands',
  'Westlands',
  '00100',
  'KE',
  'Active',
  NOW()
)
ON CONFLICT (premise_id) DO UPDATE SET
  gln = EXCLUDED.gln,
  status = 'Active';

-- ============================================
-- SUMMARY
-- ============================================
-- Expected Validation Results:
--
-- Kafka Message 1 (BATCH-METFORMIN-001):
--   - FAIL: Manufacturer "KEM Pharma Ltd" not found
--   - FAIL: Importer "Pharma Imports Ltd" not found
--   - FAIL: Product GTIN may not exist (depends on product catalog)
--
-- Kafka Message 2 (BATCH-AMOXICILLIN-002):
--   - PASS: Manufacturer "Cosmos Pharmaceuticals Ltd" exists (MFG-001)
--   - PASS: Importer "HealthSup Distributors Ltd" exists (SUP-001)
--   - PASS: Manufacturing site premise exists
--   - PASS: Final destination premise exists
--   - WARNING: Product name/code mismatch (if product exists in catalog)
--
-- Kafka Message 3 (BATCH-PARACETAMOL-003):
--   - PASS: Manufacturer "Universal Pharmaceuticals Kenya Ltd" exists (MFG-002)
--   - PASS: Importer "MediCare Pharmaceuticals Kenya" exists (SUP-002)
--   - PASS: Final destination premise exists
--   - WARNING: Product name/code mismatch (if product exists in catalog)

