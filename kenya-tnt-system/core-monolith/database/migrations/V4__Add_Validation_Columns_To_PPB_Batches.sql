-- V4__Add_Validation_Columns_To_PPB_Batches.sql
-- Add validation result columns to ppb_batches table

ALTER TABLE ppb_batches
  ADD COLUMN IF NOT EXISTS validation_errors JSONB,
  ADD COLUMN IF NOT EXISTS validation_warnings JSONB,
  ADD COLUMN IF NOT EXISTS validation_info JSONB;

-- Add comments
COMMENT ON COLUMN ppb_batches.validation_errors IS 'JSON array of validation errors (critical issues that prevent processing)';
COMMENT ON COLUMN ppb_batches.validation_warnings IS 'JSON array of validation warnings (non-blocking issues)';
COMMENT ON COLUMN ppb_batches.validation_info IS 'JSON array of validation info messages (informational)';

-- Update processed_status to include WARNING status
-- Note: This is informational - the column already supports any string value


