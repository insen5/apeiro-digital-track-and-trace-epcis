-- V9__Add_EPCIS_Standard_Fields.sql
-- Migration to add missing EPCIS 1.2/2.0 standard fields for analytics
-- These fields are sent to OpenEPCIS and also persisted locally for fast queries

-- ============================================
-- 1. Add missing simple fields to epcis_events
-- ============================================

-- Add action field (ADD, DELETE, OBSERVE) - available in both 1.2 and 2.0
ALTER TABLE epcis_events
ADD COLUMN IF NOT EXISTS action VARCHAR(10);

-- Add event_timezone_offset - available in both 1.2 and 2.0
ALTER TABLE epcis_events
ADD COLUMN IF NOT EXISTS event_timezone_offset VARCHAR(10);

-- Add error declaration fields - available in both 1.2 and 2.0
ALTER TABLE epcis_events
ADD COLUMN IF NOT EXISTS error_declaration_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS error_declaration_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS error_corrective_event_ids TEXT[]; -- Array of event IDs

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_epcis_events_action ON epcis_events(action);
CREATE INDEX IF NOT EXISTS idx_epcis_events_error_declaration_time ON epcis_events(error_declaration_time);

-- ============================================
-- 2. Create junction tables for complex fields
-- ============================================

-- Business Transactions (PO, Invoice, ASN, etc.)
CREATE TABLE IF NOT EXISTS epcis_event_biz_transactions (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'PO', 'INVOICE', 'ASN', 'DESADV', 'RECADV', etc.
  transaction_id VARCHAR(255) NOT NULL, -- Transaction ID/URI
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, transaction_type, transaction_id)
);

CREATE INDEX idx_epcis_biz_transactions_event_id ON epcis_event_biz_transactions(event_id);
CREATE INDEX idx_epcis_biz_transactions_type ON epcis_event_biz_transactions(transaction_type);
CREATE INDEX idx_epcis_biz_transactions_id ON epcis_event_biz_transactions(transaction_id);

-- Quantities (for AggregationEvents and ObjectEvents)
CREATE TABLE IF NOT EXISTS epcis_event_quantities (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  epc_class VARCHAR(255) NOT NULL, -- EPC class URI (e.g., urn:epc:class:lgtin:...)
  quantity DECIMAL(15,2) NOT NULL,
  unit_of_measure VARCHAR(50), -- 'EA', 'CASE', 'PALLET', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, epc_class)
);

CREATE INDEX idx_epcis_quantities_event_id ON epcis_event_quantities(event_id);
CREATE INDEX idx_epcis_quantities_epc_class ON epcis_event_quantities(epc_class);

-- Source List (source parties/locations)
CREATE TABLE IF NOT EXISTS epcis_event_sources (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'location', 'owning_party', 'possessing_party'
  source_id VARCHAR(255) NOT NULL, -- GLN, location URI, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, source_type, source_id)
);

CREATE INDEX idx_epcis_sources_event_id ON epcis_event_sources(event_id);
CREATE INDEX idx_epcis_sources_type ON epcis_event_sources(source_type);
CREATE INDEX idx_epcis_sources_id ON epcis_event_sources(source_id);

-- Destination List (destination parties/locations)
CREATE TABLE IF NOT EXISTS epcis_event_destinations (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  destination_type VARCHAR(50) NOT NULL, -- 'location', 'owning_party', 'possessing_party'
  destination_id VARCHAR(255) NOT NULL, -- GLN, location URI, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, destination_type, destination_id)
);

CREATE INDEX idx_epcis_destinations_event_id ON epcis_event_destinations(event_id);
CREATE INDEX idx_epcis_destinations_type ON epcis_event_destinations(destination_type);
CREATE INDEX idx_epcis_destinations_id ON epcis_event_destinations(destination_id);

-- Sensor Elements (EPCIS 2.0 only - temperature, humidity, etc.)
CREATE TABLE IF NOT EXISTS epcis_event_sensors (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  sensor_type VARCHAR(50) NOT NULL, -- 'TEMPERATURE', 'HUMIDITY', 'SHOCK', 'LIGHT', etc.
  device_id VARCHAR(255),
  device_metadata TEXT,
  raw_data TEXT,
  data_processing_method TEXT,
  sensor_time TIMESTAMP, -- When sensor reading was taken
  microorganism VARCHAR(255),
  chemical_substance VARCHAR(255),
  value DECIMAL(15,4), -- Numeric sensor value
  string_value TEXT,
  boolean_value BOOLEAN,
  hex_binary_value TEXT,
  uri_value TEXT,
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),
  mean_value DECIMAL(15,4),
  perc_rank DECIMAL(5,2),
  perc_value DECIMAL(15,4),
  unit_of_measure VARCHAR(50),
  exception VARCHAR(255),
  metadata JSONB, -- Additional sensor metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_epcis_sensors_event_id ON epcis_event_sensors(event_id);
CREATE INDEX idx_epcis_sensors_type ON epcis_event_sensors(sensor_type);
CREATE INDEX idx_epcis_sensors_time ON epcis_event_sensors(sensor_time);
CREATE INDEX idx_epcis_sensors_value ON epcis_event_sensors(value) WHERE value IS NOT NULL;

-- ============================================
-- 3. Add Comments
-- ============================================

COMMENT ON COLUMN epcis_events.action IS 'EPCIS action: ADD, DELETE, or OBSERVE. Available in both 1.2 and 2.0.';
COMMENT ON COLUMN epcis_events.event_timezone_offset IS 'Timezone offset when event occurred (e.g., +04:00). Available in both 1.2 and 2.0.';
COMMENT ON COLUMN epcis_events.error_declaration_time IS 'Timestamp when error was declared. Available in both 1.2 and 2.0.';
COMMENT ON COLUMN epcis_events.error_declaration_reason IS 'Reason code for error declaration. Available in both 1.2 and 2.0.';
COMMENT ON COLUMN epcis_events.error_corrective_event_ids IS 'Array of event IDs that correct this error. Available in both 1.2 and 2.0.';

COMMENT ON TABLE epcis_event_biz_transactions IS 'Business transactions linked to EPCIS events (PO, Invoice, ASN, etc.). Available in both 1.2 and 2.0.';
COMMENT ON TABLE epcis_event_quantities IS 'Quantities associated with EPCIS events. Available in both 1.2 and 2.0.';
COMMENT ON TABLE epcis_event_sources IS 'Source parties/locations for EPCIS events. Available in both 1.2 and 2.0.';
COMMENT ON TABLE epcis_event_destinations IS 'Destination parties/locations for EPCIS events. Available in both 1.2 and 2.0.';
COMMENT ON TABLE epcis_event_sensors IS 'Sensor data (temperature, humidity, etc.) for EPCIS events. EPCIS 2.0 only.';

