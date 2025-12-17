-- V11__create_master_data_sync_logs.sql
-- Create master_data_sync_logs table for unified sync logging across all master data types

CREATE TABLE IF NOT EXISTS master_data_sync_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('in_progress', 'completed', 'failed')),
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    last_updated_timestamp TIMESTAMP,
    triggered_by VARCHAR(100),
    custom_params JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_master_data_sync_logs_entity_type ON master_data_sync_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_master_data_sync_logs_started_at ON master_data_sync_logs(sync_started_at);
CREATE INDEX IF NOT EXISTS idx_master_data_sync_logs_status ON master_data_sync_logs(sync_status);

-- Add comments for documentation
COMMENT ON TABLE master_data_sync_logs IS 'Unified sync log for all master data types (Product, Premise, Facility, etc.) - provides audit trail and performance metrics';
COMMENT ON COLUMN master_data_sync_logs.entity_type IS 'Type of master data: product, premise, facility, supplier, logistics_provider';
COMMENT ON COLUMN master_data_sync_logs.sync_status IS 'Status of sync operation: in_progress, completed, failed';
COMMENT ON COLUMN master_data_sync_logs.records_fetched IS 'Number of records fetched from external API';
COMMENT ON COLUMN master_data_sync_logs.records_inserted IS 'Number of new records inserted';
COMMENT ON COLUMN master_data_sync_logs.records_updated IS 'Number of existing records updated';
COMMENT ON COLUMN master_data_sync_logs.records_failed IS 'Number of records that failed to sync';
COMMENT ON COLUMN master_data_sync_logs.last_updated_timestamp IS 'Timestamp used for incremental sync queries';
COMMENT ON COLUMN master_data_sync_logs.triggered_by IS 'Who triggered the sync: manual, cron, api, webhook';
COMMENT ON COLUMN master_data_sync_logs.custom_params IS 'Custom parameters used for sync (JSON)';
