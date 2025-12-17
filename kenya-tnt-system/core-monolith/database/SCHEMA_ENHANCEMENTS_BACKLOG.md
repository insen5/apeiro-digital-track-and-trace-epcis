# Schema Enhancements Backlog

## Overview
This document tracks potential enhancements to the database schema based on:
- Missing fields identified from UI forms and business requirements
- Analytics and reporting needs
- Regulatory compliance requirements
- Integration with external systems
- **Level 5 Track & Trace (L5 TNT) analytics requirements**

---

## ✅ Recently Completed (2025-12-07)

### Facility Integration API - Location Coordinates Support

**Status**: ✅ **COMPLETED**

**Enhancement**: Enhanced location coordinate handling in Facility Integration API to support multiple input formats for FLMIS business events.

**Implementation Details**:
- **Location DTO Enhancement**: Updated `LocationDto` to accept coordinates in multiple formats:
  - Object format: `{ latitude, longitude, accuracyMeters }`
  - Comma-separated string: `"latitude,longitude"` or `"latitude,longitude,accuracy"`
  - Null values: `null` (for events without location data)
  
- **Service Layer Updates**:
  - Enhanced `getLocationCoordinates()` method in `FacilityIntegrationService` to parse both object and string formats
  - Updated `buildReadPoint()` method to use the flexible coordinate parser
  - Added error handling and logging for invalid coordinate formats
  
- **Supported Event Types**:
  - ✅ Receive events (opened SSCC with partial SGTIN scans)
  - ✅ Receive events (sealed SSCC bulk receive)
  - ✅ Dispense events
  - ✅ Adjust events
  - ✅ Stock count events
  - ✅ Return events
  - ✅ Recall events

**Files Modified**:
- `kenya-tnt-system/core-monolith/src/modules/integration/facility/dto/lmis-event.dto.ts`
- `kenya-tnt-system/core-monolith/src/modules/integration/facility/facility-integration.service.ts`

**Impact**: 
- ✅ Improved compatibility with FLMIS systems that send coordinates as comma-separated strings
- ✅ Maintains backward compatibility with object format
- ✅ Supports geographic coordinates for location tracking (addresses L5 TNT requirement for "Geographic coordinates for location tracking")

**Related Backlog Item**: 
- Addresses data requirement: "Geographic coordinates for location tracking" (Section A. Journey Tracking Analytics, line 58)

## Priority Classification
- **P0**: Critical - Required for core functionality and L5 TNT compliance
- **P1**: High - Important for production readiness
- **P2**: Medium - Nice to have, improves UX/analytics
- **P3**: Low - Future enhancement

---

## L5 TNT Analytics Requirements Assessment

### Business Context

Level 5 Track & Trace (L5 TNT) requires comprehensive analytics capabilities to enable:
- **Regulatory Compliance**: Generate reports for KRA, KEBS, PPB
- **Supply Chain Visibility**: Track products from manufacturing to consumption
- **Recall Management**: Effective recall tracking and completion monitoring
- **Counterfeit Detection**: Product verification and authentication analytics
- **Operational Efficiency**: Actor performance metrics and bottleneck identification
- **Compliance Reporting**: Permit tracking, license validity, manufacturing origin

### Current Readiness: ~25%

The current database structure supports basic operations but lacks critical analytics infrastructure for L5 TNT compliance.

---

## Analytics Cases for L5 TNT

### A. Journey Tracking Analytics

**Business Need**: Track complete product journey from manufacturing to consumption

**Analytics Requirements**:
- Product journey by EPC (SGTIN/SSCC)
- Journey timeline (manufacturing → consumption)
- Transit time analysis
- Location-based journey tracking
- Actor-based journey (manufacturer → supplier → facility)
- Journey completeness (missing events detection)

**Current State**: ⚠️ Partial (40%)
- Can query EPCIS events but missing actor context
- No journey completeness validation

**Data Requirements**:
- Actor context in events (manufacturer, supplier, facility GLNs)
- Source entity tracking (consignment, shipment, batch IDs)
- Geographic coordinates for location tracking ✅ **API Support Added** (2025-12-07) - Facility Integration API now accepts coordinates in object or comma-separated string format
- Event time series for timeline analysis

---

### B. Recall Management Analytics

**Business Need**: Monitor recall effectiveness and completion

**Analytics Requirements**:
- Recall effectiveness (products recalled vs total affected)
- Recall completion rate by batch/product
- Recall timeline (initiation → completion)
- Recall by severity/priority
- Recall by actor (manufacturer, supplier, facility)
- Recall cost analysis
- Recall status distribution

**Current State**: ⚠️ Partial (50%)
- Basic recall tracking exists
- Missing: priority, severity, affected_quantity, completion tracking

**Data Requirements**:
- Recall priority and severity fields
- Affected quantity tracking
- Recall status history
- Completion verification data

---

### C. Compliance Reporting Analytics

**Business Need**: Generate regulatory compliance reports for government authorities

**Analytics Requirements**:
- Regulatory compliance reports (KRA, KEBS, PPB)
- Batch expiry compliance
- Permit compliance (SHP/LSP)
- Manufacturing origin tracking (Import vs Domestic)
- Product registration compliance
- License validity tracking

**Current State**: ❌ Not Ready (20%)
- Basic product/batch data exists
- Missing: permit fields, manufacturing origin, license tracking

**Data Requirements**:
- Permit numbers (SHP/LSP) in batches/consignments
- Manufacturing origin field (Import/Domestic)
- Product registration numbers
- License validity dates
- Compliance status fields

---

### D. Product Status Analytics

**Business Need**: Track product status changes throughout lifecycle

**Analytics Requirements**:
- Status distribution (Active, Lost, Stolen, Damaged, Sample, Export, Dispensing)
- Status change timeline
- Status by product/batch
- Status by actor
- Status-based inventory tracking

**Current State**: ❌ Not Ready (0%)
- No product status tracking table exists

**Data Requirements**:
- `product_status` table with status history
- Status change timestamps
- Actor who changed status
- Previous status tracking

---

### E. Facility Operations Analytics

**Business Need**: Monitor facility receiving, dispensing, and inventory operations

**Analytics Requirements**:
- Receiving analytics (quantity, products, batches)
- Dispensing analytics (quantity, products, patients)
- Product consumption patterns
- ~~Inventory levels by facility~~ (NOT PLANNED - out of scope)
- ~~Facility performance metrics~~ (NOT PLANNED - out of scope)

**Current State**: ❌ Not Ready (0%)
- No facility-specific tracking tables

**Data Requirements**:
- `facility_receiving` table
- `facility_dispensing` table
- `facility_inventory` table
- Patient tracking (optional, for dispensing)

---

### F. Verification Analytics

**Business Need**: Track product verifications and detect counterfeits

**Analytics Requirements**:
- Verification count by product/batch
- Verification success/failure rate
- Counterfeit detection analytics
- Verification by location
- Verification timeline

**Current State**: ❌ Not Ready (0%)
- No verification tracking table

**Data Requirements**:
- `product_verifications` table
- Verification result (VALID, INVALID, COUNTERFEIT, EXPIRED)
- Verification location and timestamp
- Consumer vs. system verifications

---

### G. Destruction Analytics

**Business Need**: Track product destruction for regulatory compliance

**Analytics Requirements**:
- Destruction quantity by product/batch
- Destruction by reason
- Destruction by facility
- Destruction timeline
- Destruction compliance reporting

**Current State**: ❌ Not Ready (0%)
- No destruction tracking table

**Data Requirements**:
- `product_destruction` table
- Destruction reason tracking
- Compliance document links
- Witness information

---

### H. Return Logistics Analytics

**Business Need**: Track reverse logistics (returns from facilities to suppliers/manufacturers)

**Analytics Requirements**:
- Return quantity by product/batch
- Return reasons analysis
- Return processing time
- Return by actor (facility → supplier → manufacturer)
- Return rate by product

**Current State**: ❌ Not Ready (0%)
- No return logistics tables

**Data Requirements**:
- `product_returns` table
- Return type (RETURN_RECEIVING, RETURN_SHIPPING)
- Return reason tracking
- From/to actor tracking

---

### I. Actor-Based Analytics

**Business Need**: Performance metrics for each supply chain actor

**Analytics Requirements**:
- Manufacturer performance (batches created, shipments dispatched)
- Supplier performance (receiving, forwarding, returns)
- Facility performance (receiving, dispensing, inventory)
- Actor GLN-based analytics
- Actor organization-based analytics

**Current State**: ❌ Not Ready (0%)
- Missing actor context in events
- No actor performance aggregation

**Data Requirements**:
- Actor context in all events (type, user_id, GLN, organization)
- Actor dimension tables for star schema
- Performance metrics aggregation

---

### J. Time-Series Analytics

**Business Need**: Trend analysis and pattern detection

**Analytics Requirements**:
- Daily/weekly/monthly shipment trends
- Batch expiry trends
- Product movement trends
- Event volume trends
- Seasonal patterns

**Current State**: ⚠️ Partial (30%)
- Dates indexed but no partitioning
- No pre-aggregated time-series views

**Data Requirements**:
- Time dimension table
- Date partitioning for large tables
- Materialized views for time-series aggregation

---

### K. Geographic Analytics

**Business Need**: Location-based supply chain analysis

**Analytics Requirements**:
- Shipment routes (pickup → destination)
- Location-based event density
- Regional distribution patterns
- Facility coverage analysis
- Supply chain network visualization

**Current State**: ⚠️ Partial (40%)
- PostGIS enabled but limited usage
- Geographic coordinates in some tables

**Data Requirements**:
- PostGIS POINT columns for locations
- Geographic indexes
- Location-based aggregation views

---

### L. Product Lifecycle Analytics

**Business Need**: Understand product velocity and identify bottlenecks

**Analytics Requirements**:
- Product lifecycle duration (manufacturing → consumption)
- Average time in each stage
- Bottleneck identification
- Product velocity analysis

**Current State**: ⚠️ Partial (40%)
- Can calculate from events but slow
- No pre-aggregated lifecycle metrics

**Data Requirements**:
- Event timeline tracking
- Stage duration calculations
- Materialized views for lifecycle metrics

---

## Current Data Structure Readiness

### ✅ Ready (Basic Support)
- **Basic Counts**: products, batches, shipments
- **Batch Expiry Tracking**: expiry dates indexed
- **Shipment Status**: basic status tracking
- **Recall Status**: basic recall tracking
- **EPCIS Events**: event summary table exists

### ⚠️ Partially Ready (Needs Enhancement)
- **Journey Tracking**: can query EPCIS but missing actor context
- **Actor Identification**: missing in `epcis_event_summary`
- **Time-Series**: dates indexed but no partitioning
- **Geographic**: PostGIS enabled but limited usage

### ❌ Not Ready (Missing)
- **Product Status Tracking**: no status table/fields
- **Destruction Tracking**: no destruction table
- **Return Logistics**: no return tables
- **Verification Tracking**: no verification table
- **Facility Operations**: no facility-specific tables
- **Compliance Reporting**: missing permit, registration fields
- **Materialized Views**: none
- **Star Schema**: no fact/dimension tables
- **Actor Context**: missing in events

---

## Readiness Score by Category

| Analytics Category | Readiness | Score | Priority |
|-------------------|-----------|-------|----------|
| Basic Counts | ✅ Ready | 100% | - |
| Journey Tracking | ⚠️ Partial | 40% | P0 |
| Recall Analytics | ⚠️ Partial | 50% | P0 |
| Compliance Reporting | ❌ Not Ready | 20% | P0 |
| Product Status | ❌ Not Ready | 0% | P0 |
| Facility Operations | ❌ Not Ready | 0% | P0 |
| Verification | ❌ Not Ready | 0% | P0 |
| Destruction | ❌ Not Ready | 0% | P0 |
| Return Logistics | ❌ Not Ready | 0% | P0 |
| Actor-Based Analytics | ❌ Not Ready | 0% | P0 |
| Time-Series Analytics | ⚠️ Partial | 30% | P1 |
| Geographic Analytics | ⚠️ Partial | 40% | P1 |
| Product Lifecycle | ⚠️ Partial | 40% | P1 |
| **Overall Readiness** | ⚠️ Partial | **25%** | - |

---

## Critical Gaps for L5 TNT Analytics

### Gap 1: Actor Context in Events (P0 - CRITICAL)
**Problem**: Cannot identify which actor (manufacturer, supplier, facility) created an event

**Impact**: 
- Cannot generate actor-based analytics
- Cannot track actor performance
- Cannot filter events by actor
- Cannot generate actor-specific reports

**Solution**: Add actor context fields to `epcis_event_summary` (see Section 8)

---

### Gap 2: Product Status Tracking (P0 - CRITICAL)
**Problem**: No way to track product status changes (Lost, Stolen, Damaged, etc.)

**Impact**:
- Cannot track products that deviate from normal flow
- Cannot generate status-based reports
- Cannot monitor product lifecycle status

**Solution**: Create `product_status` table (see Section 9.1)

---

### Gap 3: Destruction Tracking (P0 - CRITICAL)
**Problem**: No way to track product destruction for regulatory compliance

**Impact**:
- Cannot comply with destruction reporting requirements
- Cannot track destruction reasons
- Cannot link destruction to compliance documents

**Solution**: Create `product_destruction` table (see Section 9.2)

---

### Gap 4: Return Logistics (P0 - CRITICAL)
**Problem**: No way to track reverse logistics (returns)

**Impact**:
- Cannot handle product returns
- Cannot track return reasons
- Cannot analyze return patterns

**Solution**: Create `product_returns` table (see Section 9.3)

---

### Gap 5: Verification Tracking (P0 - CRITICAL)
**Problem**: No way to track product verifications and counterfeit detection

**Impact**:
- Cannot track verification patterns
- Cannot detect counterfeit trends
- Cannot generate verification reports

**Solution**: Create `product_verifications` table (see Section 9.4)

---

### Gap 6: Facility Operations (P0 - CRITICAL)
**Problem**: No way to track facility receiving, dispensing, and inventory

**Impact**:
- Cannot track point of consumption (Level 5 requirement)
- Cannot monitor facility operations
- Cannot track inventory levels

**Solution**: Create `facility_receiving`, `facility_dispensing`, `facility_inventory` tables (see Section 9.5-9.7)

---

### Gap 7: Materialized Views (P1 - HIGH)
**Problem**: No pre-aggregated views for fast analytics queries

**Impact**:
- Slow dashboard loading
- Expensive queries on large datasets
- Poor user experience

**Solution**: Create materialized views (see Section 11.1)

---

### Gap 8: Star Schema (P2 - MEDIUM)
**Problem**: No fact/dimension tables for OLAP-style analytics

**Impact**:
- Complex queries require multiple joins
- Difficult to build analytics dashboards
- Limited analytics flexibility

**Solution**: Create star schema (see Section 11.2)

---

## Recommendations

### Immediate (P0 - Critical for L5 TNT)
1. ✅ Add actor context to `epcis_event_summary` (Section 8)
2. ✅ Create product status tracking table (Section 9.1)
3. ✅ Create verification tracking table (Section 9.4)
4. ✅ Create facility operations tables (Section 9.5-9.7)
5. ✅ Create destruction tracking table (Section 9.2)
6. ✅ Create return logistics tables (Section 9.3)

### High Priority (P1)
7. ✅ Create materialized views for common queries (Section 11.1)
8. ✅ Normalize event summary table for faster writes (Section 8.1)
9. ✅ Add missing fields to existing tables (Sections 1-7)
10. Implement time-series partitioning

### Medium Priority (P2)
11. ✅ Create star schema (fact/dimension tables) (Section 11.2)
12. Add geographic analytics indexes
13. Create compliance reporting views

---

## Conclusion

**Current Readiness: ~25% for L5 TNT Analytics**

The current database structure supports basic operations but lacks:
- ❌ Actor context in events (critical for actor-based analytics)
- ❌ Product lifecycle tracking (status, destruction, returns)
- ❌ Facility operations tracking (point of consumption)
- ❌ Verification analytics (counterfeit detection)
- ❌ Performance optimizations (materialized views, star schema)

**To reach L5 TNT readiness**: Implement all P0 items (Sections 8-9) and P1 items (Section 11.1, 8.1).

---

---

## 1. USERS Table Enhancements

### Missing Fields

- **phone_number** (P1) - For SMS notifications and contact
- **status** (P1) - User status enum: 'ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'
- **last_login** (P2) - Track last login timestamp for security monitoring
- **address** (P2) - Organization address (JSONB or separate fields)
- **registration_number** (P1) - Business registration number (for regulatory compliance)
- **tax_id** (P2) - Tax identification number (for KRA integration)

### Backlog Items
```sql
-- P0: Password hash (if not using Keycloak)
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- P1: User status and contact
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING_APPROVAL';
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN registration_number VARCHAR(100);
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- P2: Address and tax information
ALTER TABLE users ADD COLUMN address JSONB;  -- {street, city, county, postal_code, country}
ALTER TABLE users ADD COLUMN tax_id VARCHAR(50);

-- Indexes
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_registration_number ON users(registration_number);
```

---

## 2. PRODUCTS Table Enhancements

### Missing Fields (from UI form analysis)
- **description** (P1) - Product description (currently in UI form but not in schema)
- **category** (P1) - Product category enum: 'medicine', 'supplement', 'medical_device', 'cosmetic'
- **unit_of_measure** (P1) - Unit of measure: 'tablet', 'vial', 'bottle', 'box', etc.
- **price** (P2) - Product price (for pricing analytics)
- **currency** (P2) - Currency code (KES, USD, etc.)
- **registration_number** (P1) - PPB product registration number (regulatory requirement)
- **manufacturer_name** (P1) - Manufacturer name (may differ from brand owner)
- **active_ingredient** (P2) - Active ingredient(s) for medicines
- **strength** (P2) - Product strength (e.g., "500mg")
- **pack_size** (P2) - Package size (e.g., "30 tablets")
- **status** (P1) - Product status: 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'
- **approved_by** (P1) - PPB user who approved the product
- **approved_at** (P1) - Approval timestamp
- **rejection_reason** (P2) - Reason for rejection (if status is 'REJECTED')

### Backlog Items
```sql
-- P1: Core product information
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN category VARCHAR(50);  -- 'medicine', 'supplement', 'medical_device', 'cosmetic'
ALTER TABLE products ADD COLUMN unit_of_measure VARCHAR(50);  -- 'tablet', 'vial', 'bottle', 'box'
ALTER TABLE products ADD COLUMN registration_number VARCHAR(100);  -- PPB registration number
ALTER TABLE products ADD COLUMN manufacturer_name VARCHAR(255);
ALTER TABLE products ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING_APPROVAL';
ALTER TABLE products ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;

-- P2: Additional product details
ALTER TABLE products ADD COLUMN price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN currency VARCHAR(3) DEFAULT 'KES';
ALTER TABLE products ADD COLUMN active_ingredient VARCHAR(255);
ALTER TABLE products ADD COLUMN strength VARCHAR(50);
ALTER TABLE products ADD COLUMN pack_size VARCHAR(50);
ALTER TABLE products ADD COLUMN rejection_reason TEXT;

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_registration_number ON products(registration_number);
CREATE INDEX idx_products_approved_by ON products(approved_by);
```

---

## 3. BATCHES Table Enhancements

### Missing Fields
- **production_date** (P1) - Date when batch was produced (not just expiry)
- **manufacturing_location** (P2) - Location where batch was manufactured
- **quality_control_status** (P2) - QC status: 'PENDING', 'PASSED', 'FAILED'
- **quality_control_date** (P2) - QC date
- **status** (P1) - Batch status: 'ACTIVE', 'EXPIRED', 'RECALLED', 'QUARANTINED'
- **manufacturing_batch_number** (P2) - Internal manufacturing batch number (may differ from GS1 batchno)

### Backlog Items
```sql
-- P1: Production and status tracking
ALTER TABLE batches ADD COLUMN production_date DATE;
ALTER TABLE batches ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

-- P2: Manufacturing and quality control
ALTER TABLE batches ADD COLUMN manufacturing_location VARCHAR(255);
ALTER TABLE batches ADD COLUMN quality_control_status VARCHAR(20);
ALTER TABLE batches ADD COLUMN quality_control_date DATE;
ALTER TABLE batches ADD COLUMN manufacturing_batch_number VARCHAR(255);

-- Indexes
CREATE INDEX idx_batches_production_date ON batches(production_date);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_quality_control_status ON batches(quality_control_status);
```

---

## 4. SHIPMENT Table Enhancements

### Missing Fields
- **actual_delivery_date** (P1) - Actual delivery date (vs expected)
- **delivery_status** (P1) - Delivery status: 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'
- **tracking_number** (P2) - Carrier tracking number (separate from SSCC)
- **shipping_cost** (P2) - Shipping cost (for cost analytics)
- **weight** (P2) - Shipment weight (kg)
- **dimensions** (P2) - Shipment dimensions (JSONB: {length, width, height, unit})
- **delivery_signature** (P2) - Delivery signature/image (for proof of delivery)
- **delivery_notes** (P2) - Delivery notes/remarks
- **carrier_contact** (P2) - Carrier contact information (phone, email)

### Backlog Items
```sql
-- P1: Delivery tracking
ALTER TABLE shipment ADD COLUMN actual_delivery_date DATE;
ALTER TABLE shipment ADD COLUMN delivery_status VARCHAR(20) DEFAULT 'PENDING';

-- P2: Additional shipment details
ALTER TABLE shipment ADD COLUMN tracking_number VARCHAR(100);
ALTER TABLE shipment ADD COLUMN shipping_cost NUMERIC(10,2);
ALTER TABLE shipment ADD COLUMN weight NUMERIC(10,2);  -- kg
ALTER TABLE shipment ADD COLUMN dimensions JSONB;  -- {length, width, height, unit}
ALTER TABLE shipment ADD COLUMN delivery_signature TEXT;  -- Base64 encoded image or URL
ALTER TABLE shipment ADD COLUMN delivery_notes TEXT;
ALTER TABLE shipment ADD COLUMN carrier_contact JSONB;  -- {phone, email, name}

-- Indexes
CREATE INDEX idx_shipment_delivery_status ON shipment(delivery_status);
CREATE INDEX idx_shipment_actual_delivery_date ON shipment(actual_delivery_date);
CREATE INDEX idx_shipment_tracking_number ON shipment(tracking_number);
```

---

## 5. PACKAGES Table Enhancements

### Missing Fields
- **package_type** (P2) - Package type: 'CARTON', 'PALLET', 'CONTAINER'
- **weight** (P2) - Package weight (kg)
- **dimensions** (P2) - Package dimensions (JSONB)
- **sscc** (P1) - SSCC for package-level tracking (if packages have their own SSCC)

### Backlog Items
```sql
-- P1: Package-level SSCC
ALTER TABLE packages ADD COLUMN sscc VARCHAR(50);

-- P2: Package details
ALTER TABLE packages ADD COLUMN package_type VARCHAR(50);
ALTER TABLE packages ADD COLUMN weight NUMERIC(10,2);
ALTER TABLE packages ADD COLUMN dimensions JSONB;

-- Indexes
CREATE INDEX idx_packages_sscc ON packages(sscc);
```

---

## 6. CASE Table Enhancements

### Missing Fields
- **case_type** (P2) - Case type/size
- **weight** (P2) - Case weight (kg)
- **sscc** (P2) - SSCC for case-level tracking (if cases have their own SSCC)

### Backlog Items
```sql
-- P2: Case details
ALTER TABLE "case" ADD COLUMN case_type VARCHAR(50);
ALTER TABLE "case" ADD COLUMN weight NUMERIC(10,2);
ALTER TABLE "case" ADD COLUMN sscc VARCHAR(50);

-- Indexes
CREATE INDEX idx_case_sscc ON "case"(sscc);
```

---

## 7. RECALL_REQUESTS Table Enhancements

### Missing Fields
- **created_by** (P1) - PPB user who created the recall
- **priority** (P1) - Recall priority: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
- **severity** (P1) - Recall severity: 'CLASS_I', 'CLASS_II', 'CLASS_III'
- **affected_quantity** (P1) - Estimated quantity affected by recall
- **status_history** (P2) - JSONB array of status changes with timestamps
- **completion_notes** (P2) - Notes when recall is completed
- **estimated_cost** (P2) - Estimated recall cost

### Backlog Items
```sql
-- P1: Recall management
ALTER TABLE recall_requests ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE recall_requests ADD COLUMN priority VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE recall_requests ADD COLUMN severity VARCHAR(20);
ALTER TABLE recall_requests ADD COLUMN affected_quantity NUMERIC(15,2);

-- P2: Additional recall details
ALTER TABLE recall_requests ADD COLUMN status_history JSONB;  -- [{status, timestamp, user_id, notes}]
ALTER TABLE recall_requests ADD COLUMN completion_notes TEXT;
ALTER TABLE recall_requests ADD COLUMN estimated_cost NUMERIC(10,2);

-- Indexes
CREATE INDEX idx_recall_requests_created_by ON recall_requests(created_by);
CREATE INDEX idx_recall_requests_priority ON recall_requests(priority);
CREATE INDEX idx_recall_requests_severity ON recall_requests(severity);
```

---

## 8. EPCIS_EVENT_SUMMARY Table Enhancements

### Critical Gap: Actor Context (P0)
**Problem**: Cannot identify which actor (manufacturer, supplier, facility) created an event - critical for L5 TNT analytics.

### Missing Fields
- **actor_type** (P0) - Actor type: 'manufacturer', 'supplier', 'facility', 'ppb'
- **actor_user_id** (P0) - Links to users.id
- **actor_gln** (P0) - Actor's GLN (manufacturer GLN, facility GLN, etc.)
- **actor_organization** (P0) - Actor's organization name
- **source_entity_type** (P1) - Source entity: 'consignment', 'shipment', 'batch', etc.
- **source_entity_id** (P1) - ID of source entity
- **source_epc** (P1) - Source EPC URI (for ObjectEvents)
- **destination_epc** (P1) - Destination EPC URI (for ObjectEvents)
- **quantity** (P2) - Quantity associated with event
- **error_code** (P2) - Error code if event failed
- **error_message** (P2) - Error message if event failed
- **sync_status** (P1) - Sync status: 'PENDING', 'SYNCED', 'FAILED'
- **last_synced_at** (P1) - Last sync timestamp

### Backlog Items
```sql
-- P0: Actor context (CRITICAL for L5 TNT analytics)
ALTER TABLE epcis_event_summary ADD COLUMN actor_type VARCHAR(50);
ALTER TABLE epcis_event_summary ADD COLUMN actor_user_id UUID REFERENCES users(id);
ALTER TABLE epcis_event_summary ADD COLUMN actor_gln VARCHAR(100);
ALTER TABLE epcis_event_summary ADD COLUMN actor_organization VARCHAR(255);

-- P1: Enhanced event tracking
ALTER TABLE epcis_event_summary ADD COLUMN source_entity_type VARCHAR(50);
ALTER TABLE epcis_event_summary ADD COLUMN source_entity_id INTEGER;
ALTER TABLE epcis_event_summary ADD COLUMN source_epc VARCHAR(255);
ALTER TABLE epcis_event_summary ADD COLUMN destination_epc VARCHAR(255);
ALTER TABLE epcis_event_summary ADD COLUMN sync_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE epcis_event_summary ADD COLUMN last_synced_at TIMESTAMP;

-- P2: Error tracking and quantity
ALTER TABLE epcis_event_summary ADD COLUMN quantity NUMERIC(15,2);
ALTER TABLE epcis_event_summary ADD COLUMN error_code VARCHAR(50);
ALTER TABLE epcis_event_summary ADD COLUMN error_message TEXT;

-- Indexes for actor-based analytics
CREATE INDEX idx_epcis_event_summary_actor_type ON epcis_event_summary(actor_type);
CREATE INDEX idx_epcis_event_summary_actor_user_id ON epcis_event_summary(actor_user_id);
CREATE INDEX idx_epcis_event_summary_actor_gln ON epcis_event_summary(actor_gln);
CREATE INDEX idx_epcis_event_summary_source_entity ON epcis_event_summary(source_entity_type, source_entity_id);
CREATE INDEX idx_epcis_event_summary_source_epc ON epcis_event_summary(source_epc);
CREATE INDEX idx_epcis_event_summary_destination_epc ON epcis_event_summary(destination_epc);
CREATE INDEX idx_epcis_event_summary_sync_status ON epcis_event_summary(sync_status);
```

### 8.1. Normalized Event Summary Structure (P1)
**Problem**: Current `child_epcs` TEXT[] array is slow for EPC lookups. Normalize for faster writes and queries.

**Current Structure** (Denormalized):
- `child_epcs` TEXT[] - Array of EPC URIs (slow for individual EPC lookups)

**Proposed Structure** (Normalized):
- `epcis_events` - Main events table
- `epcis_event_epcs` - Junction table (one row per EPC)

**Benefits**:
- ✅ Faster EPC lookups (indexed individual EPCs)
- ✅ Better analytics (query by specific EPCs)
- ✅ More flexible (can add EPC metadata)
- ✅ Better for joins

**Trade-offs**:
- ⚠️ More writes (one row per EPC)
- ⚠️ Slightly more complex queries (JOIN required)

**Implementation**:
```sql
-- Option A: Keep current table, add normalized table for new events
-- Option B: Migrate existing data and use normalized structure

-- Create normalized structure
CREATE TABLE epcis_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(50) NOT NULL,
  parent_id VARCHAR(255),
  biz_step VARCHAR(100),
  disposition VARCHAR(100),
  event_time TIMESTAMP NOT NULL,
  read_point_id VARCHAR(255),
  biz_location_id VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  -- Actor context
  actor_type VARCHAR(50),
  actor_user_id UUID REFERENCES users(id),
  actor_gln VARCHAR(100),
  actor_organization VARCHAR(255),
  -- Source tracking
  source_entity_type VARCHAR(50),
  source_entity_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Junction table for EPCs (one row per EPC)
CREATE TABLE epcis_event_epcs (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL REFERENCES epcis_events(event_id) ON DELETE CASCADE,
  epc VARCHAR(255) NOT NULL,
  epc_type VARCHAR(50), -- 'SGTIN', 'SSCC', 'BATCH', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, epc)
);

-- Indexes for performance
CREATE INDEX idx_epcis_events_event_time ON epcis_events(event_time);
CREATE INDEX idx_epcis_events_parent_id ON epcis_events(parent_id);
CREATE INDEX idx_epcis_events_biz_step ON epcis_events(biz_step);
CREATE INDEX idx_epcis_events_event_type ON epcis_events(event_type);
CREATE INDEX idx_epcis_events_actor_type ON epcis_events(actor_type);
CREATE INDEX idx_epcis_events_actor_user_id ON epcis_events(actor_user_id);
CREATE INDEX idx_epcis_events_actor_gln ON epcis_events(actor_gln);
CREATE INDEX idx_epcis_event_epcs_event_id ON epcis_event_epcs(event_id);
CREATE INDEX idx_epcis_event_epcs_epc ON epcis_event_epcs(epc); -- KEY for fast EPC lookups!
CREATE INDEX idx_epcis_event_epcs_epc_type ON epcis_event_epcs(epc_type);
```

**Migration Strategy**:
1. Create new normalized tables
2. Migrate existing data from `epcis_event_summary` to normalized structure
3. Update application code to write to normalized tables
4. Keep `epcis_event_summary` for backward compatibility (read-only)
5. Deprecate `epcis_event_summary` after migration period

---

## 9. L5 TNT Analytics Tables (P0 - Critical for Level 5 Compliance)

### 9.1. PRODUCT_STATUS Table (P0)
**Purpose**: Track product status changes (Active, Lost, Stolen, Damaged, Sample, Export, Dispensing)

```sql
CREATE TABLE product_status (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  batch_id INTEGER REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  status VARCHAR(50) NOT NULL, -- 'ACTIVE', 'LOST', 'STOLEN', 'DAMAGED', 'SAMPLE', 'EXPORT', 'DISPENSING'
  previous_status VARCHAR(50), -- Previous status for history
  status_date TIMESTAMP NOT NULL DEFAULT NOW(),
  actor_user_id UUID NOT NULL REFERENCES users(id),
  actor_type VARCHAR(50), -- 'manufacturer', 'supplier', 'facility'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_status_product_id ON product_status(product_id);
CREATE INDEX idx_product_status_batch_id ON product_status(batch_id);
CREATE INDEX idx_product_status_sgtin ON product_status(sgtin);
CREATE INDEX idx_product_status_status ON product_status(status);
CREATE INDEX idx_product_status_status_date ON product_status(status_date);
CREATE INDEX idx_product_status_actor_user_id ON product_status(actor_user_id);
```

### 9.2. PRODUCT_DESTRUCTION Table (P0)
**Purpose**: Track product destruction for regulatory compliance

```sql
CREATE TABLE product_destruction (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  quantity NUMERIC(15,2) NOT NULL,
  destruction_reason VARCHAR(255) NOT NULL, -- 'EXPIRED', 'DAMAGED', 'RECALLED', 'QUARANTINED'
  destruction_date TIMESTAMP NOT NULL,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  compliance_document_url TEXT, -- Link to destruction certificate
  witness_name VARCHAR(255),
  witness_signature TEXT, -- Base64 encoded image or URL
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_destruction_product_id ON product_destruction(product_id);
CREATE INDEX idx_product_destruction_batch_id ON product_destruction(batch_id);
CREATE INDEX idx_product_destruction_sgtin ON product_destruction(sgtin);
CREATE INDEX idx_product_destruction_destruction_date ON product_destruction(destruction_date);
CREATE INDEX idx_product_destruction_facility_user_id ON product_destruction(facility_user_id);
```

### 9.3. PRODUCT_RETURNS Table (P0)
**Purpose**: Track return logistics (Return Receiving/Shipping)

```sql
CREATE TABLE product_returns (
  id SERIAL PRIMARY KEY,
  return_type VARCHAR(50) NOT NULL, -- 'RETURN_RECEIVING', 'RETURN_SHIPPING'
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  quantity NUMERIC(15,2) NOT NULL,
  return_reason VARCHAR(255) NOT NULL, -- 'DEFECTIVE', 'EXPIRED', 'OVERSTOCK', 'CUSTOMER_RETURN'
  from_actor_user_id UUID NOT NULL REFERENCES users(id), -- Who is returning
  to_actor_user_id UUID NOT NULL REFERENCES users(id), -- Who is receiving
  reference_document_number VARCHAR(255), -- Reference document for return
  return_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'REJECTED'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_returns_product_id ON product_returns(product_id);
CREATE INDEX idx_product_returns_batch_id ON product_returns(batch_id);
CREATE INDEX idx_product_returns_sgtin ON product_returns(sgtin);
CREATE INDEX idx_product_returns_return_type ON product_returns(return_type);
CREATE INDEX idx_product_returns_from_actor ON product_returns(from_actor_user_id);
CREATE INDEX idx_product_returns_to_actor ON product_returns(to_actor_user_id);
CREATE INDEX idx_product_returns_return_date ON product_returns(return_date);
```

### 9.4. PRODUCT_VERIFICATIONS Table (P0)
**Purpose**: Track product verifications (consumer verification, counterfeit detection)

```sql
CREATE TABLE product_verifications (
  id SERIAL PRIMARY KEY,
  sgtin VARCHAR(255) NOT NULL, -- Serialized product identifier
  product_id INTEGER REFERENCES products(id),
  batch_id INTEGER REFERENCES batches(id),
  verification_result VARCHAR(50) NOT NULL, -- 'VALID', 'INVALID', 'COUNTERFEIT', 'EXPIRED', 'ALREADY_VERIFIED'
  verification_location VARCHAR(255), -- Where verification occurred
  verification_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  verifier_user_id UUID REFERENCES users(id), -- Null for public/consumer verifications
  verification_method VARCHAR(50), -- 'SCAN', 'MANUAL', 'API', 'MOBILE_APP'
  ip_address VARCHAR(45), -- For public verifications
  user_agent TEXT, -- Browser/device info
  is_consumer_verification BOOLEAN DEFAULT FALSE, -- True for public verifications
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_verifications_sgtin ON product_verifications(sgtin);
CREATE INDEX idx_product_verifications_product_id ON product_verifications(product_id);
CREATE INDEX idx_product_verifications_batch_id ON product_verifications(batch_id);
CREATE INDEX idx_product_verifications_result ON product_verifications(verification_result);
CREATE INDEX idx_product_verifications_timestamp ON product_verifications(verification_timestamp);
CREATE INDEX idx_product_verifications_verifier_user_id ON product_verifications(verifier_user_id);
CREATE INDEX idx_product_verifications_consumer ON product_verifications(is_consumer_verification);
```

### 9.5. FACILITY_RECEIVING Table (P0)
**Purpose**: Track facility receiving operations

```sql
CREATE TABLE facility_receiving (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  shipment_id INTEGER REFERENCES shipment(id),
  consignment_id INTEGER REFERENCES consignments(id),
  received_date TIMESTAMP NOT NULL DEFAULT NOW(),
  received_quantity NUMERIC(15,2) NOT NULL,
  expected_quantity NUMERIC(15,2), -- For discrepancy tracking
  discrepancy_quantity NUMERIC(15,2), -- Difference between expected and received
  discrepancy_reason TEXT,
  received_by UUID REFERENCES users(id), -- Staff who received
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_receiving_facility_user_id ON facility_receiving(facility_user_id);
CREATE INDEX idx_facility_receiving_shipment_id ON facility_receiving(shipment_id);
CREATE INDEX idx_facility_receiving_consignment_id ON facility_receiving(consignment_id);
CREATE INDEX idx_facility_receiving_received_date ON facility_receiving(received_date);
```

### 9.6. FACILITY_DISPENSING Table (P0)
**Purpose**: Track facility dispensing operations (point of consumption)

```sql
CREATE TABLE facility_dispensing (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sgtin VARCHAR(255), -- For unit-level tracking
  quantity NUMERIC(15,2) NOT NULL,
  dispensing_date TIMESTAMP NOT NULL DEFAULT NOW(),
  patient_id VARCHAR(255), -- Optional patient identifier
  prescription_number VARCHAR(255), -- Optional prescription reference
  dispensed_by UUID REFERENCES users(id), -- Staff who dispensed
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_dispensing_facility_user_id ON facility_dispensing(facility_user_id);
CREATE INDEX idx_facility_dispensing_product_id ON facility_dispensing(product_id);
CREATE INDEX idx_facility_dispensing_batch_id ON facility_dispensing(batch_id);
CREATE INDEX idx_facility_dispensing_sgtin ON facility_dispensing(sgtin);
CREATE INDEX idx_facility_dispensing_dispensing_date ON facility_dispensing(dispensing_date);
CREATE INDEX idx_facility_dispensing_patient_id ON facility_dispensing(patient_id);
```

### 9.7. FACILITY_INVENTORY Table (P1)
**Purpose**: Track facility inventory levels

```sql
CREATE TABLE facility_inventory (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(15,2) DEFAULT 0, -- Reserved for dispensing
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(facility_user_id, product_id, batch_id)
);

CREATE INDEX idx_facility_inventory_facility_user_id ON facility_inventory(facility_user_id);
CREATE INDEX idx_facility_inventory_product_id ON facility_inventory(product_id);
CREATE INDEX idx_facility_inventory_batch_id ON facility_inventory(batch_id);
```

## 10. New Tables to Consider

### 10.1. PRODUCT_IMAGES Table (P2)
```sql
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_type VARCHAR(50),  -- 'PRIMARY', 'SECONDARY', 'PACKAGING'
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary);
```

### 10.2. SHIPMENT_STATUS_HISTORY Table (P1)
```sql
CREATE TABLE shipment_status_history (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  status_date TIMESTAMP NOT NULL,
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipment_status_history_shipment_id ON shipment_status_history(shipment_id);
CREATE INDEX idx_shipment_status_history_status_date ON shipment_status_history(status_date);
```

### 10.3. NOTIFICATIONS Table (P1)
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'BATCH_EXPIRY', 'RECALL', 'SHIPMENT', 'SYSTEM'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 10.4. INTEGRATION_LOGS Table (P1)
```sql
CREATE TABLE integration_logs (
  id SERIAL PRIMARY KEY,
  integration_type VARCHAR(50) NOT NULL,  -- 'PPB_API', 'KRA', 'KEBS', 'EPCIS'
  request_type VARCHAR(20) NOT NULL,  -- 'REQUEST', 'RESPONSE', 'ERROR'
  endpoint VARCHAR(255),
  request_body JSONB,
  response_body JSONB,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_integration_type ON integration_logs(integration_type);
CREATE INDEX idx_integration_logs_request_type ON integration_logs(request_type);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);
```

---

## 11. Analytics & Reporting Enhancements (L5 TNT Requirements)

### 11.1. Materialized Views for Performance (P1)
**Purpose**: Pre-aggregate common analytics queries for fast dashboard loading

```sql
-- Daily shipment summary
CREATE MATERIALIZED VIEW mv_daily_shipment_summary AS
SELECT 
  DATE(created_at) as shipment_date,
  COUNT(*) as total_shipments,
  COUNT(CASE WHEN is_dispatched THEN 1 END) as dispatched_shipments,
  COUNT(CASE WHEN delivery_status = 'DELIVERED' THEN 1 END) as delivered_shipments,
  COUNT(CASE WHEN delivery_status = 'RETURNED' THEN 1 END) as returned_shipments
FROM shipment
WHERE is_deleted = FALSE
GROUP BY DATE(created_at);

-- Batch expiry summary
CREATE MATERIALIZED VIEW mv_batch_expiry_summary AS
SELECT 
  DATE(expiry) as expiry_date,
  COUNT(*) as total_batches,
  SUM(qty - sent_qty) as remaining_quantity,
  COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_count,
  COUNT(CASE WHEN status = 'RECALLED' THEN 1 END) as recalled_count
FROM batches
WHERE is_enabled = TRUE
GROUP BY DATE(expiry);

-- Product journey analytics (by event)
CREATE MATERIALIZED VIEW mv_product_journey_analytics AS
SELECT 
  e.source_entity_id as product_id,
  e.source_entity_id as batch_id,
  COUNT(DISTINCT e.event_id) as event_count,
  MIN(e.event_time) as first_event_time,
  MAX(e.event_time) as last_event_time,
  COUNT(DISTINCT e.actor_type) as actor_count,
  COUNT(DISTINCT e.biz_step) as biz_step_count
FROM epcis_events e
WHERE e.source_entity_type IN ('batch', 'product')
GROUP BY e.source_entity_id;

-- Actor performance analytics
CREATE MATERIALIZED VIEW mv_actor_performance AS
SELECT 
  actor_type,
  actor_user_id,
  actor_organization,
  COUNT(*) as total_events,
  COUNT(DISTINCT DATE(event_time)) as active_days,
  COUNT(DISTINCT biz_step) as operation_types,
  MIN(event_time) as first_event,
  MAX(event_time) as last_event
FROM epcis_events
WHERE actor_type IS NOT NULL
GROUP BY actor_type, actor_user_id, actor_organization;

-- Product status distribution
CREATE MATERIALIZED VIEW mv_product_status_distribution AS
SELECT 
  status,
  COUNT(*) as count,
  COUNT(DISTINCT product_id) as unique_products,
  COUNT(DISTINCT batch_id) as unique_batches,
  COUNT(DISTINCT sgtin) as unique_units
FROM product_status
GROUP BY status;

-- Verification analytics
CREATE MATERIALIZED VIEW mv_verification_analytics AS
SELECT 
  DATE(verification_timestamp) as verification_date,
  verification_result,
  COUNT(*) as verification_count,
  COUNT(DISTINCT sgtin) as unique_products_verified,
  COUNT(CASE WHEN is_consumer_verification THEN 1 END) as consumer_verifications
FROM product_verifications
GROUP BY DATE(verification_timestamp), verification_result;

-- Refresh strategy (run daily or on-demand)
CREATE UNIQUE INDEX ON mv_daily_shipment_summary(shipment_date);
CREATE UNIQUE INDEX ON mv_batch_expiry_summary(expiry_date);
CREATE UNIQUE INDEX ON mv_product_journey_analytics(product_id, batch_id);
CREATE UNIQUE INDEX ON mv_actor_performance(actor_type, actor_user_id);
CREATE UNIQUE INDEX ON mv_product_status_distribution(status);
CREATE UNIQUE INDEX ON mv_verification_analytics(verification_date, verification_result);

-- Refresh command (run via cron or scheduled job)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_shipment_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_batch_expiry_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_journey_analytics;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_actor_performance;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_status_distribution;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_verification_analytics;
```

### 11.2. Star Schema for Advanced Analytics (P2)
**Purpose**: Fact and dimension tables for OLAP-style analytics queries

```sql
-- Fact table: Shipment events
CREATE TABLE fact_shipment_events (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER,
  product_id INTEGER,
  batch_id INTEGER,
  manufacturer_user_id UUID,
  supplier_user_id UUID,
  facility_user_id UUID,
  event_date DATE NOT NULL,
  event_time TIMESTAMP NOT NULL,
  event_type VARCHAR(50), -- 'AGGREGATION', 'OBJECT', 'TRANSACTION'
  biz_step VARCHAR(100),
  disposition VARCHAR(100),
  quantity NUMERIC(15,2),
  actor_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dimension: Manufacturers
CREATE TABLE dim_manufacturer (
  manufacturer_user_id UUID PRIMARY KEY REFERENCES users(id),
  organization VARCHAR(255),
  gln VARCHAR(100),
  registration_number VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- Dimension: Suppliers
CREATE TABLE dim_supplier (
  supplier_user_id UUID PRIMARY KEY REFERENCES users(id),
  organization VARCHAR(255),
  gln VARCHAR(100),
  registration_number VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- Dimension: Facilities
CREATE TABLE dim_facility (
  facility_user_id UUID PRIMARY KEY REFERENCES users(id),
  organization VARCHAR(255),
  gln VARCHAR(100),
  premise_id INTEGER REFERENCES premises(id),
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- Dimension: Products
CREATE TABLE dim_product (
  product_id INTEGER PRIMARY KEY REFERENCES products(id),
  product_name VARCHAR(255),
  brand_name VARCHAR(255),
  gtin VARCHAR(50),
  category VARCHAR(50),
  registration_number VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- Dimension: Time (for time-series analytics)
CREATE TABLE dim_time (
  date DATE PRIMARY KEY,
  year INTEGER,
  quarter INTEGER,
  month INTEGER,
  week INTEGER,
  day_of_week INTEGER,
  is_weekend BOOLEAN,
  is_holiday BOOLEAN
);

-- Indexes for fact table
CREATE INDEX idx_fact_shipment_events_shipment_id ON fact_shipment_events(shipment_id);
CREATE INDEX idx_fact_shipment_events_product_id ON fact_shipment_events(product_id);
CREATE INDEX idx_fact_shipment_events_batch_id ON fact_shipment_events(batch_id);
CREATE INDEX idx_fact_shipment_events_event_date ON fact_shipment_events(event_date);
CREATE INDEX idx_fact_shipment_events_actor_type ON fact_shipment_events(actor_type);
CREATE INDEX idx_fact_shipment_events_manufacturer ON fact_shipment_events(manufacturer_user_id);
CREATE INDEX idx_fact_shipment_events_supplier ON fact_shipment_events(supplier_user_id);
CREATE INDEX idx_fact_shipment_events_facility ON fact_shipment_events(facility_user_id);
```

### 11.3. Analytics Tables (P2)
```sql
-- Product analytics
CREATE TABLE product_analytics (
  product_id INTEGER PRIMARY KEY REFERENCES products(id),
  total_batches INTEGER DEFAULT 0,
  total_quantity NUMERIC(15,2) DEFAULT 0,
  total_shipments INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- User analytics
CREATE TABLE user_analytics (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_products INTEGER DEFAULT 0,
  total_batches INTEGER DEFAULT 0,
  total_shipments INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Priority

### Phase 1 (P0 - Critical for L5 TNT Compliance)
**Goal**: Enable Level 5 Track & Trace analytics capabilities

1. **EPCIS Event Summary - Actor Context** (P0)
   - Add actor_type, actor_user_id, actor_gln, actor_organization
   - Add source_entity_type, source_entity_id
   - Add indexes for actor-based queries

2. **L5 TNT Analytics Tables** (P0)
   - product_status (status tracking)
   - product_destruction (destruction tracking)
   - product_returns (return logistics)
   - product_verifications (verification tracking)
   - facility_receiving (facility operations)
   - facility_dispensing (point of consumption)

3. **EPCIS Event Normalization** (P1)
   - Create epcis_events table (normalized)
   - Create epcis_event_epcs junction table
   - Migrate existing data
   - Update application code

4. **Users**: password_hash, status, phone_number, registration_number
5. **Products**: description, category, unit_of_measure, registration_number, status, approved_by, approved_at
6. **Batches**: production_date, status
7. **Shipment**: actual_delivery_date, delivery_status
8. **Recall**: created_by, priority, severity, affected_quantity

### Phase 2 (P1 - High Priority for Production)
**Goal**: Complete analytics infrastructure and performance optimization

1. **Materialized Views** (P1)
   - mv_daily_shipment_summary
   - mv_batch_expiry_summary
   - mv_product_journey_analytics
   - mv_actor_performance
   - mv_product_status_distribution
   - mv_verification_analytics
   - Set up refresh schedule (daily cron)

2. **EPCIS Event Summary Enhancements** (P1)
   - source_epc, destination_epc
   - sync_status, last_synced_at

3. **New Supporting Tables** (P1)
   - notifications
   - integration_logs
   - shipment_status_history
   - facility_inventory

4. **Time-Series Optimization** (P1)
   - Partition epcis_events by date (monthly partitions)
   - Partition product_verifications by date
   - Add date range indexes

### Phase 3 (P2 - Medium Priority)
**Goal**: Enhanced analytics and UX improvements

1. **Products**: price, currency, active_ingredient, strength, pack_size
2. **Batches**: manufacturing_location, quality_control_status
3. **Shipment**: tracking_number, shipping_cost, weight, dimensions
4. **Packages**: package_type, weight, dimensions, sscc
5. **Case**: case_type, weight, sscc
6. **EPCIS**: quantity, error_code, error_message
7. **New tables**: product_images
8. **Star Schema** (P2)
   - fact_shipment_events
   - dim_manufacturer, dim_supplier, dim_facility, dim_product, dim_time
   - ETL process to populate fact/dimension tables

### Phase 4 (P3 - Low Priority)
1. All remaining P2/P3 enhancements
2. Advanced analytics optimizations
3. Custom reporting views
4. Data archival strategies

---

## L5 TNT Analytics Readiness Summary

### Current Readiness: ~25%

**Ready**:
- ✅ Basic counts (products, batches, shipments)
- ✅ Batch expiry tracking
- ✅ Basic recall tracking
- ✅ EPCIS event summary table exists

**Partially Ready** (needs enhancement):
- ⚠️ Journey tracking (missing actor context)
- ⚠️ Time-series analytics (dates indexed but no partitioning)
- ⚠️ Geographic analytics (PostGIS enabled but limited usage) - ✅ **API Support Added** (2025-12-07) - Location coordinates now accepted in multiple formats (object or comma-separated string)

**Not Ready** (critical gaps):
- ❌ Actor context in events (P0)
- ❌ Product status tracking (P0)
- ❌ Destruction tracking (P0)
- ❌ Return logistics (P0)
- ❌ Verification tracking (P0)
- ❌ Facility operations (P0)
- ❌ Materialized views (P1)
- ❌ Star schema (P2)
- ❌ Normalized event structure (P1)

### Implementation Roadmap

**Week 1-2: Critical L5 TNT Tables (P0)**
- Add actor context to epcis_event_summary
- Create product_status, product_destruction, product_returns tables
- Create product_verifications, facility_receiving, facility_dispensing tables
- Update application code to populate new tables

**Week 3-4: Event Normalization & Performance (P1)**
- Create normalized epcis_events and epcis_event_epcs tables
- Migrate existing data
- Create materialized views
- Set up refresh schedules

**Week 5-6: Enhanced Analytics (P2)**
- Create star schema (fact/dimension tables)
- Implement ETL process
- Create additional materialized views
- Performance testing and optimization

## Notes
- All enhancements should maintain backward compatibility
- Use migrations (TypeORM or raw SQL) for schema changes
- Test all changes in development before production
- Update TypeORM entities and DTOs when adding new fields
- Consider data migration scripts for existing data
- Review indexes after adding new columns that will be frequently queried
- **For L5 TNT**: Prioritize P0 items first - they are critical for Level 5 compliance
- **Event Normalization**: Consider keeping both denormalized (epcis_event_summary) and normalized (epcis_events) tables during migration period
- **Materialized Views**: Refresh daily via cron job or scheduled task
- **Star Schema**: Populate via ETL process (can be incremental or full refresh)

