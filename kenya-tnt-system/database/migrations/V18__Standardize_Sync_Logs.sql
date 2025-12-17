-- V18: Standardize Sync Logs Across All Master Data
-- Date: December 18, 2025
-- Purpose: Migrate all sync logs to master_data_sync_logs table for consistency
-- Impact: All entities use single sync log table with consistent schema

-- ============================================================
-- Step 1: Verify master_data_sync_logs has all required columns
-- ============================================================
-- Already has:
-- - entity_type VARCHAR(50) NOT NULL
-- - sync_started_at TIMESTAMP NOT NULL
-- - sync_completed_at TIMESTAMP
-- - sync_status VARCHAR(20) NOT NULL
-- - records_fetched INTEGER DEFAULT 0
-- - records_inserted INTEGER DEFAULT 0
-- - records_updated INTEGER DEFAULT 0
-- - records_failed INTEGER DEFAULT 0
-- - error_message TEXT
-- - last_updated_timestamp TIMESTAMP
-- - triggered_by VARCHAR(100)
-- - custom_params JSONB
-- - created_at TIMESTAMP DEFAULT NOW()

-- ============================================================
-- Step 2: Add tracking column to prevent duplicate migrations
-- ============================================================
ALTER TABLE uat_facilities_sync_log 
ADD COLUMN IF NOT EXISTS migrated_to_master BOOLEAN DEFAULT FALSE;

ALTER TABLE prod_facilities_sync_log 
ADD COLUMN IF NOT EXISTS migrated_to_master BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Step 3: Migrate UAT Facilities Sync Logs
-- ============================================================
INSERT INTO master_data_sync_logs (
  entity_type,
  sync_started_at,
  sync_completed_at,
  sync_status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  error_message,
  last_updated_timestamp,
  triggered_by,
  custom_params,
  created_at
)
SELECT 
  'facility' as entity_type,
  sync_started_at,
  sync_completed_at,
  sync_status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  error_message,
  last_updated_timestamp,
  'manual' as triggered_by, -- Default for legacy data
  jsonb_build_object(
    'source_table', 'uat_facilities_sync_log',
    'original_sync_id', id,
    'migrated_at', NOW()
  ) as custom_params,
  created_at
FROM uat_facilities_sync_log
WHERE migrated_to_master = FALSE
  AND id NOT IN (
    SELECT (custom_params->>'original_sync_id')::INTEGER 
    FROM master_data_sync_logs 
    WHERE entity_type = 'facility' 
      AND custom_params->>'source_table' = 'uat_facilities_sync_log'
      AND custom_params->>'original_sync_id' IS NOT NULL
  );

-- Mark as migrated
UPDATE uat_facilities_sync_log 
SET migrated_to_master = TRUE 
WHERE id IN (
  SELECT (custom_params->>'original_sync_id')::INTEGER 
  FROM master_data_sync_logs 
  WHERE entity_type = 'facility' 
    AND custom_params->>'source_table' = 'uat_facilities_sync_log'
);

-- ============================================================
-- Step 4: Migrate Production Facilities Sync Logs
-- ============================================================
INSERT INTO master_data_sync_logs (
  entity_type,
  sync_started_at,
  sync_completed_at,
  sync_status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  error_message,
  last_updated_timestamp,
  triggered_by,
  custom_params,
  created_at
)
SELECT 
  'facility_prod' as entity_type,
  sync_started_at,
  sync_completed_at,
  sync_status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  error_message,
  last_updated_timestamp,
  'manual' as triggered_by, -- Default for legacy data
  jsonb_build_object(
    'source_table', 'prod_facilities_sync_log',
    'original_sync_id', id,
    'migrated_at', NOW()
  ) as custom_params,
  created_at
FROM prod_facilities_sync_log
WHERE migrated_to_master = FALSE
  AND id NOT IN (
    SELECT (custom_params->>'original_sync_id')::INTEGER 
    FROM master_data_sync_logs 
    WHERE entity_type = 'facility_prod' 
      AND custom_params->>'source_table' = 'prod_facilities_sync_log'
      AND custom_params->>'original_sync_id' IS NOT NULL
  );

-- Mark as migrated
UPDATE prod_facilities_sync_log 
SET migrated_to_master = TRUE 
WHERE id IN (
  SELECT (custom_params->>'original_sync_id')::INTEGER 
  FROM master_data_sync_logs 
  WHERE entity_type = 'facility_prod' 
    AND custom_params->>'source_table' = 'prod_facilities_sync_log'
);

-- ============================================================
-- Step 5: Verification
-- ============================================================
-- Check migration results
SELECT 
  'UAT Facilities' as source,
  COUNT(*) as migrated_count
FROM uat_facilities_sync_log
WHERE migrated_to_master = TRUE
UNION ALL
SELECT 
  'Prod Facilities' as source,
  COUNT(*) as migrated_count
FROM prod_facilities_sync_log
WHERE migrated_to_master = TRUE
UNION ALL
SELECT 
  'Master Data Sync Logs (facility)' as source,
  COUNT(*) as total_count
FROM master_data_sync_logs
WHERE entity_type = 'facility'
UNION ALL
SELECT 
  'Master Data Sync Logs (facility_prod)' as source,
  COUNT(*) as total_count
FROM master_data_sync_logs
WHERE entity_type = 'facility_prod';

-- ============================================================
-- Step 6: Add Comments for Documentation
-- ============================================================
COMMENT ON TABLE master_data_sync_logs IS 
'Centralized sync log for all master data entities (products, premises, facilities, practitioners). Single source of truth for sync history.';

COMMENT ON COLUMN master_data_sync_logs.entity_type IS 
'Entity type: product, premise, facility, facility_prod, practitioner';

COMMENT ON COLUMN master_data_sync_logs.triggered_by IS 
'Sync trigger: manual, cron, scheduled-weekly, api, system';

COMMENT ON COLUMN master_data_sync_logs.custom_params IS 
'Entity-specific parameters and migration metadata (JSONB)';

COMMENT ON TABLE uat_facilities_sync_log IS 
'LEGACY: UAT facility sync logs. Data migrated to master_data_sync_logs. Kept for reference.';

COMMENT ON TABLE prod_facilities_sync_log IS 
'LEGACY: Production facility sync logs. Data migrated to master_data_sync_logs. Kept for reference.';

-- ============================================================
-- Step 7: Create View for Backward Compatibility (Optional)
-- ============================================================
-- View to query UAT facility syncs from master table
CREATE OR REPLACE VIEW uat_facility_sync_history AS
SELECT 
  id,
  sync_started_at,
  sync_completed_at,
  sync_status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  error_message,
  last_updated_timestamp,
  triggered_by,
  created_at,
  custom_params
FROM master_data_sync_logs
WHERE entity_type = 'facility'
ORDER BY sync_started_at DESC;

-- View to query Production facility syncs from master table
CREATE OR REPLACE VIEW prod_facility_sync_history AS
SELECT 
  id,
  sync_started_at,
  sync_completed_at,
  sync_status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  error_message,
  last_updated_timestamp,
  triggered_by,
  created_at,
  custom_params
FROM master_data_sync_logs
WHERE entity_type = 'facility_prod'
ORDER BY sync_started_at DESC;

COMMENT ON VIEW uat_facility_sync_history IS 
'Convenience view for UAT facility sync history from master_data_sync_logs';

COMMENT ON VIEW prod_facility_sync_history IS 
'Convenience view for production facility sync history from master_data_sync_logs';

-- ============================================================
-- Step 8: Add Indexes for Performance
-- ============================================================
-- Index on entity_type + sync_started_at for common queries
CREATE INDEX IF NOT EXISTS idx_master_data_sync_logs_entity_date 
ON master_data_sync_logs(entity_type, sync_started_at DESC);

-- Index on sync_status for filtering
CREATE INDEX IF NOT EXISTS idx_master_data_sync_logs_status 
ON master_data_sync_logs(sync_status);

-- GIN index on custom_params for JSON queries
CREATE INDEX IF NOT EXISTS idx_master_data_sync_logs_custom_params 
ON master_data_sync_logs USING GIN (custom_params);

-- ============================================================
-- Step 9: Final Statistics
-- ============================================================
SELECT 
  entity_type,
  COUNT(*) as total_syncs,
  COUNT(*) FILTER (WHERE sync_status = 'completed') as completed,
  COUNT(*) FILTER (WHERE sync_status = 'failed') as failed,
  COUNT(*) FILTER (WHERE sync_status = 'in_progress') as in_progress,
  MIN(sync_started_at) as first_sync,
  MAX(sync_started_at) as latest_sync
FROM master_data_sync_logs
GROUP BY entity_type
ORDER BY entity_type;

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next Steps:
-- 1. Update GenericSyncService to ONLY use master_data_sync_logs
-- 2. Update frontend SyncStatus component to support all entity types
-- 3. Test sync history endpoints for all entities
-- 4. Consider deprecating facility-specific sync log tables in V19
