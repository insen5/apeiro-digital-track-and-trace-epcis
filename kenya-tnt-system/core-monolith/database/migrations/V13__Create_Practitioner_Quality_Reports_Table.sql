-- ============================================================================
-- Migration: V13 - Create Practitioner Quality Reports Table
-- Description: Create table to store practitioner data quality audit snapshots
-- Date: 2024-12-16
-- Author: System
-- ============================================================================

CREATE TABLE IF NOT EXISTS practitioner_quality_reports (
    id SERIAL PRIMARY KEY,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_practitioners INTEGER NOT NULL,
    data_quality_score DECIMAL(5,2) NOT NULL,
    
    -- Completeness metrics
    missing_email INTEGER NOT NULL DEFAULT 0,
    missing_phone INTEGER NOT NULL DEFAULT 0,
    missing_county INTEGER NOT NULL DEFAULT 0,
    missing_cadre INTEGER NOT NULL DEFAULT 0,
    missing_license_info INTEGER NOT NULL DEFAULT 0,
    missing_facility INTEGER NOT NULL DEFAULT 0,
    missing_address INTEGER NOT NULL DEFAULT 0,
    complete_records INTEGER NOT NULL DEFAULT 0,
    completeness_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Validity metrics
    expired_licenses INTEGER NOT NULL DEFAULT 0,
    expiring_soon INTEGER NOT NULL DEFAULT 0,
    valid_licenses INTEGER NOT NULL DEFAULT 0,
    duplicate_registration_numbers INTEGER NOT NULL DEFAULT 0,
    invalid_email INTEGER NOT NULL DEFAULT 0,
    
    -- Full report JSON
    full_report JSONB NOT NULL,
    
    -- Audit metadata
    triggered_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_practitioner_quality_reports_report_date ON practitioner_quality_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_practitioner_quality_reports_triggered_by ON practitioner_quality_reports(triggered_by);
CREATE INDEX IF NOT EXISTS idx_practitioner_quality_reports_data_quality_score ON practitioner_quality_reports(data_quality_score);

-- Add comments
COMMENT ON TABLE practitioner_quality_reports IS 'Audit snapshots of practitioner data quality over time';
COMMENT ON COLUMN practitioner_quality_reports.full_report IS 'Complete quality report stored as JSONB';
COMMENT ON COLUMN practitioner_quality_reports.triggered_by IS 'User or system that triggered this audit';

-- ============================================================================
-- End of Migration V13
-- ============================================================================
