-- =====================================================
-- Migration V14: Add Hierarchy Management & Reference Document Number Support
-- Created: December 14, 2025
-- Purpose: Support Pack/Unpack operations and Reference Document tracking
-- =====================================================

-- Add hierarchy change tracking table
CREATE TABLE IF NOT EXISTS hierarchy_changes (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL, -- 'PACK', 'PACK_LITE', 'PACK_LARGE', 'UNPACK', 'UNPACK_ALL'
  parent_sscc VARCHAR(50),
  new_sscc VARCHAR(50),
  old_sscc VARCHAR(50),
  actor_user_id UUID NOT NULL,
  actor_type VARCHAR(50), -- 'manufacturer', 'distributor'
  change_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for hierarchy_changes
CREATE INDEX idx_hierarchy_parent_sscc ON hierarchy_changes(parent_sscc);
CREATE INDEX idx_hierarchy_new_sscc ON hierarchy_changes(new_sscc);
CREATE INDEX idx_hierarchy_operation_type ON hierarchy_changes(operation_type);
CREATE INDEX idx_hierarchy_actor ON hierarchy_changes(actor_user_id);
CREATE INDEX idx_hierarchy_change_date ON hierarchy_changes(change_date DESC);

-- Add SSCC history to packages table (track SSCC reassignment)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS previous_sscc VARCHAR(50);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_packages_previous_sscc ON packages(previous_sscc);

-- Add reference document number to shipments (for Return Logistics)
ALTER TABLE shipment ADD COLUMN IF NOT EXISTS reference_document_number VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_shipment_ref_doc ON shipment(reference_document_number);

-- Add workflow status to product_destruction table
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'INITIATED';
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS initiated_by UUID;
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS completed_by UUID;
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMP;
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE product_destruction ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Indexes for product_destruction workflow
CREATE INDEX IF NOT EXISTS idx_destruction_status ON product_destruction(status);
CREATE INDEX IF NOT EXISTS idx_destruction_initiated_by ON product_destruction(initiated_by);
CREATE INDEX IF NOT EXISTS idx_destruction_approved_by ON product_destruction(approved_by);
CREATE INDEX IF NOT EXISTS idx_destruction_initiated_at ON product_destruction(initiated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE hierarchy_changes IS 'Tracks pack/unpack operations and SSCC reassignments';
COMMENT ON COLUMN hierarchy_changes.operation_type IS 'Type of hierarchy operation: PACK, PACK_LITE, PACK_LARGE, UNPACK, UNPACK_ALL';
COMMENT ON COLUMN packages.previous_sscc IS 'Previous SSCC if package was repacked';
COMMENT ON COLUMN packages.reassigned_at IS 'Timestamp when SSCC was reassigned';
COMMENT ON COLUMN shipment.reference_document_number IS 'External reference document number (PO, invoice, etc.)';
COMMENT ON COLUMN product_destruction.status IS 'Workflow status: INITIATED, PENDING_APPROVAL, APPROVED, IN_PROGRESS, COMPLETED, REJECTED';
