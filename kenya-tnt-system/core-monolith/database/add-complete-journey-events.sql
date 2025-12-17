-- Add complete journey events for SSCC 123456789012345678
-- This will show: Manufacturer Shipping -> Supplier Receiving -> Supplier Shipping -> Facility Receiving

-- First, ensure we have the shipment
DO $$
DECLARE
  shipment_id_var INTEGER;
  manufacturer_user_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  supplier_user_id UUID := '550e8400-e29b-41d4-a716-446655440010';
  facility_user_id UUID := '550e8400-e29b-41d4-a716-446655440020';
BEGIN
  -- Get or create shipment
  SELECT id INTO shipment_id_var FROM shipment WHERE "ssccBarcode" = '123456789012345678' LIMIT 1;
  
  IF shipment_id_var IS NULL THEN
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
      manufacturer_user_id,
      true,
      '123456789012345678',
      false,
      NOW() - INTERVAL '30 days',
      NOW() - INTERVAL '25 days'
    )
    RETURNING id INTO shipment_id_var;
  END IF;

  -- Event 1: Manufacturer Shipping (if not exists)
  INSERT INTO epcis_events (
    event_id, event_type, parent_id, biz_step, disposition, event_time, action,
    read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
    source_entity_type, source_entity_id, created_at
  )
  VALUES (
    'urn:uuid:complete-journey-manufacturer-ship',
    'AggregationEvent',
    'urn:epc:id:sscc:123456789012345678',
    'shipping',
    'in_transit',
    NOW() - INTERVAL '30 days',
    'ADD',
    'urn:epc:id:sgln:0614141000002.0',
    'urn:epc:id:sgln:0614141000002.0',
    'manufacturer',
    manufacturer_user_id,
    '0614141000002',
    'Kenya Pharma Manufacturing Ltd',
    'shipment',
    shipment_id_var,
    NOW() - INTERVAL '30 days'
  )
  ON CONFLICT (event_id) DO NOTHING;

  INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
  SELECT 
    'urn:uuid:complete-journey-manufacturer-ship',
    'urn:epc:id:sscc:123456789012345678',
    'SSCC',
    NOW() - INTERVAL '30 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM epcis_event_epcs 
    WHERE event_id = 'urn:uuid:complete-journey-manufacturer-ship' 
    AND epc = 'urn:epc:id:sscc:123456789012345678'
  );

  -- Event 2: Supplier/Distributor Receiving
  INSERT INTO epcis_events (
    event_id, event_type, parent_id, biz_step, disposition, event_time, action,
    read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
    source_entity_type, source_entity_id, created_at
  )
  VALUES (
    'urn:uuid:complete-journey-supplier-receive',
    'ObjectEvent',
    NULL,
    'receiving',
    'active',
    NOW() - INTERVAL '25 days',
    'OBSERVE',
    'urn:epc:id:sgln:0614141000010.0',
    'urn:epc:id:sgln:0614141000010.0',
    'supplier',
    supplier_user_id,
    '0614141000010',
    'Nairobi Medical Distributors',
    'shipment',
    shipment_id_var,
    NOW() - INTERVAL '25 days'
  )
  ON CONFLICT (event_id) DO NOTHING;

  INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
  SELECT 
    'urn:uuid:complete-journey-supplier-receive',
    'urn:epc:id:sscc:123456789012345678',
    'SSCC',
    NOW() - INTERVAL '25 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM epcis_event_epcs 
    WHERE event_id = 'urn:uuid:complete-journey-supplier-receive' 
    AND epc = 'urn:epc:id:sscc:123456789012345678'
  );

  -- Event 3: Supplier Shipping (forwarding to facility)
  INSERT INTO epcis_events (
    event_id, event_type, parent_id, biz_step, disposition, event_time, action,
    read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
    source_entity_type, source_entity_id, created_at
  )
  VALUES (
    'urn:uuid:complete-journey-supplier-ship',
    'AggregationEvent',
    'urn:epc:id:sscc:123456789012345678',
    'shipping',
    'in_transit',
    NOW() - INTERVAL '20 days',
    'ADD',
    'urn:epc:id:sgln:0614141000010.0',
    'urn:epc:id:sgln:0614141000010.0',
    'supplier',
    supplier_user_id,
    '0614141000010',
    'Nairobi Medical Distributors',
    'shipment',
    shipment_id_var,
    NOW() - INTERVAL '20 days'
  )
  ON CONFLICT (event_id) DO NOTHING;

  INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
  SELECT 
    'urn:uuid:complete-journey-supplier-ship',
    'urn:epc:id:sscc:123456789012345678',
    'SSCC',
    NOW() - INTERVAL '20 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM epcis_event_epcs 
    WHERE event_id = 'urn:uuid:complete-journey-supplier-ship' 
    AND epc = 'urn:epc:id:sscc:123456789012345678'
  );

  -- Event 4: Facility Receiving
  INSERT INTO epcis_events (
    event_id, event_type, parent_id, biz_step, disposition, event_time, action,
    read_point_id, biz_location_id, actor_type, actor_user_id, actor_gln, actor_organization,
    source_entity_type, source_entity_id, created_at
  )
  VALUES (
    'urn:uuid:complete-journey-facility-receive',
    'ObjectEvent',
    NULL,
    'receiving',
    'active',
    NOW() - INTERVAL '15 days',
    'OBSERVE',
    'urn:epc:id:sgln:0614141000020.0',
    'urn:epc:id:sgln:0614141000020.0',
    'facility',
    facility_user_id,
    '0614141000020',
    'Kenyatta National Hospital',
    'shipment',
    shipment_id_var,
    NOW() - INTERVAL '15 days'
  )
  ON CONFLICT (event_id) DO NOTHING;

  INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at)
  SELECT 
    'urn:uuid:complete-journey-facility-receive',
    'urn:epc:id:sscc:123456789012345678',
    'SSCC',
    NOW() - INTERVAL '15 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM epcis_event_epcs 
    WHERE event_id = 'urn:uuid:complete-journey-facility-receive' 
    AND epc = 'urn:epc:id:sscc:123456789012345678'
  );

  RAISE NOTICE 'Complete journey events created for SSCC 123456789012345678';
END $$;



