-- V16: Add completenessPercentage column to quality audit tables
-- Date: December 18, 2025
-- Purpose: Fix audit history display by adding missing completenessPercentage field
-- Issue: Audit table showing 0% completeness because field doesn't exist in database

-- ============================================================
-- Add completenessPercentage to UAT Facilities Quality Audit
-- ============================================================
ALTER TABLE uat_facilities_quality_audit 
ADD COLUMN IF NOT EXISTS completeness_percentage DECIMAL(5, 2);

COMMENT ON COLUMN uat_facilities_quality_audit.completeness_percentage IS 
'Percentage of complete records (0-100). Records with all critical fields populated.';

-- ============================================================
-- Add missing coordinates columns to UAT Facilities Quality Audit
-- ============================================================
ALTER TABLE uat_facilities_quality_audit 
ADD COLUMN IF NOT EXISTS missing_coordinates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missing_latitude INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missing_longitude INTEGER DEFAULT 0;

COMMENT ON COLUMN uat_facilities_quality_audit.missing_coordinates IS 
'Number of facilities missing both latitude AND longitude';

COMMENT ON COLUMN uat_facilities_quality_audit.missing_latitude IS 
'Number of facilities missing latitude';

COMMENT ON COLUMN uat_facilities_quality_audit.missing_longitude IS 
'Number of facilities missing longitude';

-- ============================================================
-- Add complete_records column to UAT Facilities Quality Audit
-- ============================================================
ALTER TABLE uat_facilities_quality_audit 
ADD COLUMN IF NOT EXISTS complete_records INTEGER DEFAULT 0;

COMMENT ON COLUMN uat_facilities_quality_audit.complete_records IS 
'Number of facilities with ALL critical fields populated (GLN, MFL Code, County, Coordinates, Ownership)';

-- ============================================================
-- Add completenessPercentage to Production Facilities Quality Audit
-- ============================================================
ALTER TABLE prod_facilities_quality_audit 
ADD COLUMN IF NOT EXISTS completeness_percentage DECIMAL(5, 2);

COMMENT ON COLUMN prod_facilities_quality_audit.completeness_percentage IS 
'Percentage of complete records (0-100). Records with all critical fields populated.';

-- ============================================================
-- Add missing coordinates columns to Production Facilities Quality Audit
-- ============================================================
ALTER TABLE prod_facilities_quality_audit 
ADD COLUMN IF NOT EXISTS missing_coordinates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missing_latitude INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missing_longitude INTEGER DEFAULT 0;

COMMENT ON COLUMN prod_facilities_quality_audit.missing_coordinates IS 
'Number of facilities missing both latitude AND longitude';

COMMENT ON COLUMN prod_facilities_quality_audit.missing_latitude IS 
'Number of facilities missing latitude';

COMMENT ON COLUMN prod_facilities_quality_audit.missing_longitude IS 
'Number of facilities missing longitude';

-- ============================================================
-- Add complete_records column to track facilities with ALL critical fields
-- ============================================================
ALTER TABLE prod_facilities_quality_audit 
ADD COLUMN IF NOT EXISTS complete_records INTEGER DEFAULT 0;

COMMENT ON COLUMN prod_facilities_quality_audit.complete_records IS 
'Number of facilities with ALL critical fields populated (GLN, MFL Code, County, Coordinates, Ownership)';

-- ============================================================
-- Backfill completenessPercentage for existing audit records
-- ============================================================
-- For UAT facilities: Calculate from completenessScore if available
UPDATE uat_facilities_quality_audit 
SET completeness_percentage = completeness_score 
WHERE completeness_percentage IS NULL AND completeness_score IS NOT NULL;

-- For Production facilities: Calculate from completenessScore if available
UPDATE prod_facilities_quality_audit 
SET completeness_percentage = completeness_score 
WHERE completeness_percentage IS NULL AND completeness_score IS NOT NULL;

-- ============================================================
-- Verification
-- ============================================================
-- Check UAT facilities audit table
SELECT 
  COUNT(*) AS total_audits,
  COUNT(completeness_percentage) AS audits_with_percentage,
  AVG(completeness_percentage) AS avg_completeness
FROM uat_facilities_quality_audit;

-- Check Production facilities audit table
SELECT 
  COUNT(*) AS total_audits,
  COUNT(completeness_percentage) AS audits_with_percentage,
  AVG(completeness_percentage) AS avg_completeness
FROM prod_facilities_quality_audit;

-- ============================================================
-- Migration Complete
-- ============================================================
