-- V5__Add_L5_TNT_Analytics_Tables.sql
-- Migration for Level 5 Track & Trace Analytics Requirements (P0 Critical)
-- Adds actor context to events and creates all L5 TNT analytics tables

-- ============================================
-- 1. Add Actor Context to EPCIS Event Summary (P0)
-- ============================================
ALTER TABLE epcis_event_summary 
ADD COLUMN actor_type VARCHAR(50),
ADD COLUMN actor_user_id UUID REFERENCES users(id),
ADD COLUMN actor_gln VARCHAR(100),
ADD COLUMN actor_organization VARCHAR(255),
ADD COLUMN source_entity_type VARCHAR(50),
ADD COLUMN source_entity_id INTEGER;

-- Indexes for actor-based analytics
CREATE INDEX idx_epcis_event_summary_actor_type ON epcis_event_summary(actor_type);
CREATE INDEX idx_epcis_event_summary_actor_user_id ON epcis_event_summary(actor_user_id);
CREATE INDEX idx_epcis_event_summary_actor_gln ON epcis_event_summary(actor_gln);
CREATE INDEX idx_epcis_event_summary_source_entity ON epcis_event_summary(source_entity_type, source_entity_id);

-- ============================================
-- 2. Product Status Tracking Table (P0)
-- ============================================
CREATE TABLE product_status (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  batch_id INTEGER REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  status VARCHAR(50) NOT NULL, -- 'ACTIVE', 'LOST', 'STOLEN', 'DAMAGED', 'SAMPLE', 'EXPORT', 'DISPENSING'
  previous_status VARCHAR(50), -- Previous status for history
  status_date TIMESTAMP NOT NULL DEFAULT NOW(),
  actor_user_id UUID NOT NULL REFERENCES users(id),
  actor_type VARCHAR(50), -- 'manufacturer', 'supplier', 'facility'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_status_product_id ON product_status(product_id);
CREATE INDEX idx_product_status_batch_id ON product_status(batch_id);
CREATE INDEX idx_product_status_sgtin ON product_status(sgtin);
CREATE INDEX idx_product_status_status ON product_status(status);
CREATE INDEX idx_product_status_status_date ON product_status(status_date);
CREATE INDEX idx_product_status_actor_user_id ON product_status(actor_user_id);

COMMENT ON TABLE product_status IS 'Track product status changes throughout lifecycle (L5 TNT requirement)';
COMMENT ON COLUMN product_status.status IS 'Current status: ACTIVE, LOST, STOLEN, DAMAGED, SAMPLE, EXPORT, DISPENSING';
COMMENT ON COLUMN product_status.previous_status IS 'Previous status before change (for history tracking)';

-- ============================================
-- 3. Product Destruction Table (P0)
-- ============================================
CREATE TABLE product_destruction (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  quantity NUMERIC(15,2) NOT NULL,
  destruction_reason VARCHAR(255) NOT NULL, -- 'EXPIRED', 'DAMAGED', 'RECALLED', 'QUARANTINED'
  destruction_date TIMESTAMP NOT NULL,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  compliance_document_url TEXT, -- Link to destruction certificate
  witness_name VARCHAR(255),
  witness_signature TEXT, -- Base64 encoded image or URL
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_destruction_product_id ON product_destruction(product_id);
CREATE INDEX idx_product_destruction_batch_id ON product_destruction(batch_id);
CREATE INDEX idx_product_destruction_sgtin ON product_destruction(sgtin);
CREATE INDEX idx_product_destruction_destruction_date ON product_destruction(destruction_date);
CREATE INDEX idx_product_destruction_facility_user_id ON product_destruction(facility_user_id);
CREATE INDEX idx_product_destruction_reason ON product_destruction(destruction_reason);

COMMENT ON TABLE product_destruction IS 'Track product destruction for regulatory compliance (L5 TNT requirement)';
COMMENT ON COLUMN product_destruction.destruction_reason IS 'Reason for destruction: EXPIRED, DAMAGED, RECALLED, QUARANTINED';

-- ============================================
-- 4. Product Returns Table (P0)
-- ============================================
CREATE TABLE product_returns (
  id SERIAL PRIMARY KEY,
  return_type VARCHAR(50) NOT NULL, -- 'RETURN_RECEIVING', 'RETURN_SHIPPING'
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  quantity NUMERIC(15,2) NOT NULL,
  return_reason VARCHAR(255) NOT NULL, -- 'DEFECTIVE', 'EXPIRED', 'OVERSTOCK', 'CUSTOMER_RETURN'
  from_actor_user_id UUID NOT NULL REFERENCES users(id), -- Who is returning
  to_actor_user_id UUID NOT NULL REFERENCES users(id), -- Who is receiving
  reference_document_number VARCHAR(255), -- Reference document for return
  return_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'REJECTED'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_returns_product_id ON product_returns(product_id);
CREATE INDEX idx_product_returns_batch_id ON product_returns(batch_id);
CREATE INDEX idx_product_returns_sgtin ON product_returns(sgtin);
CREATE INDEX idx_product_returns_return_type ON product_returns(return_type);
CREATE INDEX idx_product_returns_from_actor ON product_returns(from_actor_user_id);
CREATE INDEX idx_product_returns_to_actor ON product_returns(to_actor_user_id);
CREATE INDEX idx_product_returns_return_date ON product_returns(return_date);
CREATE INDEX idx_product_returns_status ON product_returns(status);

COMMENT ON TABLE product_returns IS 'Track return logistics (reverse logistics) for L5 TNT compliance';
COMMENT ON COLUMN product_returns.return_type IS 'Type: RETURN_RECEIVING (receiving returned products) or RETURN_SHIPPING (shipping returns)';
COMMENT ON COLUMN product_returns.return_reason IS 'Reason: DEFECTIVE, EXPIRED, OVERSTOCK, CUSTOMER_RETURN';

-- ============================================
-- 5. Product Verifications Table (P0)
-- ============================================
CREATE TABLE product_verifications (
  id SERIAL PRIMARY KEY,
  sgtin VARCHAR(255) NOT NULL, -- Serialized product identifier
  product_id INTEGER REFERENCES products(id),
  batch_id INTEGER REFERENCES batches(id),
  verification_result VARCHAR(50) NOT NULL, -- 'VALID', 'INVALID', 'COUNTERFEIT', 'EXPIRED', 'ALREADY_VERIFIED'
  verification_location VARCHAR(255), -- Where verification occurred
  verification_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  verifier_user_id UUID REFERENCES users(id), -- Null for public/consumer verifications
  verification_method VARCHAR(50), -- 'SCAN', 'MANUAL', 'API', 'MOBILE_APP'
  ip_address VARCHAR(45), -- For public verifications
  user_agent TEXT, -- Browser/device info
  is_consumer_verification BOOLEAN DEFAULT FALSE, -- True for public verifications
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_verifications_sgtin ON product_verifications(sgtin);
CREATE INDEX idx_product_verifications_product_id ON product_verifications(product_id);
CREATE INDEX idx_product_verifications_batch_id ON product_verifications(batch_id);
CREATE INDEX idx_product_verifications_result ON product_verifications(verification_result);
CREATE INDEX idx_product_verifications_timestamp ON product_verifications(verification_timestamp);
CREATE INDEX idx_product_verifications_verifier_user_id ON product_verifications(verifier_user_id);
CREATE INDEX idx_product_verifications_consumer ON product_verifications(is_consumer_verification);

COMMENT ON TABLE product_verifications IS 'Track product verifications and counterfeit detection (L5 TNT requirement)';
COMMENT ON COLUMN product_verifications.verification_result IS 'Result: VALID, INVALID, COUNTERFEIT, EXPIRED, ALREADY_VERIFIED';
COMMENT ON COLUMN product_verifications.is_consumer_verification IS 'True for public/consumer verifications, false for system verifications';

-- ============================================
-- 6. Facility Receiving Table (P0)
-- ============================================
CREATE TABLE facility_receiving (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  shipment_id INTEGER REFERENCES shipment(id),
  consignment_id INTEGER REFERENCES consignments(id),
  received_date TIMESTAMP NOT NULL DEFAULT NOW(),
  received_quantity NUMERIC(15,2) NOT NULL,
  expected_quantity NUMERIC(15,2), -- For discrepancy tracking
  discrepancy_quantity NUMERIC(15,2), -- Difference between expected and received
  discrepancy_reason TEXT,
  received_by UUID REFERENCES users(id), -- Staff who received
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_receiving_facility_user_id ON facility_receiving(facility_user_id);
CREATE INDEX idx_facility_receiving_shipment_id ON facility_receiving(shipment_id);
CREATE INDEX idx_facility_receiving_consignment_id ON facility_receiving(consignment_id);
CREATE INDEX idx_facility_receiving_received_date ON facility_receiving(received_date);

COMMENT ON TABLE facility_receiving IS 'Track facility receiving operations (L5 TNT requirement)';
COMMENT ON COLUMN facility_receiving.discrepancy_quantity IS 'Difference between expected and received quantity (for discrepancy tracking)';

-- ============================================
-- 7. Facility Dispensing Table (P0)
-- ============================================
CREATE TABLE facility_dispensing (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  quantity NUMERIC(15,2) NOT NULL,
  dispensing_date TIMESTAMP NOT NULL DEFAULT NOW(),
  patient_id VARCHAR(255), -- Optional patient identifier
  prescription_number VARCHAR(255), -- Optional prescription reference
  dispensed_by UUID REFERENCES users(id), -- Staff who dispensed
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_dispensing_facility_user_id ON facility_dispensing(facility_user_id);
CREATE INDEX idx_facility_dispensing_product_id ON facility_dispensing(product_id);
CREATE INDEX idx_facility_dispensing_batch_id ON facility_dispensing(batch_id);
CREATE INDEX idx_facility_dispensing_sgtin ON facility_dispensing(sgtin);
CREATE INDEX idx_facility_dispensing_dispensing_date ON facility_dispensing(dispensing_date);
CREATE INDEX idx_facility_dispensing_patient_id ON facility_dispensing(patient_id);

COMMENT ON TABLE facility_dispensing IS 'Track facility dispensing operations - point of consumption (L5 TNT requirement)';
COMMENT ON COLUMN facility_dispensing.patient_id IS 'Optional patient identifier for dispensing tracking';

-- ============================================
-- 8. Facility Inventory Table (P1)
-- ============================================
CREATE TABLE facility_inventory (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(15,2) DEFAULT 0, -- Reserved for dispensing
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(facility_user_id, product_id, batch_id)
);

CREATE INDEX idx_facility_inventory_facility_user_id ON facility_inventory(facility_user_id);
CREATE INDEX idx_facility_inventory_product_id ON facility_inventory(product_id);
CREATE INDEX idx_facility_inventory_batch_id ON facility_inventory(batch_id);

COMMENT ON TABLE facility_inventory IS 'Track facility inventory levels (L5 TNT requirement)';
COMMENT ON COLUMN facility_inventory.reserved_quantity IS 'Quantity reserved for dispensing (not available for other operations)';


