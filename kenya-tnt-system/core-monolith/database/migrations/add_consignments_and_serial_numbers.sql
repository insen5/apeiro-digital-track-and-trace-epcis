-- Add consignments table for PPB imports
CREATE TABLE IF NOT EXISTS consignments (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  source_system VARCHAR(100) NOT NULL,
  destination_system VARCHAR(100) NOT NULL,
  consignment_id VARCHAR(255) NOT NULL,
  manufacturer_ppb_id VARCHAR(255) NOT NULL,
  mah_ppb_id VARCHAR(255) NOT NULL,
  manufacturer_gln VARCHAR(50),
  mah_gln VARCHAR(50),
  registration_no VARCHAR(255) NOT NULL,
  shipment_date DATE NOT NULL,
  country_of_origin VARCHAR(10) NOT NULL,
  destination_country VARCHAR(10) NOT NULL,
  total_quantity NUMERIC(15,2) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consignments_event_id ON consignments(event_id);
CREATE INDEX idx_consignments_consignment_id ON consignments(consignment_id);
CREATE INDEX idx_consignments_user_id ON consignments(user_id);
CREATE INDEX idx_consignments_manufacturer_ppb_id ON consignments(manufacturer_ppb_id);

-- Add serial numbers table
CREATE TABLE IF NOT EXISTS serial_numbers (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  consignment_id INTEGER REFERENCES consignments(id) ON DELETE SET NULL,
  serial_number VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, serial_number)
);

CREATE INDEX idx_serial_numbers_batch_id ON serial_numbers(batch_id);
CREATE INDEX idx_serial_numbers_consignment_id ON serial_numbers(consignment_id);
CREATE INDEX idx_serial_numbers_serial_number ON serial_numbers(serial_number);

-- Add consignment_batches junction table to link batches to consignments
CREATE TABLE IF NOT EXISTS consignment_batches (
  id SERIAL PRIMARY KEY,
  consignment_id INTEGER NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  sscc VARCHAR(18),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(consignment_id, batch_id)
);

CREATE INDEX idx_consignment_batches_consignment_id ON consignment_batches(consignment_id);
CREATE INDEX idx_consignment_batches_batch_id ON consignment_batches(batch_id);
CREATE INDEX idx_consignment_batches_sscc ON consignment_batches(sscc);

COMMENT ON TABLE consignments IS 'PPB consignments imported from PPB-HIE system. Stores header and consignment metadata.';
COMMENT ON TABLE serial_numbers IS 'Serial numbers for batches, linked to consignments. Stores individual serialized item identifiers.';
COMMENT ON TABLE consignment_batches IS 'Junction table linking batches to consignments. Stores SSCCs assigned at batch level.';

