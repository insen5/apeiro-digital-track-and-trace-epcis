-- =====================================================================================
-- Migration V13: Create Product Quality Audit Reports Table
-- =====================================================================================
-- Date: December 14, 2025
-- Purpose: Track historical product data quality metrics for audit trail
-- Similar to premise_quality_reports but for products
-- =====================================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS product_quality_reports (
    id SERIAL PRIMARY KEY,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_products INTEGER NOT NULL,
    data_quality_score DECIMAL(5,2) NOT NULL,
    
    -- Completeness metrics
    missing_gtin INTEGER NOT NULL DEFAULT 0,
    missing_brand_name INTEGER NOT NULL DEFAULT 0,
    missing_generic_name INTEGER NOT NULL DEFAULT 0,
    missing_ppb_code INTEGER NOT NULL DEFAULT 0,
    missing_category INTEGER NOT NULL DEFAULT 0,
    missing_strength INTEGER NOT NULL DEFAULT 0,
    missing_route INTEGER NOT NULL DEFAULT 0,
    missing_form INTEGER NOT NULL DEFAULT 0,
    missing_manufacturer INTEGER NOT NULL DEFAULT 0,
    complete_records INTEGER NOT NULL DEFAULT 0,
    completeness_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Validity metrics
    duplicate_gtins INTEGER NOT NULL DEFAULT 0,
    invalid_gtin_format INTEGER NOT NULL DEFAULT 0,
    duplicate_product_ids INTEGER NOT NULL DEFAULT 0,
    
    -- Full report stored as JSON for detailed analysis
    full_report JSONB NOT NULL,
    
    -- Audit metadata
    triggered_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_product_quality_reports_date ON product_quality_reports(report_date DESC);
CREATE INDEX idx_product_quality_reports_score ON product_quality_reports(data_quality_score);
CREATE INDEX idx_product_quality_reports_triggered_by ON product_quality_reports(triggered_by);

-- Add comment
COMMENT ON TABLE product_quality_reports IS 
'Historical audit trail of product master data quality metrics. Tracks completeness, validity, and overall data quality scores over time.';

COMMIT;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Table created: product_quality_reports
-- Ready to store product quality audit snapshots
-- =====================================================================================

