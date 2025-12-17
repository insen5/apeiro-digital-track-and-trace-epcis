-- Kenya TNT System - Consolidated Database Schema
-- Single PostgreSQL database for all modules

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- USERS TABLE (from auth service)
-- ============================================
CREATE TYPE user_role AS ENUM ('dha', 'user_facility', 'manufacturer', 'cpa');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),  -- Plain text for demo, use bcrypt in production
  role user_role NOT NULL DEFAULT 'user_facility',
  role_id INTEGER NOT NULL,
  gln_number VARCHAR(50),
  organization VARCHAR(255) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_gln_number ON users(gln_number);

-- ============================================
-- PRODUCTS TABLE REMOVED (Legacy - replaced by ppb_products)
-- ============================================
-- The legacy products table has been removed.
-- All product references now use ppb_products table.

-- ============================================
-- BATCHES TABLE (from manufacturer/supplier services)
-- ============================================
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE CASCADE,
  batchno VARCHAR(255) NOT NULL UNIQUE,
  expiry DATE NOT NULL,
  qty NUMERIC(15,2) NOT NULL,  -- FIXED: Changed from VARCHAR to NUMERIC
  sent_qty NUMERIC(15,2) DEFAULT 0,  -- FIXED: Changed from VARCHAR to NUMERIC
  is_enabled BOOLEAN DEFAULT TRUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  early_warning_notified BOOLEAN DEFAULT FALSE,
  early_warning_date TIMESTAMP,
  secondary_notified BOOLEAN DEFAULT FALSE,
  secondary_date TIMESTAMP,
  final_notified BOOLEAN DEFAULT FALSE,
  final_date TIMESTAMP,
  post_expiry_notified BOOLEAN DEFAULT FALSE,
  post_expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_batches_batchno ON batches(batchno);
CREATE INDEX idx_batches_product_id ON batches(product_id);
CREATE INDEX idx_batches_user_id ON batches(user_id);
CREATE INDEX idx_batches_expiry ON batches(expiry);
CREATE INDEX idx_batches_is_enabled ON batches(is_enabled);

-- ============================================
-- SHIPMENTS TABLE (from manufacturer/supplier services)
-- ============================================
CREATE TABLE shipment (
  id SERIAL PRIMARY KEY,
  customer VARCHAR(255) NOT NULL,
  pickup_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  destination_address VARCHAR(255) NOT NULL,
  carrier VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID,
  is_dispatched BOOLEAN DEFAULT FALSE,
  sscc_barcode VARCHAR(50) NOT NULL,
  event_id VARCHAR(255),
  parent_sscc_barcode VARCHAR(50),  -- For supplier/distributor shipments
  receive_event_id VARCHAR(255),    -- For supplier/distributor shipments
  is_deleted BOOLEAN DEFAULT FALSE,
  -- PostGIS location columns
  pickup_location_point POINT,      -- Geographic coordinates
  destination_location_point POINT, -- Geographic coordinates
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipment_user_id ON shipment(user_id);
CREATE INDEX idx_shipment_sscc_barcode ON shipment(sscc_barcode);
CREATE INDEX idx_shipment_parent_sscc ON shipment(parent_sscc_barcode);
CREATE INDEX idx_shipment_pickup_date ON shipment(pickup_date);
CREATE INDEX idx_shipment_is_dispatched ON shipment(is_dispatched);
CREATE INDEX idx_shipment_customer_id ON shipment(customer_id);
-- Spatial indexes for PostGIS
CREATE INDEX idx_shipment_pickup_location ON shipment USING GIST(pickup_location_point);
CREATE INDEX idx_shipment_destination_location ON shipment USING GIST(destination_location_point);

-- ============================================
-- PACKAGES TABLE
-- ============================================
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  shipment_id INTEGER NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(255),
  is_dispatched BOOLEAN DEFAULT FALSE,
  -- Optional SSCC for pallet-level tracking (when pallet is not the highest aggregation level)
  sscc_barcode VARCHAR(18) NULL,
  sscc_generated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_packages_shipment_id ON packages(shipment_id);
CREATE INDEX idx_packages_user_id ON packages(user_id);
CREATE INDEX idx_packages_event_id ON packages(event_id);
CREATE INDEX idx_packages_sscc_barcode ON packages(sscc_barcode);
CREATE UNIQUE INDEX idx_packages_sscc_unique ON packages(sscc_barcode) WHERE sscc_barcode IS NOT NULL;

-- ============================================
-- CASES TABLE
-- ============================================
CREATE TABLE "case" (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(255),
  is_dispatched BOOLEAN DEFAULT FALSE,
  -- Optional SSCC for carton-level tracking (for disaggregation/re-cartonization scenarios)
  sscc_barcode VARCHAR(18) NULL,
  sscc_generated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, label),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_case_package_id ON "case"(package_id);
CREATE INDEX idx_case_user_id ON "case"(user_id);
CREATE INDEX idx_case_event_id ON "case"(event_id);
CREATE INDEX idx_case_sscc_barcode ON "case"(sscc_barcode);
CREATE UNIQUE INDEX idx_case_sscc_unique ON "case"(sscc_barcode) WHERE sscc_barcode IS NOT NULL;

-- ============================================
-- CASES_PRODUCTS JUNCTION TABLE
-- ============================================
CREATE TABLE cases_products (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES "case"(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  qty NUMERIC(15,2) NOT NULL,  -- FIXED: Changed from VARCHAR to NUMERIC
  from_number INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE INDEX idx_cases_products_case_id ON cases_products(case_id);
CREATE INDEX idx_cases_products_batch_id ON cases_products(batch_id);
CREATE INDEX idx_cases_products_product_id ON cases_products(product_id);

-- ============================================
-- RECALL REQUESTS TABLE (from PPB service)
-- ============================================
CREATE TYPE recall_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE recall_requests (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status recall_status DEFAULT 'PENDING',
  transporter VARCHAR(255) NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  pickup_date DATE NOT NULL,
  delivery_location VARCHAR(255) NOT NULL,
  delivery_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recall_requests_batch_id ON recall_requests(batch_id);
CREATE INDEX idx_recall_requests_status ON recall_requests(status);

-- ============================================
-- BATCH NOTIFICATION SETTINGS TABLE
-- ============================================
CREATE TABLE batch_notification_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  early_warning_enabled BOOLEAN DEFAULT FALSE,
  secondary_warning_enabled BOOLEAN DEFAULT FALSE,
  final_warning_enabled BOOLEAN DEFAULT FALSE,
  post_expiry_warning_enabled BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_batch_notification_settings_user_id ON batch_notification_settings(user_id);

-- ============================================
-- PPB ACTIVITY LOGS TABLE (from notification service)
-- ============================================
CREATE TABLE ppb_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ppb_activity_logs_user_id ON ppb_activity_logs(user_id);
CREATE INDEX idx_ppb_activity_logs_entity ON ppb_activity_logs(entity_type, entity_id);
CREATE INDEX idx_ppb_activity_logs_created_at ON ppb_activity_logs(created_at);

-- ============================================
-- EPCIS EVENT SUMMARY TABLE REMOVED (Legacy - replaced by normalized epcis_events)
-- ============================================
-- The denormalized epcis_event_summary table has been removed.
-- All EPCIS event data now uses the normalized epcis_events and epcis_event_epcs tables.

-- ============================================
-- TABLE AND COLUMN COMMENTS
-- ============================================

-- USERS TABLE
COMMENT ON TABLE users IS 'Centralized user accounts for all system actors (PPB Regulators, Manufacturers, Distributors, Facilities). Consolidated from epcis-auth-service.';
COMMENT ON COLUMN users.id IS 'Primary key: UUID for distributed system compatibility';
COMMENT ON COLUMN users.email IS 'Unique email address for authentication and communication';
COMMENT ON COLUMN users.role IS 'User role enumeration: dha (Department of Health Administration), user_facility (Healthcare facilities), manufacturer (Pharmaceutical manufacturers), cpa (Community Pharmacist Association/Distributors)';
COMMENT ON COLUMN users.role_id IS 'Additional role identifier, may reference external role management systems';
COMMENT ON COLUMN users.gln_number IS 'GS1 Global Location Number (13 digits) - unique identifier for physical locations';
COMMENT ON COLUMN users.organization IS 'Legal name of the organization/company';
COMMENT ON COLUMN users.is_deleted IS 'Soft delete flag - preserves data integrity for audit trails';
COMMENT ON COLUMN users.refresh_token IS 'JWT refresh token for maintaining user sessions';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user account was last updated';

-- PRODUCTS TABLE REMOVED (Legacy - replaced by ppb_products)

-- BATCHES TABLE
COMMENT ON TABLE batches IS 'Product batches with expiry tracking and automated notification system. Manufacturers create batches linked to products. Consolidated from epcis-manufacturer-service and epcis-supplier-service.';
COMMENT ON COLUMN batches.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN batches.product_id IS 'Foreign key: Product this batch belongs to';
COMMENT ON COLUMN batches.batchno IS 'GS1-compliant batch/lot number - must be unique globally. Format: alphanumeric string.';
COMMENT ON COLUMN batches.expiry IS 'Expiry date - critical for pharmaceutical safety. Used for expiry notifications and recall eligibility.';
COMMENT ON COLUMN batches.qty IS 'Total batch quantity (NUMERIC type for mathematical operations and analytics). Unit depends on product (e.g., tablets, vials, bottles). FIXED: Changed from VARCHAR to NUMERIC.';
COMMENT ON COLUMN batches.sent_qty IS 'Cumulative quantity shipped from this batch (NUMERIC type). Used to track remaining inventory: remaining = qty - sent_qty. FIXED: Changed from VARCHAR to NUMERIC.';
COMMENT ON COLUMN batches.is_enabled IS 'Batch status - disabled batches cannot be used in new shipments but existing data is preserved';
COMMENT ON COLUMN batches.user_id IS 'Foreign key: Manufacturer user who created this batch';
COMMENT ON COLUMN batches.early_warning_notified IS 'Flag indicating early warning notification was sent (typically 90 days before expiry)';
COMMENT ON COLUMN batches.early_warning_date IS 'Timestamp when early warning notification was sent';
COMMENT ON COLUMN batches.secondary_notified IS 'Flag indicating secondary warning notification was sent (typically 60 days before expiry)';
COMMENT ON COLUMN batches.secondary_date IS 'Timestamp when secondary warning notification was sent';
COMMENT ON COLUMN batches.final_notified IS 'Flag indicating final warning notification was sent (typically 30 days before expiry)';
COMMENT ON COLUMN batches.final_date IS 'Timestamp when final warning notification was sent';
COMMENT ON COLUMN batches.post_expiry_notified IS 'Flag indicating post-expiry notification was sent (after expiry date)';
COMMENT ON COLUMN batches.post_expiry_date IS 'Timestamp when post-expiry notification was sent';
COMMENT ON COLUMN batches.created_at IS 'Timestamp when batch was created';
COMMENT ON COLUMN batches.updated_at IS 'Timestamp when batch was last updated';

-- SHIPMENT TABLE
COMMENT ON TABLE shipment IS 'Shipment tracking with SSCC and EPCIS integration. Supports manufacturer-to-distributor and distributor-to-facility shipments. Consolidated from epcis-manufacturer-service and epcis-supplier-service.';
COMMENT ON COLUMN shipment.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN shipment.customer IS 'Customer name (distributor or facility receiving the shipment)';
COMMENT ON COLUMN shipment.pickup_date IS 'Scheduled pickup date from origin';
COMMENT ON COLUMN shipment.expected_delivery_date IS 'Expected delivery date to destination';
COMMENT ON COLUMN shipment.pickup_location IS 'Human-readable pickup address (e.g., "123 Main St, Nairobi")';
COMMENT ON COLUMN shipment.destination_address IS 'Human-readable destination address';
COMMENT ON COLUMN shipment.carrier IS 'Shipping carrier/transport company name';
COMMENT ON COLUMN shipment.user_id IS 'Foreign key: Manufacturer or Distributor user who created this shipment';
COMMENT ON COLUMN shipment.customer_id IS 'Optional: UUID reference to customer user (if customer is registered in system)';
COMMENT ON COLUMN shipment.is_dispatched IS 'Flag indicating shipment has been dispatched (triggers EPCIS AggregationEvent creation)';
COMMENT ON COLUMN shipment.sscc_barcode IS 'GS1 Serial Shipping Container Code (18 digits) - unique identifier for this shipment container. Used for journey tracking.';
COMMENT ON COLUMN shipment.event_id IS 'EPCIS event ID - links to AggregationEvent in EPCIS service (OpenSearch). Used for querying full event details.';
COMMENT ON COLUMN shipment.parent_sscc_barcode IS 'Parent SSCC - for distributor shipments that break down a manufacturer shipment. Enables supply chain traceability.';
COMMENT ON COLUMN shipment.receive_event_id IS 'EPCIS receive event ID - for distributor shipments that received a parent shipment. Links to EPCIS ObjectEvent.';
COMMENT ON COLUMN shipment.is_deleted IS 'Soft delete flag - preserves data integrity for audit trails';
COMMENT ON COLUMN shipment.pickup_location_point IS 'PostGIS POINT geometry for pickup location (latitude, longitude). Enables geographic queries and distance calculations.';
COMMENT ON COLUMN shipment.destination_location_point IS 'PostGIS POINT geometry for destination location (latitude, longitude). Enables geographic queries and distance calculations.';
COMMENT ON COLUMN shipment.created_at IS 'Timestamp when shipment was created';
COMMENT ON COLUMN shipment.updated_at IS 'Timestamp when shipment was last updated';

-- PACKAGES TABLE
COMMENT ON TABLE packages IS 'Packages within shipments - intermediate aggregation level. Links shipments to cases. Hierarchy: Shipment → Packages → Cases → Products (Batches).';
COMMENT ON COLUMN packages.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN packages.label IS 'Package label/identifier (human-readable or barcode)';
COMMENT ON COLUMN packages.shipment_id IS 'Foreign key: Shipment this package belongs to';
COMMENT ON COLUMN packages.user_id IS 'Foreign key: Manufacturer user who created this package';
COMMENT ON COLUMN packages.event_id IS 'EPCIS event ID - links to AggregationEvent in EPCIS service. Used for querying full event details. Must be unique per user.';
COMMENT ON COLUMN packages.is_dispatched IS 'Flag indicating package has been dispatched (triggers EPCIS AggregationEvent creation)';
COMMENT ON COLUMN packages.created_at IS 'Timestamp when package was created';
COMMENT ON COLUMN packages.updated_at IS 'Timestamp when package was last updated';

-- CASE TABLE
COMMENT ON TABLE "case" IS 'Cases within packages - product aggregation level. Links packages to products/batches via cases_products junction table. Hierarchy: Shipment → Packages → Cases → Products (Batches).';
COMMENT ON COLUMN "case".id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN "case".label IS 'Case label/identifier (human-readable or barcode). Must be unique per user.';
COMMENT ON COLUMN "case".package_id IS 'Foreign key: Package this case belongs to';
COMMENT ON COLUMN "case".user_id IS 'Foreign key: Manufacturer user who created this case';
COMMENT ON COLUMN "case".event_id IS 'EPCIS event ID - links to AggregationEvent in EPCIS service. Used for querying full event details. Must be unique per user.';
COMMENT ON COLUMN "case".is_dispatched IS 'Flag indicating case has been dispatched (triggers EPCIS AggregationEvent creation)';
COMMENT ON COLUMN "case".created_at IS 'Timestamp when case was created';
COMMENT ON COLUMN "case".updated_at IS 'Timestamp when case was last updated';

-- CASES_PRODUCTS TABLE
COMMENT ON TABLE cases_products IS 'Junction table linking cases to products (via batches) with quantities. Enables case aggregation with multiple products/batches.';
COMMENT ON COLUMN cases_products.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN cases_products.case_id IS 'Foreign key: Case this product/batch belongs to';
COMMENT ON COLUMN cases_products.product_id IS 'Foreign key: Product in this case';
COMMENT ON COLUMN cases_products.batch_id IS 'Foreign key: Batch of product in this case';
COMMENT ON COLUMN cases_products.qty IS 'Quantity of product/batch in this case (NUMERIC type for mathematical operations). Unit depends on product. FIXED: Changed from VARCHAR to NUMERIC.';
COMMENT ON COLUMN cases_products.from_number IS 'Starting serial number for SGTIN generation (GS1 Serialized Global Trade Item Number)';
COMMENT ON COLUMN cases_products.count IS 'Number of serialized items for SGTIN generation (determines range: from_number to from_number + count - 1)';

-- RECALL_REQUESTS TABLE
COMMENT ON TABLE recall_requests IS 'Product recall management - PPB Regulator can initiate recalls for specific batches. Tracks recall status and transportation. Consolidated from epcis-ppb-service.';
COMMENT ON TYPE recall_status IS 'Recall request status enumeration: PENDING (created, awaiting action), IN_PROGRESS (transportation arranged), COMPLETED (products returned), CANCELLED (recall cancelled)';
COMMENT ON COLUMN recall_requests.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN recall_requests.batch_id IS 'Foreign key: Batch being recalled (all products from this batch must be recalled)';
COMMENT ON COLUMN recall_requests.reason IS 'Reason for recall (e.g., "Safety concern", "Quality issue", "Regulatory violation")';
COMMENT ON COLUMN recall_requests.status IS 'Current recall status - tracks recall lifecycle from creation to completion';
COMMENT ON COLUMN recall_requests.transporter IS 'Transport company responsible for collecting and delivering recalled products';
COMMENT ON COLUMN recall_requests.pickup_location IS 'Location where recalled products will be collected';
COMMENT ON COLUMN recall_requests.pickup_date IS 'Scheduled date for collecting recalled products';
COMMENT ON COLUMN recall_requests.delivery_location IS 'Location where recalled products will be delivered (typically manufacturer or disposal facility)';
COMMENT ON COLUMN recall_requests.delivery_date IS 'Scheduled date for delivering recalled products';
COMMENT ON COLUMN recall_requests.created_at IS 'Timestamp when recall request was created';
COMMENT ON COLUMN recall_requests.updated_at IS 'Timestamp when recall request was last updated';

-- BATCH_NOTIFICATION_SETTINGS TABLE
COMMENT ON TABLE batch_notification_settings IS 'User preferences for batch expiry notifications. Each user can configure which notification stages they want to receive.';
COMMENT ON COLUMN batch_notification_settings.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN batch_notification_settings.user_id IS 'Foreign key: User these notification settings belong to';
COMMENT ON COLUMN batch_notification_settings.early_warning_enabled IS 'Enable early warning notifications (typically 90 days before batch expiry)';
COMMENT ON COLUMN batch_notification_settings.secondary_warning_enabled IS 'Enable secondary warning notifications (typically 60 days before batch expiry)';
COMMENT ON COLUMN batch_notification_settings.final_warning_enabled IS 'Enable final warning notifications (typically 30 days before batch expiry)';
COMMENT ON COLUMN batch_notification_settings.post_expiry_warning_enabled IS 'Enable post-expiry notifications (after batch expiry date)';

-- PPB_ACTIVITY_LOGS TABLE
COMMENT ON TABLE ppb_activity_logs IS 'Audit trail for PPB Regulator activities. Tracks all actions performed by PPB users for compliance and auditing. Consolidated from notification service.';
COMMENT ON COLUMN ppb_activity_logs.id IS 'Primary key: Auto-incrementing integer';
COMMENT ON COLUMN ppb_activity_logs.user_id IS 'Foreign key: PPB user who performed the action (nullable for system-generated actions)';
COMMENT ON COLUMN ppb_activity_logs.action IS 'Action type identifier (e.g., "PRODUCT_CREATED", "RECALL_INITIATED", "JOURNEY_VIEWED", "BATCH_EXPIRED")';
COMMENT ON COLUMN ppb_activity_logs.entity_type IS 'Entity type being acted upon (e.g., "product", "batch", "recall", "shipment", "user")';
COMMENT ON COLUMN ppb_activity_logs.entity_id IS 'Entity ID being acted upon (references entity in respective table based on entity_type)';
COMMENT ON COLUMN ppb_activity_logs.details IS 'Flexible JSON structure for action-specific details (e.g., old values, new values, error messages)';
COMMENT ON COLUMN ppb_activity_logs.created_at IS 'Timestamp when action was performed';

-- ============================================
-- PPB PRODUCT TO PROGRAM MAPPING TABLE
-- ============================================
CREATE TABLE ppb_product_to_program_mapping (
  id SERIAL PRIMARY KEY,
  ppb_product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE CASCADE,
  program_code VARCHAR(50) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ppb_product_id, program_code)
);

CREATE INDEX idx_ppb_product_to_program_mapping_product_id ON ppb_product_to_program_mapping(ppb_product_id);
CREATE INDEX idx_ppb_product_to_program_mapping_code ON ppb_product_to_program_mapping(program_code);

COMMENT ON TABLE ppb_product_to_program_mapping IS 'Many-to-many relationship: PPB Products to Programs (e.g., Essential Commodities, ARV). Maps products to various healthcare programs.';
COMMENT ON COLUMN ppb_product_to_program_mapping.ppb_product_id IS 'Foreign key to ppb_products table';
COMMENT ON COLUMN ppb_product_to_program_mapping.program_code IS 'Program code (e.g., "ESSENTIAL", "ARV", "MALARIA")';
COMMENT ON COLUMN ppb_product_to_program_mapping.program_name IS 'Program name (e.g., "Essential Commodities", "Antiretroviral Therapy")';

-- EPCIS_EVENT_SUMMARY TABLE REMOVED (Legacy - replaced by normalized epcis_events)

