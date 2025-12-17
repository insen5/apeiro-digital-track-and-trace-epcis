-- Migration: Add optional SSCC fields to cases and packages tables
-- Date: 2024
-- Description: Adds SSCC support for carton-level and pallet-level tracking
--              to support disaggregation/re-cartonization scenarios

-- Add SSCC fields to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS sscc_barcode VARCHAR(18) NULL,
ADD COLUMN IF NOT EXISTS sscc_generated_at TIMESTAMP NULL;

-- Add SSCC fields to case table
ALTER TABLE "case" 
ADD COLUMN IF NOT EXISTS sscc_barcode VARCHAR(18) NULL,
ADD COLUMN IF NOT EXISTS sscc_generated_at TIMESTAMP NULL;

-- Create indexes for SSCC lookups
CREATE INDEX IF NOT EXISTS idx_packages_sscc_barcode ON packages(sscc_barcode);
CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_sscc_unique ON packages(sscc_barcode) 
WHERE sscc_barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_sscc_barcode ON "case"(sscc_barcode);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_sscc_unique ON "case"(sscc_barcode) 
WHERE sscc_barcode IS NOT NULL;

-- Add comments
COMMENT ON COLUMN packages.sscc_barcode IS 'Optional SSCC for pallet-level tracking (when pallet is not the highest aggregation level)';
COMMENT ON COLUMN packages.sscc_generated_at IS 'Timestamp when SSCC was generated for this package';
COMMENT ON COLUMN "case".sscc_barcode IS 'Optional SSCC for carton-level tracking (for disaggregation/re-cartonization scenarios)';
COMMENT ON COLUMN "case".sscc_generated_at IS 'Timestamp when SSCC was generated for this case/carton';

