-- Seed Data for Journey Tracking and Consignment Flow Visualization
-- This script creates sample data for testing journey tracking by SSCC and consignment flow Sankey diagrams
-- Note: Consignment flow uses consignmentID (not batch number) since a batch can appear in multiple consignments

-- ============================================
-- 1. Create Users (Manufacturers, Distributors, Facilities)
-- ============================================

-- Port/Manufacturer
INSERT INTO users (id, email, role, "roleId", "glnNumber", organization, "isDeleted", "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'port.mombasa@pharma.ke', 'manufacturer', 3, '0614141000001', 'Mombasa Port Pharma Hub', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'manufacturer@pharma.ke', 'manufacturer', 3, '0614141000002', 'Kenya Pharma Manufacturing Ltd', false, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Distributors/Suppliers
INSERT INTO users (id, email, role, "roleId", "glnNumber", organization, "isDeleted", "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'distributor1@pharma.ke', 'cpa', 4, '0614141000010', 'Nairobi Medical Distributors', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440011', 'distributor2@pharma.ke', 'cpa', 4, '0614141000011', 'Central Kenya Pharma Supply', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 'distributor3@pharma.ke', 'cpa', 4, '0614141000012', 'Coast Region Medical Supplies', false, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Facilities
INSERT INTO users (id, email, role, "roleId", "glnNumber", organization, "isDeleted", "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', 'facility1@health.ke', 'user_facility', 2, '0614141000020', 'Kenyatta National Hospital', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440021', 'facility2@health.ke', 'user_facility', 2, '0614141000021', 'Nairobi County Hospital', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440022', 'facility3@health.ke', 'user_facility', 2, '0614141000022', 'Mombasa County Hospital', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440023', 'facility4@health.ke', 'user_facility', 2, '0614141000023', 'Kisumu County Hospital', false, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440024', 'facility5@health.ke', 'user_facility', 2, '0614141000024', 'Nakuru County Hospital', false, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. Create Products and Batches
-- ============================================

-- Get or create a product (assuming ppb_products table exists)
-- Note: Adjust product_id based on your actual product data
DO $$
DECLARE
  product_id_var INTEGER;
  batch_id_var INTEGER;
  manufacturer_user_id UUID := '550e8400-e29b-41d4-a716-446655440002';
BEGIN
  -- Get first product or create one
  SELECT id INTO product_id_var FROM ppb_products LIMIT 1;
  
  IF product_id_var IS NULL THEN
    -- Create a sample product
    INSERT INTO ppb_products (product_name, brand_name, gtin, created_at, updated_at)
    VALUES ('Paracetamol 500mg', 'Generic Pharma', '06141411234567', NOW(), NOW())
    RETURNING id INTO product_id_var;
  END IF;

  -- Create batches
  INSERT INTO batches ("productId", batchno, expiry, qty, "sentQty", "isEnabled", "userId", "createdAt", "updatedAt")
  VALUES 
    (product_id_var, 'BATCH2024001', (CURRENT_DATE + INTERVAL '2 years'), 10000, 0, true, manufacturer_user_id, NOW(), NOW()),
    (product_id_var, 'BATCH2024002', (CURRENT_DATE + INTERVAL '2 years'), 15000, 0, true, manufacturer_user_id, NOW(), NOW()),
    (product_id_var, 'BATCH2024003', (CURRENT_DATE + INTERVAL '2 years'), 8000, 0, true, manufacturer_user_id, NOW(), NOW())
  ON CONFLICT (batchno) DO NOTHING
  RETURNING id INTO batch_id_var;
END $$;

-- ============================================
-- 3. Create Shipments with SSCCs
-- ============================================

-- Main shipment from manufacturer (SSCC: 123456789012345678)
INSERT INTO shipment (
  customer, "pickupDate", "expectedDeliveryDate", "pickupLocation", "destinationAddress", 
  carrier, "userId", "isDispatched", "ssccBarcode", "isDeleted", "createdAt", "updatedAt"
)
VALUES (
  'Nairobi Medical Distributors', 
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '25 days',
  'Mombasa Port, Warehouse A',
  'Nairobi Distribution Center',
  'Kenya Logistics Ltd',
  '550e8400-e29b-41d4-a716-446655440002',
  true,
  '123456789012345678',
  false,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '25 days'
)
ON CONFLICT DO NOTHING;

-- Distributor shipments (child SSCCs)
INSERT INTO shipment (
  customer, "pickupDate", "expectedDeliveryDate", "pickupLocation", "destinationAddress",
  carrier, "userId", "customerId", "isDispatched", "ssccBarcode", "parentSsccBarcode", "isDeleted", "createdAt", "updatedAt"
)
VALUES 
  ('Kenyatta National Hospital', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '15 days',
   'Nairobi Distribution Center', 'Kenyatta National Hospital', 'City Logistics',
   '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020',
   true, '123456789012345679', '123456789012345678', false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
  
  ('Nairobi County Hospital', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '13 days',
   'Nairobi Distribution Center', 'Nairobi County Hospital', 'City Logistics',
   '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440021',
   true, '123456789012345680', '123456789012345678', false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '13 days'),
  
  ('Mombasa County Hospital', CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE - INTERVAL '17 days',
   'Nairobi Distribution Center', 'Mombasa County Hospital', 'Coast Logistics',
   '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440022',
   true, '123456789012345681', '123456789012345678', false, NOW() - INTERVAL '22 days', NOW() - INTERVAL '17 days'),
  
  ('Kisumu County Hospital', CURRENT_DATE - INTERVAL '19 days', CURRENT_DATE - INTERVAL '14 days',
   'Nairobi Distribution Center', 'Kisumu County Hospital', 'Western Logistics',
   '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440023',
   true, '123456789012345682', '123456789012345678', false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '14 days'),
  
  ('Nakuru County Hospital', CURRENT_DATE - INTERVAL '16 days', CURRENT_DATE - INTERVAL '11 days',
   'Nairobi Distribution Center', 'Nakuru County Hospital', 'Rift Valley Logistics',
   '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440024',
   true, '123456789012345683', '123456789012345678', false, NOW() - INTERVAL '16 days', NOW() - INTERVAL '11 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Create EPCIS Events for Journey Tracking
-- ============================================

-- Event 1: Manufacturer shipping (SSCC: 123456789012345678)
-- First ensure shipment exists
DO $$
DECLARE
  shipment_id_var INTEGER;
BEGIN
  SELECT id INTO shipment_id_var FROM shipment WHERE "ssccBarcode" = '123456789012345678' LIMIT 1;
  
  IF shipment_id_var IS NULL THEN
    -- Create shipment if it doesn't exist
    INSERT INTO shipment (
      customer, "pickupDate", "expectedDeliveryDate", "pickupLocation", "destinationAddress", 
      carrier, "userId", "isDispatched", "ssccBarcode", "isDeleted", "createdAt", "updatedAt"
    )
    VALUES (
      'Nairobi Medical Distributors', 
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE - INTERVAL '25 days',
      'Mombasa Port, Warehouse A',
      'Nairobi Distribution Center',
      'Kenya Logistics Ltd',
      '550e8400-e29b-41d4-a716-446655440002',
      true,
      '123456789012345678',
      false,
      NOW() - INTERVAL '30 days',
      NOW() - INTERVAL '25 days'
    )
    RETURNING id INTO shipment_id_var;
  END IF;

  -- Insert event
  INSERT INTO epcis_events (
    event_id, event_type, parent_id, biz_step, disposition, event_time, action,
    read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
    source_entity_type, source_entity_id, created_at
  )
  VALUES (
    'urn:uuid:event-manufacturer-ship-001',
    'AggregationEvent',
    'urn:epc:id:sscc:123456789012345678',
    'shipping',
    'in_transit',
    NOW() - INTERVAL '30 days',
    'ADD',
    'urn:epc:id:sgln:0614141000002.0',
    'urn:epc:id:sgln:0614141000002.0',
    'manufacturer',
    '550e8400-e29b-41d4-a716-446655440002',
    '0614141000002',
    'Kenya Pharma Manufacturing Ltd',
    'shipment',
    shipment_id_var,
    NOW() - INTERVAL '30 days'
  )
  ON CONFLICT (event_id) DO NOTHING;
END $$;

-- Add EPC for this event
INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
SELECT 
  'urn:uuid:event-manufacturer-ship-001',
  'urn:epc:id:sscc:123456789012345678',
  'SSCC',
  NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_epcs WHERE event_id = 'urn:uuid:event-manufacturer-ship-001' AND epc = 'urn:epc:id:sscc:123456789012345678'
);

-- Event 2: Distributor 1 receiving
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES (
  'urn:uuid:event-distributor1-receive-001',
  'ObjectEvent',
  NULL,
  'receiving',
  'active',
  NOW() - INTERVAL '25 days',
  'OBSERVE',
  'urn:epc:id:sgln:0614141000010.0',
  'urn:epc:id:sgln:0614141000010.0',
  'supplier',
  '550e8400-e29b-41d4-a716-446655440010',
  '0614141000010',
  'Nairobi Medical Distributors',
  'shipment',
        (SELECT id FROM shipment WHERE "ssccBarcode" = '123456789012345678' LIMIT 1),
  NOW() - INTERVAL '25 days'
)
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
SELECT 
  'urn:uuid:event-distributor1-receive-001',
  'urn:epc:id:sscc:123456789012345678',
  'SSCC',
  NOW() - INTERVAL '25 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_epcs WHERE event_id = 'urn:uuid:event-distributor1-receive-001' AND epc = 'urn:epc:id:sscc:123456789012345678'
);

-- Event 3: Distributor 1 shipping to Facility 1
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES (
  'urn:uuid:event-distributor1-ship-facility1-001',
  'AggregationEvent',
  'urn:epc:id:sscc:123456789012345679',
  'shipping',
  'in_transit',
  NOW() - INTERVAL '20 days',
  'ADD',
  'urn:epc:id:sgln:0614141000010.0',
  'urn:epc:id:sgln:0614141000010.0',
  'supplier',
  '550e8400-e29b-41d4-a716-446655440010',
  '0614141000010',
  'Nairobi Medical Distributors',
  'shipment',
  (SELECT id FROM shipment WHERE "ssccBarcode" = '123456789012345679' LIMIT 1),
  NOW() - INTERVAL '20 days'
)
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
SELECT 
  'urn:uuid:event-distributor1-ship-facility1-001',
  'urn:epc:id:sscc:123456789012345679',
  'SSCC',
  NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_epcs WHERE event_id = 'urn:uuid:event-distributor1-ship-facility1-001' AND epc = 'urn:epc:id:sscc:123456789012345679'
);

-- Event 4: Facility 1 receiving
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES (
  'urn:uuid:event-facility1-receive-001',
  'ObjectEvent',
  NULL,
  'receiving',
  'active',
  NOW() - INTERVAL '15 days',
  'OBSERVE',
  'urn:epc:id:sgln:0614141000020.0',
  'urn:epc:id:sgln:0614141000020.0',
  'facility',
  '550e8400-e29b-41d4-a716-446655440020',
  '0614141000020',
  'Kenyatta National Hospital',
  'shipment',
  (SELECT id FROM shipment WHERE "ssccBarcode" = '123456789012345679' LIMIT 1),
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
SELECT 
  'urn:uuid:event-facility1-receive-001',
  'urn:epc:id:sscc:123456789012345679',
  'SSCC',
  NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_epcs WHERE event_id = 'urn:uuid:event-facility1-receive-001' AND epc = 'urn:epc:id:sscc:123456789012345679'
);

-- Add more events for other facilities
-- Facility 2 receiving
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES (
  'urn:uuid:event-facility2-receive-001',
  'ObjectEvent',
  NULL,
  'receiving',
  'active',
  NOW() - INTERVAL '13 days',
  'OBSERVE',
  'urn:epc:id:sgln:0614141000021.0',
  'urn:epc:id:sgln:0614141000021.0',
  'facility',
  '550e8400-e29b-41d4-a716-446655440021',
  '0614141000021',
  'Nairobi County Hospital',
  'shipment',
  (SELECT id FROM shipment WHERE "ssccBarcode" = '123456789012345680' LIMIT 1),
  NOW() - INTERVAL '13 days'
)
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
SELECT 
  'urn:uuid:event-facility2-receive-001',
  'urn:epc:id:sscc:123456789012345680',
  'SSCC',
  NOW() - INTERVAL '13 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_epcs WHERE event_id = 'urn:uuid:event-facility2-receive-001' AND epc = 'urn:epc:id:sscc:123456789012345680'
);

-- ============================================
-- 5. Create Consignment and Consignment Flow Events (for Sankey Diagram)
-- ============================================

-- First, create a consignment record
INSERT INTO consignments (
  "eventID", "eventType", "eventTimestamp", "sourceSystem", "destinationSystem",
  "consignmentID", "manufacturerPPBID", "MAHPPBID", "manufacturerGLN", "MAHGLN",
  "registrationNo", "shipmentDate", "countryOfOrigin", "destinationCountry",
  "totalQuantity", "userId", "createdAt", "updatedAt"
)
VALUES (
  'EVT-CONS-2025-001',
  'INBOUND_SHIPMENT',
  NOW() - INTERVAL '35 days',
  'PPB-HIE',
  'TNT',
  'CONS-2025-001',
  '345345',
  '34234324',
  '0614141000001',
  '0614141000001',
  'PPB-REG-2025-001',
  CURRENT_DATE - INTERVAL '35 days',
  'IN',
  'KE',
  10000,
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '35 days',
  NOW() - INTERVAL '35 days'
)
ON CONFLICT ("eventID") DO NOTHING;

-- Port event for CONS-2025-001 (consignment flow)
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES (
  'urn:uuid:event-consignment-port-001',
  'AggregationEvent',
  NULL,
  'packing',
  'in_progress',
  NOW() - INTERVAL '35 days',
  'ADD',
  'urn:epc:id:sgln:0614141000001.0',
  'urn:epc:id:sgln:0614141000001.0',
  'manufacturer',
  '550e8400-e29b-41d4-a716-446655440001',
  '0614141000001',
  'Mombasa Port Pharma Hub',
  'consignment',
  (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1),
  NOW() - INTERVAL '35 days'
)
ON CONFLICT (event_id) DO NOTHING;

-- Add bizTransaction linking event to consignment
INSERT INTO epcis_event_biz_transactions (event_id, transaction_type, transaction_id, created_at)
SELECT 
  'urn:uuid:event-consignment-port-001',
  'CONSIGNMENT',
  'CONS-2025-001',
  NOW() - INTERVAL '35 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_biz_transactions 
  WHERE event_id = 'urn:uuid:event-consignment-port-001' 
  AND transaction_type = 'CONSIGNMENT'
);

INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
SELECT 
  'urn:uuid:event-consignment-port-001',
  'urn:epc:id:sscc:123456789012345678',
  'SSCC',
  NOW() - INTERVAL '35 days'
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_epcs WHERE event_id = 'urn:uuid:event-consignment-port-001' AND epc = 'urn:epc:id:sscc:123456789012345678'
);

-- Distributor events for CONS-2025-001 (consignment flow)
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES 
  ('urn:uuid:event-consignment-dist1-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '25 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000010.0', 'urn:epc:id:sgln:0614141000010.0',
   'supplier', '550e8400-e29b-41d4-a716-446655440010', '0614141000010', 'Nairobi Medical Distributors',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '25 days'),
  
  ('urn:uuid:event-consignment-dist2-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '22 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000011.0', 'urn:epc:id:sgln:0614141000011.0',
   'supplier', '550e8400-e29b-41d4-a716-446655440011', '0614141000011', 'Central Kenya Pharma Supply',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '22 days'),
  
  ('urn:uuid:event-consignment-dist3-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '19 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000012.0', 'urn:epc:id:sgln:0614141000012.0',
   'supplier', '550e8400-e29b-41d4-a716-446655440012', '0614141000012', 'Coast Region Medical Supplies',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '19 days')
ON CONFLICT (event_id) DO NOTHING;

-- Add bizTransactions for distributor events
INSERT INTO epcis_event_biz_transactions (event_id, transaction_type, transaction_id, created_at)
SELECT event_id, 'CONSIGNMENT', 'CONS-2025-001', NOW() - INTERVAL '25 days'
FROM (VALUES 
  ('urn:uuid:event-consignment-dist1-001'),
  ('urn:uuid:event-consignment-dist2-001'),
  ('urn:uuid:event-consignment-dist3-001')
) AS t(event_id)
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_biz_transactions 
  WHERE epcis_event_biz_transactions.event_id = t.event_id 
  AND transaction_type = 'CONSIGNMENT'
);

-- Facility events for CONS-2025-001 (receiving from distributors)
INSERT INTO epcis_events (
  event_id, event_type, parent_id, biz_step, disposition, event_time, action,
  read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
  source_entity_type, source_entity_id, created_at
)
VALUES 
  ('urn:uuid:event-consignment-fac1-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '15 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000020.0', 'urn:epc:id:sgln:0614141000020.0',
   'facility', '550e8400-e29b-41d4-a716-446655440020', '0614141000020', 'Kenyatta National Hospital',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '15 days'),
  
  ('urn:uuid:event-consignment-fac2-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '13 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000021.0', 'urn:epc:id:sgln:0614141000021.0',
   'facility', '550e8400-e29b-41d4-a716-446655440021', '0614141000021', 'Nairobi County Hospital',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '13 days'),
  
  ('urn:uuid:event-consignment-fac3-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '17 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000022.0', 'urn:epc:id:sgln:0614141000022.0',
   'facility', '550e8400-e29b-41d4-a716-446655440022', '0614141000022', 'Mombasa County Hospital',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '17 days'),
  
  ('urn:uuid:event-consignment-fac4-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '14 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000023.0', 'urn:epc:id:sgln:0614141000023.0',
   'facility', '550e8400-e29b-41d4-a716-446655440023', '0614141000023', 'Kisumu County Hospital',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '14 days'),
  
  ('urn:uuid:event-consignment-fac5-001', 'ObjectEvent', NULL, 'receiving', 'active', NOW() - INTERVAL '11 days', 'OBSERVE',
   'urn:epc:id:sgln:0614141000024.0', 'urn:epc:id:sgln:0614141000024.0',
   'facility', '550e8400-e29b-41d4-a716-446655440024', '0614141000024', 'Nakuru County Hospital',
   'consignment', (SELECT id FROM consignments WHERE "consignmentID" = 'CONS-2025-001' LIMIT 1), NOW() - INTERVAL '11 days')
ON CONFLICT (event_id) DO NOTHING;

-- Add bizTransactions for facility events
INSERT INTO epcis_event_biz_transactions (event_id, transaction_type, transaction_id, created_at)
SELECT event_id, 'CONSIGNMENT', 'CONS-2025-001', NOW() - INTERVAL '15 days'
FROM (VALUES 
  ('urn:uuid:event-consignment-fac1-001'),
  ('urn:uuid:event-consignment-fac2-001'),
  ('urn:uuid:event-consignment-fac3-001'),
  ('urn:uuid:event-consignment-fac4-001'),
  ('urn:uuid:event-consignment-fac5-001')
) AS t(event_id)
WHERE NOT EXISTS (
  SELECT 1 FROM epcis_event_biz_transactions 
  WHERE epcis_event_biz_transactions.event_id = t.event_id 
  AND transaction_type = 'CONSIGNMENT'
);

-- ============================================
-- Summary
-- ============================================
-- This seed data creates:
-- 1. 2 Manufacturers (Port + Manufacturing)
-- 2. 3 Distributors
-- 3. 5 Facilities
-- 4. 1 Main shipment (SSCC: 123456789012345678) from manufacturer
-- 5. 5 Child shipments to facilities
-- 6. EPCIS events showing complete journey timeline
-- 7. Consignment flow events for Sankey diagram (CONS-2025-001)
--
-- Test SSCC: 123456789012345678
-- Test Consignment: CONS-2025-001

