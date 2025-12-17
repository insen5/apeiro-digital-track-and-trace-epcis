-- Migration V06: Add premise quality audit snapshots table
-- Date: December 14, 2025
-- Purpose: Store weekly data quality audit snapshots for historical tracking

CREATE TABLE premise_quality_reports (
    id SERIAL PRIMARY KEY,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Overview
    total_premises INTEGER NOT NULL,
    data_quality_score DECIMAL(5,2) NOT NULL,
    
    -- Completeness
    missing_gln INTEGER NOT NULL,
    missing_county INTEGER NOT NULL,
    missing_business_type INTEGER NOT NULL,
    missing_ownership INTEGER NOT NULL,
    missing_superintendent INTEGER NOT NULL,
    missing_license_info INTEGER NOT NULL,
    missing_location INTEGER NOT NULL,
    complete_records INTEGER NOT NULL,
    completeness_percentage DECIMAL(5,2) NOT NULL,
    
    -- Validity
    expired_licenses INTEGER NOT NULL,
    expiring_soon INTEGER NOT NULL,
    valid_licenses INTEGER NOT NULL,
    duplicate_premise_ids INTEGER NOT NULL,
    invalid_gln INTEGER NOT NULL,
    
    -- Full report (JSON)
    full_report JSONB NOT NULL,
    
    -- Audit metadata
    triggered_by VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick retrieval
CREATE INDEX idx_quality_reports_date ON premise_quality_reports(report_date DESC);
CREATE INDEX idx_quality_reports_score ON premise_quality_reports(data_quality_score);

-- Comments
COMMENT ON TABLE premise_quality_reports IS 'Historical snapshots of premise data quality audits';
COMMENT ON COLUMN premise_quality_reports.triggered_by IS 'How audit was triggered: scheduled, manual, post-sync';
