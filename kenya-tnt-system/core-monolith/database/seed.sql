-- Seed Data for Kenya TNT System
-- Run this after schema.sql to populate tables with dummy data for testing
-- Uses UUID '00000000-0000-0000-0000-000000000001' as temp-user-id for testing

-- Clear existing test data first (respect foreign key order)
DELETE FROM cases_products;
DELETE FROM "case";
DELETE FROM packages;
DELETE FROM recall_requests;
DELETE FROM batches;
DELETE FROM shipment;
DELETE FROM products WHERE "userId" = '00000000-0000-0000-0000-000000000001';
DELETE FROM ppb_activity_logs WHERE "userId" = '00000000-0000-0000-0000-000000000001';
DELETE FROM batch_notification_settings WHERE "userId" = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- USERS
-- ============================================
INSERT INTO users (id, email, password, role, "roleId", "glnNumber", organization, "isDeleted", "createdAt", "updatedAt")
VALUES
  -- Test User (for temp-user-id)
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', NULL, 'manufacturer', 2, '0000000000001', 'Test Manufacturing Co', false, NOW(), NOW()),
  -- Legacy users (kept for backward compatibility)
  ('550e8400-e29b-41d4-a716-446655440001', 'ppb@kenya.gov.ke', NULL, 'dha', 1, '1234567890123', 'Pharmacy and Poisons Board', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'manufacturer@example.com', NULL, 'manufacturer', 2, '2345678901234', 'Pharma Manufacturing Ltd', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'distributor@example.com', NULL, 'cpa', 3, '3456789012345', 'Medical Supplies Distributors', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'manufacturer2@example.com', NULL, 'manufacturer', 2, '4567890123456', 'Kenya Pharma Co', false, NOW(), NOW()),
  
  -- ============================================
  -- DEMO LOGIN ACCOUNTS (All passwords: 'password')
  -- ============================================
  
  -- PPB (Regulator)
  -- Email: ppp@ppp.com / Password: password
  ('550e8400-e29b-41d4-a716-446655440010', 'ppp@ppp.com', 'password', 'dha', 1, '9999999999999', 'PPB', false, NOW(), NOW()),
  
  -- Test Manufacturer
  -- Email: test-manufacturer@pharma.ke / Password: password
  -- GLN: 6164003000000
  ('550e8400-e29b-41d4-a716-446655440011', 'test-manufacturer@pharma.ke', 'password', 'manufacturer', 2, '6164003000000', 'Test Manufacturer', false, NOW(), NOW()),
  
  -- KEMSA (Supplier/Distributor)
  -- Email: kemsa@health.ke / Password: password
  -- GLN: 0614141000013
  ('550e8400-e29b-41d4-a716-446655440012', 'kemsa@health.ke', 'password', 'cpa', 3, '0614141000013', 'KEMSA', false, NOW(), NOW()),
  
  -- Facility (Kenyatta National Hospital)
  -- Email: facility1@health.ke / Password: password
  -- GLN: 0614141000020
  ('550e8400-e29b-41d4-a716-446655440013', 'facility1@health.ke', 'password', 'user_facility', 4, '0614141000020', 'Kenyatta National Hospital', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PRODUCTS (PPB Regulator creates these)
-- ============================================
INSERT INTO products ("productName", "brandName", "userId", gtin, "isEnabled", "createdAt", "updatedAt")
VALUES
  ('Paracetamol 500mg Tablets', 'Panadol', '00000000-0000-0000-0000-000000000001', '0123456789012', true, NOW(), NOW()),
  ('Amoxicillin 250mg Capsules', 'Amoxil', '00000000-0000-0000-0000-000000000001', '0123456789013', true, NOW(), NOW()),
  ('Ibuprofen 400mg Tablets', 'Brufen', '00000000-0000-0000-0000-000000000001', '0123456789014', true, NOW(), NOW()),
  ('Metformin 500mg Tablets', 'Glucophage', '00000000-0000-0000-0000-000000000001', '0123456789015', true, NOW(), NOW()),
  ('Amlodipine 5mg Tablets', 'Norvasc', '00000000-0000-0000-0000-000000000001', '0123456789016', true, NOW(), NOW())
ON CONFLICT (gtin) DO NOTHING;

-- ============================================
-- BATCHES (Manufacturers create these)
-- ============================================
INSERT INTO batches ("productId", batchno, expiry, qty, "sentQty", "isEnabled", "userId", "createdAt", "updatedAt")
SELECT 
  p.id,
  'BATCH-' || LPAD(p.id::text, 3, '0') || '-001',
  (CURRENT_DATE + INTERVAL '365 days')::date,
  1000.00,
  0.00,
  true,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
FROM products p
WHERE p.gtin = '0123456789012'
LIMIT 1
ON CONFLICT (batchno) DO NOTHING;

INSERT INTO batches ("productId", batchno, expiry, qty, "sentQty", "isEnabled", "userId", "createdAt", "updatedAt")
SELECT 
  p.id,
  'BATCH-' || LPAD(p.id::text, 3, '0') || '-002',
  (CURRENT_DATE + INTERVAL '180 days')::date,
  500.00,
  200.00,
  true,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
FROM products p
WHERE p.gtin = '0123456789013'
LIMIT 1
ON CONFLICT (batchno) DO NOTHING;

INSERT INTO batches ("productId", batchno, expiry, qty, "sentQty", "isEnabled", "userId", "createdAt", "updatedAt")
SELECT 
  p.id,
  'BATCH-' || LPAD(p.id::text, 3, '0') || '-003',
  (CURRENT_DATE + INTERVAL '90 days')::date,
  750.00,
  0.00,
  true,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
FROM products p
WHERE p.gtin = '0123456789014'
LIMIT 1
ON CONFLICT (batchno) DO NOTHING;

-- Batch for Metformin
INSERT INTO batches ("productId", batchno, expiry, qty, "sentQty", "isEnabled", "userId", "createdAt", "updatedAt")
SELECT 
  p.id,
  'BATCH-' || LPAD(p.id::text, 3, '0') || '-001',
  (CURRENT_DATE + INTERVAL '200 days')::date,
  600.00,
  0.00,
  true,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
FROM products p
WHERE p.gtin = '0123456789015'
LIMIT 1
ON CONFLICT (batchno) DO NOTHING;

-- Batch for Amlodipine
INSERT INTO batches ("productId", batchno, expiry, qty, "sentQty", "isEnabled", "userId", "createdAt", "updatedAt")
SELECT 
  p.id,
  'BATCH-' || LPAD(p.id::text, 3, '0') || '-001',
  (CURRENT_DATE + INTERVAL '150 days')::date,
  400.00,
  0.00,
  true,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
FROM products p
WHERE p.gtin = '0123456789016'
LIMIT 1
ON CONFLICT (batchno) DO NOTHING;

-- ============================================
-- SHIPMENTS (Manufacturers create these)
-- ============================================
INSERT INTO shipment (
  customer, 
  "pickupDate", 
  "expectedDeliveryDate", 
  "pickupLocation", 
  "destinationAddress", 
  carrier, 
  "userId", 
  "isDispatched", 
  "ssccBarcode", 
  "parentSsccBarcode",
  "isDeleted",
  "createdAt", 
  "updatedAt"
)
VALUES
  -- Main shipment from manufacturer (dispatched)
  (
    'Medical Supplies Distributors',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '2 days',
    '123 Manufacturing St, Nairobi',
    '456 Distribution Ave, Mombasa',
    'Kenya Logistics Ltd',
    '00000000-0000-0000-0000-000000000001',
    true,
    '123456789012345678',
    NULL,
    false,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  -- Shipment received by distributor
  (
    'City Pharmacy Chain',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '1 day',
    '456 Distribution Ave, Mombasa',
    '789 Main Street, Kisumu',
    'Regional Express',
    '550e8400-e29b-41d4-a716-446655440003',
    true,
    '345678901234567890',
    '123456789012345678',
    false,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  -- Forwarded shipment from distributor to facility
  (
    'Kenyatta National Hospital',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days',
    '789 Main Street, Kisumu',
    '100 Hospital Road, Nairobi',
    'Medical Express',
    '550e8400-e29b-41d4-a716-446655440003',
    false,
    '456789012345678901',
    '345678901234567890',
    false,
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  -- Another pending shipment
  (
    'City Pharmacy',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    '123 Manufacturing St, Nairobi',
    '789 Main Street, Kisumu',
    'Fast Track Transport',
    '00000000-0000-0000-0000-000000000001',
    false,
    '234567890123456789',
    NULL,
    false,
    NOW(),
    NOW()
  );

-- ============================================
-- PACKAGES
-- ============================================
-- Packages for main shipment (123456789012345678)
INSERT INTO packages (label, "shipmentId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'PKG-' || s.id || '-001',
  s.id,
  s."userId",
  s."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM shipment s
WHERE s."ssccBarcode" = '123456789012345678'
LIMIT 1;

INSERT INTO packages (label, "shipmentId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'PKG-' || s.id || '-002',
  s.id,
  s."userId",
  s."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM shipment s
WHERE s."ssccBarcode" = '123456789012345678'
LIMIT 1;

INSERT INTO packages (label, "shipmentId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'PKG-' || s.id || '-003',
  s.id,
  s."userId",
  s."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM shipment s
WHERE s."ssccBarcode" = '123456789012345678'
LIMIT 1;

-- Packages for received shipment (345678901234567890)
INSERT INTO packages (label, "shipmentId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'PKG-RECV-' || s.id || '-001',
  s.id,
  s."userId",
  s."isDispatched",
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
FROM shipment s
WHERE s."ssccBarcode" = '345678901234567890'
LIMIT 1;

-- Packages for pending shipment
INSERT INTO packages (label, "shipmentId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'PKG-' || s.id || '-001',
  s.id,
  s."userId",
  s."isDispatched",
  NOW(),
  NOW()
FROM shipment s
WHERE s."ssccBarcode" = '234567890123456789'
LIMIT 1;

-- ============================================
-- CASES
-- ============================================
-- Cases for first package of main shipment
INSERT INTO "case" (label, "packageId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'CASE-' || p.id || '-001',
  p.id,
  p."userId",
  p."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM packages p
WHERE p.label LIKE 'PKG-%001' AND p.label NOT LIKE 'PKG-RECV%'
LIMIT 1;

INSERT INTO "case" (label, "packageId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'CASE-' || p.id || '-002',
  p.id,
  p."userId",
  p."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM packages p
WHERE p.label LIKE 'PKG-%001' AND p.label NOT LIKE 'PKG-RECV%'
LIMIT 1;

-- Cases for second package of main shipment
INSERT INTO "case" (label, "packageId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'CASE-' || p.id || '-001',
  p.id,
  p."userId",
  p."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM packages p
WHERE p.label LIKE 'PKG-%002' AND p.label NOT LIKE 'PKG-RECV%'
LIMIT 1;

-- Cases for third package of main shipment
INSERT INTO "case" (label, "packageId", "userId", "isDispatched", "createdAt", "updatedAt")
SELECT 
  'CASE-' || p.id || '-001',
  p.id,
  p."userId",
  p."isDispatched",
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM packages p
WHERE p.label LIKE 'PKG-%003' AND p.label NOT LIKE 'PKG-RECV%'
LIMIT 1;

-- ============================================
-- CASES_PRODUCTS (Link cases to batches)
-- ============================================
-- First case: Paracetamol
INSERT INTO cases_products ("caseId", "productId", "batchId", qty, "fromNumber", count)
SELECT 
  c.id,
  b."productId",
  b.id,
  50.00,
  1,
  50
FROM "case" c
CROSS JOIN batches b
CROSS JOIN products p
WHERE c.label LIKE 'CASE-%001' AND c.label NOT LIKE 'CASE-%002'
  AND b.batchno LIKE 'BATCH-%001'
  AND p.gtin = '0123456789012'
  AND b."productId" = p.id
LIMIT 1;

-- Second case: Amoxicillin
INSERT INTO cases_products ("caseId", "productId", "batchId", qty, "fromNumber", count)
SELECT 
  c.id,
  b."productId",
  b.id,
  30.00,
  1,
  30
FROM "case" c
CROSS JOIN batches b
CROSS JOIN products p
WHERE c.label LIKE 'CASE-%002'
  AND b.batchno LIKE 'BATCH-%002'
  AND p.gtin = '0123456789013'
  AND b."productId" = p.id
LIMIT 1;

-- Third case: Ibuprofen
INSERT INTO cases_products ("caseId", "productId", "batchId", qty, "fromNumber", count)
SELECT 
  c.id,
  b."productId",
  b.id,
  40.00,
  1,
  40
FROM "case" c
CROSS JOIN batches b
CROSS JOIN products p
WHERE c.label LIKE 'CASE-%001' AND c.id NOT IN (SELECT "caseId" FROM cases_products WHERE "caseId" = c.id)
  AND b.batchno LIKE 'BATCH-%003'
  AND p.gtin = '0123456789014'
  AND b."productId" = p.id
LIMIT 1;

-- Fourth case: Multiple products (Paracetamol + Metformin)
INSERT INTO cases_products ("caseId", "productId", "batchId", qty, "fromNumber", count)
SELECT 
  c.id,
  b."productId",
  b.id,
  25.00,
  1,
  25
FROM "case" c
CROSS JOIN batches b
CROSS JOIN products p
WHERE c.label LIKE 'CASE-%001' AND c.id NOT IN (SELECT "caseId" FROM cases_products WHERE "caseId" = c.id)
  AND b.batchno LIKE 'BATCH-%001'
  AND p.gtin = '0123456789012'
  AND b."productId" = p.id
LIMIT 1;

-- Fourth case: Multiple products (Paracetamol + Metformin) - Add Metformin
INSERT INTO cases_products ("caseId", "productId", "batchId", qty, "fromNumber", count)
SELECT 
  c.id,
  p.id,
  b.id,
  20.00,
  26,
  20
FROM "case" c
CROSS JOIN products p
CROSS JOIN batches b
WHERE c.label LIKE 'CASE-%001' 
  AND c.id IN (
    SELECT id FROM "case" 
    WHERE id IN (SELECT "caseId" FROM cases_products WHERE "caseId" = c.id)
    ORDER BY id DESC LIMIT 1
  )
  AND p.gtin = '0123456789015'
  AND b."productId" = p.id
  AND b.batchno LIKE 'BATCH-%001'
  AND NOT EXISTS (SELECT 1 FROM cases_products WHERE "caseId" = c.id AND "productId" = p.id)
LIMIT 1;

-- ============================================
-- RECALL REQUESTS (PPB creates these)
-- ============================================
INSERT INTO recall_requests (
  "batchId",
  reason,
  status,
  transporter,
  "pickupLocation",
  "pickupDate",
  "deliveryLocation",
  "deliveryDate",
  "createdAt",
  "updatedAt"
)
SELECT 
  b.id,
  'Quality control issue detected during routine inspection',
  'PENDING',
  'Safe Transport Ltd',
  '123 Manufacturing St, Nairobi',
  CURRENT_DATE + INTERVAL '7 days',
  '456 Disposal Facility, Nakuru',
  CURRENT_DATE + INTERVAL '10 days',
  NOW(),
  NOW()
FROM batches b
WHERE b.batchno LIKE 'BATCH-%002'
LIMIT 1;

-- ============================================
-- BATCH NOTIFICATION SETTINGS
-- ============================================
INSERT INTO batch_notification_settings ("userId", "earlyWarningEnabled", "secondaryWarningEnabled", "finalWarningEnabled", "postExpiryWarningEnabled")
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', true, true, true, true),
  ('550e8400-e29b-41d4-a716-446655440003', true, false, true, false),
  ('550e8400-e29b-41d4-a716-446655440004', false, true, true, true);

-- ============================================
-- PPB ACTIVITY LOGS
-- ============================================
INSERT INTO ppb_activity_logs ("userId", action, "entityType", "entityId", details, "createdAt")
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'PRODUCT_CREATED',
    'product',
    1,
    '{"productName": "Paracetamol 500mg Tablets", "gtin": "0123456789012"}'::jsonb,
    NOW() - INTERVAL '5 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'RECALL_INITIATED',
    'recall',
    1,
    '{"batchId": 2, "reason": "Quality control issue"}'::jsonb,
    NOW() - INTERVAL '2 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'JOURNEY_VIEWED',
    'shipment',
    1,
    '{"sscc": "123456789012345678"}'::jsonb,
    NOW() - INTERVAL '1 day'
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify data was inserted:
-- SELECT 'Users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'Products', COUNT(*) FROM products
-- UNION ALL
-- SELECT 'Batches', COUNT(*) FROM batches
-- UNION ALL
-- SELECT 'Shipments', COUNT(*) FROM shipment
-- UNION ALL
-- SELECT 'Packages', COUNT(*) FROM packages
-- UNION ALL
-- SELECT 'Cases', COUNT(*) FROM "case"
-- UNION ALL
-- SELECT 'Cases_Products', COUNT(*) FROM cases_products
-- UNION ALL
-- SELECT 'Recalls', COUNT(*) FROM recall_requests;

