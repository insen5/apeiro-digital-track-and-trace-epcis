-- V3__Create_PPB_Batch_Tables.sql 
-- Migration for PPB Batch Data Integration 

CREATE TABLE IF NOT EXISTS ppb_batches ( 
    id BIGSERIAL PRIMARY KEY, 
     
   -- Product Information 
    gtin VARCHAR(50) NOT NULL, 
    product_name VARCHAR(255) NOT NULL, 
    product_code VARCHAR(50) NOT NULL, 
     
   -- Batch Information 
    batch_number VARCHAR(100) NOT NULL UNIQUE, 
    status VARCHAR(50) NOT NULL, 
    expiration_date DATE, 
    manufacture_date DATE, 
    permit_id VARCHAR(50), 
    consignment_ref_number VARCHAR(100), 
    approval_status BOOLEAN, 
    approval_date_stamp VARCHAR(100), 
     
   -- Quantities 
    declared_total INTEGER, 
    declared_sent INTEGER, 
     
   -- Serialization 
    serialization_range TEXT[], 
    is_partial_approval BOOLEAN, 
     
   -- Manufacturer 
    manufacturer_name VARCHAR(255), 
    manufacturer_gln VARCHAR(100), 
     
   -- Manufacturing Site 
    manufacturing_site_sgln VARCHAR(100), 
    manufacturing_site_label VARCHAR(255), 
     
   -- Importer 
    importer_name VARCHAR(255), 
    importer_country VARCHAR(10), 
    importer_gln VARCHAR(100), 
     
   -- Logistics 
    carrier VARCHAR(100), 
    origin VARCHAR(100), 
    port_of_entry VARCHAR(255), 
    final_destination_sgln VARCHAR(100), 
    final_destination_address VARCHAR(255), 
     
   -- Processing Status 
    processed_status VARCHAR(50) DEFAULT 'RECEIVED', 
    processing_error TEXT, 
     
   -- Audit Fields 
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

-- Create indexes for better query performance 
CREATE INDEX idx_ppb_batch_number ON ppb_batches(batch_number); 
CREATE INDEX idx_ppb_gtin ON ppb_batches(gtin); 
CREATE INDEX idx_ppb_product_code ON ppb_batches(product_code); 
CREATE INDEX idx_ppb_status ON ppb_batches(status); 
CREATE INDEX idx_ppb_manufacturer_name ON ppb_batches(manufacturer_name); 
CREATE INDEX idx_ppb_manufacturer_gln ON ppb_batches(manufacturer_gln); 
CREATE INDEX idx_ppb_expiration_date ON ppb_batches(expiration_date); 
CREATE INDEX idx_ppb_created_date ON ppb_batches(created_date); 
CREATE INDEX idx_ppb_processed_status ON ppb_batches(processed_status); 

-- Add comments for documentation 
COMMENT ON TABLE ppb_batches IS 'PPB Batch Data from external systems via Kafka stream'; 
COMMENT ON COLUMN ppb_batches.batch_number IS 'Unique batch number from PPB'; 
COMMENT ON COLUMN ppb_batches.status IS 'Batch status: active, recalled, inactive, quarantined, expired'; 
COMMENT ON COLUMN ppb_batches.processed_status IS 'Processing status: RECEIVED, PROCESSED, ERROR'; 
COMMENT ON COLUMN ppb_batches.serialization_range IS 'Array of serialization ranges';


