-- V6__Normalize_EPCIS_Event_Structure.sql
-- Migration to normalize epcis_event_summary for faster EPC lookups and better analytics

-- ============================================
-- 1. Create Normalized Event Tables
-- ============================================

-- Main events table (replaces child_epcs array with junction table)
CREATE TABLE epcis_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(50) NOT NULL,  -- 'AggregationEvent', 'ObjectEvent', etc.
  parent_id VARCHAR(255),
  biz_step VARCHAR(100),
  disposition VARCHAR(100),
  event_time TIMESTAMP NOT NULL,
  read_point_id VARCHAR(255),
  biz_location_id VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  -- Actor context (P0 - Critical for L5 TNT)
  actor_type VARCHAR(50),  -- 'manufacturer', 'supplier', 'facility', 'ppb'
  actor_user_id UUID REFERENCES users(id),
  actor_gln VARCHAR(100),
  actor_organization VARCHAR(255),
  -- Source entity tracking
  source_entity_type VARCHAR(50),  -- 'consignment', 'shipment', 'batch', etc.
  source_entity_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Junction table for EPCs (one row per EPC, linked to epcis_events)
CREATE TABLE epcis_event_epcs (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  epc VARCHAR(255) NOT NULL,
  epc_type VARCHAR(50), -- 'SGTIN', 'SSCC', 'BATCH_URI', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, epc)
);

-- ============================================
-- 2. Create Indexes for Performance
-- ============================================

-- Indexes for epcis_events
CREATE INDEX idx_epcis_events_event_time ON epcis_events(event_time);
CREATE INDEX idx_epcis_events_parent_id ON epcis_events(parent_id);
CREATE INDEX idx_epcis_events_biz_step ON epcis_events(biz_step);
CREATE INDEX idx_epcis_events_event_type ON epcis_events(event_type);
CREATE INDEX idx_epcis_events_actor_type ON epcis_events(actor_type);
CREATE INDEX idx_epcis_events_actor_user_id ON epcis_events(actor_user_id);
CREATE INDEX idx_epcis_events_actor_gln ON epcis_events(actor_gln);
CREATE INDEX idx_epcis_events_source_entity ON epcis_events(source_entity_type, source_entity_id);

-- Indexes for epcis_event_epcs (KEY for fast EPC lookups!)
CREATE INDEX idx_epcis_event_epcs_event_id ON epcis_event_epcs(event_id);
CREATE INDEX idx_epcis_event_epcs_epc ON epcis_event_epcs(epc); -- Critical for EPC lookups
CREATE INDEX idx_epcis_event_epcs_epc_type ON epcis_event_epcs(epc_type);

-- ============================================
-- 3. Add Comments
-- ============================================

COMMENT ON TABLE epcis_events IS 'Normalized EPCIS events table for faster analytics. Replaces denormalized epcis_event_summary.child_epcs array with junction table.';
COMMENT ON TABLE epcis_event_epcs IS 'Junction table linking EPCs to events. One row per EPC for fast lookups and better analytics.';
COMMENT ON COLUMN epcis_event_epcs.epc IS 'EPC URI (SGTIN, SSCC, etc.) - indexed for fast lookups';
COMMENT ON COLUMN epcis_event_epcs.epc_type IS 'Type of EPC: SGTIN, SSCC, BATCH_URI, etc.';


