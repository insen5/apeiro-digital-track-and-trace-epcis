# Full Re-Architecture Plan: Kenya National Track & Trace System

## Executive Summary

This document outlines a comprehensive re-architecture plan for the Kenya National Pharmaceutical Track and Trace (T&T) system. The current microservices architecture, while functional, presents significant challenges for analytics, data consistency, and integration with existing manufacturer/supplier systems. This plan proposes a hybrid architecture combining a modular monolith core with integration services, optimized for Kenya's specific context including GS1 migration and varying levels of technical capability among stakeholders.

---

## Business Context & Requirements

### Kenya National T&T System Context

**Regulatory Authority**: Pharmacy and Poisons Board (PPB) of Kenya

**System Purpose**: 
- End-to-end visibility of pharmaceutical products from manufacturing through distribution
- Regulatory compliance and oversight
- Anti-counterfeiting and product authentication
- Supply chain transparency
- Journey tracking for recalls and investigations

**Scale Requirements**:
- **Event Volume**: 100K - 1M events per day
- **Deployment**: On-premises government data center
- **Availability**: 24/7 with planned maintenance windows
- **Data Retention**: 5+ years (regulatory compliance)
- **Integration**: Required with Kenyan government systems (KRA, KEBS, PPB)

### Stakeholder Landscape in Kenya

#### 1. Manufacturers
**Type A - Large Manufacturers with Existing Systems**:
- Have ERP/WMS systems (SAP, Oracle, custom solutions)
- Production line management systems
- Warehouse management systems
- **Challenge**: Systems are NOT GS1-ready
  - Cannot generate SSCC (Serial Shipping Container Codes)
  - Cannot generate SGTIN (Serialized Global Trade Item Numbers)
  - Cannot create EPCIS events
  - Need integration adapters

**Type B - Small/Medium Manufacturers without Systems**:
- Manual processes or basic Excel
- Limited technical infrastructure
- **Need**: Full application with GS1 functionality built-in
  - Batch creation with GS1-compliant batch numbers
  - SSCC generation for shipments
  - Case/package aggregation
  - EPCIS event generation
  - Barcode/QR code generation

#### 2. Distributors/Suppliers (CPA - Central Procurement Agency)
**Similar Profile to Manufacturers**:
- Type A: Have existing systems (ERP, WMS) - need integration
- Type B: No systems - need full application
- **Additional Requirement**: Forward shipments to user facilities

#### 3. User Facilities (Hospitals, Clinics, Pharmacies)
**Current Reality**:
- Have their own LMIS (Logistics Management Information System)
- Manage inventory, stock levels, consumption
- Handle patient dispensing
- **T&T System Should NOT Duplicate LMIS Functionality**
- **T&T System Only Needs**: Event reporting (received, consumed)
- Integration via API/webhook from facility LMIS

#### 4. Regulator (PPB)
**Requirements**:
- Product catalog management (source of truth)
- Journey tracking across entire supply chain
- Recall management
- Compliance reporting
- Analytics and oversight dashboards
- Integration with other government systems (KRA, KEBS)

### GS1 Migration Context

**Current State**: Kenya is migrating to GS1 standards
- Manufacturers/suppliers are NOT GS1-ready
- Existing systems cannot generate GS1-compliant identifiers
- Need to provide GS1 functionality to reduce burden on stakeholders

**GS1 Functionality Required**:
- SSCC generation (Serial Shipping Container Code)
- SGTIN generation (Serialized Global Trade Item Number)
- Batch number management (GS1-compliant)
- EPCIS event creation (EPCIS 2.0 standard)
- Barcode/QR code generation
- EPC URI formatting

---

## Current Architecture Analysis

### Current Microservices Architecture

**Services**:
1. `epcis-auth-service` - Authentication (PostgreSQL: `auth_db`)
2. `epcis-manufacturer-service` - Manufacturer operations (PostgreSQL: `manufacturer_db`)
3. `epcis-supplier-service` - Supplier/CPA operations (PostgreSQL: `supplier_db`)
4. `epcis-ppb-service` - Regulatory oversight (PostgreSQL: `ppb_db`)
5. `epcis-user-facility-service` - Facility operations (PostgreSQL: `user_facility_db`)
6. `epcis-notification-service` - Notifications (PostgreSQL: `notification_db`)
7. `epcis-service` - EPCIS event repository (Java/Quarkus, OpenSearch)

**Infrastructure**:
- 6 separate PostgreSQL databases (one per service)
- OpenSearch for EPCIS events
- Kafka for event streaming
- Redis for caching
- Keycloak for authentication

### Critical Issues Identified

#### 1. Analytics Readiness Problems

**Schema Issues**:
- Quantities stored as `string` instead of `NUMERIC` (can't do math operations)
- Deep nested relationships requiring 4-5 joins for basic queries
- No denormalized views or materialized views
- No time-series optimization (date partitioning)
- No geographic data types (PostGIS) for location analytics
- Missing indexes on commonly queried fields

**Microservice Fragmentation**:
- Data split across 6 separate databases
- Cross-service aggregation requires HTTP calls (N+1 problem)
- PPB service makes sequential HTTP calls to manufacturer → supplier → user-facility
- No SQL joins possible across services
- Journey tracking is slow and complex

**Dual Storage Architecture**:
- Business data in PostgreSQL (6 databases)
- Event data in OpenSearch
- Cannot query both together for analytics
- No unified query layer

**Additional Analytics Issues**:
- No time-series optimization (slow date range queries)
- No geographic/spatial data types (can't do location analytics)
- Missing analytics-friendly indexes
- No data versioning/history (updates overwrite data)
- No pre-aggregation (every query recalculates from raw data)
- EPCIS events separate from business data (can't join)
- No data quality constraints (orphaned records possible)
- Inconsistent data types (string vs number IDs)
- No analytics-specific schema (OLAP vs OLTP)

#### 2. Microservice Architecture Problems

**No Independent Scaling Benefits**:
- All services scale together (same load patterns)
- No independent deployment needs
- Tight coupling (PPB calls manufacturer/supplier/user-facility)
- Shared infrastructure (same PostgreSQL, Redis, tech stack)

**Performance Overhead**:
- HTTP calls add latency (see `journey.service.ts` with N+1 calls)
- Network latency × number of service calls
- No transaction consistency across services
- Sequential dependencies (can't parallelize easily)

**Data Consistency Issues**:
- No cross-service transactions
- `productId` references PPB service via API (not FK constraint)
- Can have orphaned batches (product deleted in PPB but batches remain)
- No referential integrity across services

#### 3. Facility Module Architecture Issue

**Problem**: Facility module duplicates LMIS functionality
- Full shipment management (should be in LMIS)
- Batch tracking (should be in LMIS)
- Product management (should be in LMIS)
- **T&T System Should Only**: Receive events from facility LMIS via API

**Correct Pattern**: Integration adapter, not full module

#### 4. GS1 Functionality Gaps

**Current State**: GS1 functionality scattered across services
- SSCC generation duplicated in manufacturer, supplier, user-facility services
- No centralized GS1 service
- Inconsistent GS1 implementation
- Manufacturers/suppliers without systems need GS1 functionality provided

---

## Proposed Architecture: Hybrid Pattern

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Manufacturer │  │  Supplier    │  │   Facility   │     │
│  │    ERP/WMS   │  │   ERP/WMS    │  │     LMIS     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ (Integration APIs/Adapters)          │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         │                  │                  │              │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐      │
│  │Manufacturer │  │  Supplier     │  │  Facility    │      │
│  │ Integration │  │  Integration  │  │  Integration │      │
│  │   Service   │  │    Service    │  │    Service   │      │
│  │ (Adapter)   │  │   (Adapter)   │  │   (Adapter)  │      │
│  └──────┬──────┘  └───────┬──────┘  └───────┬──────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │         CORE T&T MONOLITH (Modular + Hexagonal)        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │Manufacturer│ │Distributor│ │ Regulator│ │  Auth  │ │  │
│  │  │  Module   │ │  Module   │ │  Module  │ │ Module │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│  │         │            │            │            │        │  │
│  │  ┌──────────────────────────────────────────────┐      │  │
│  │  │      GS1 Service Layer (Shared Domain)       │      │  │
│  │  │  - SSCC Generation                            │      │  │
│  │  │  - SGTIN Generation                           │      │  │
│  │  │  - Batch Number Management                   │      │  │
│  │  │  - EPCIS Event Creation                      │      │  │
│  │  │  - Barcode/QR Code Generation                │      │  │
│  │  └──────────────────────────────────────────────┘      │  │
│  │         │            │            │            │        │  │
│  │  ┌──────────────────────────────────────────────┐      │  │
│  │  │     Infrastructure Layer (Adapters)          │      │  │
│  │  │  PostgreSQL │  EPCIS Client │  Redis        │      │  │
│  │  └──────────────────────────────────────────────┘      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │         FULL APPLICATIONS (for Type B users)          │  │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │Manufacturer  │  │  Supplier    │                  │  │
│  │  │   Web App    │  │   Web App    │                  │  │
│  │  │  (Full UI)   │  │  (Full UI)   │                  │  │
│  │  └──────────────┘  └──────────────┘                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼──────────────────────────────┐
│         EPCIS Service (Java/Quarkus) - Separate          │
│  - Event capture, validation, persistence                │
│  - OpenSearch storage                                     │
│  - Kafka streaming                                        │
└──────────────────────────────────────────────────────────┘
```

### Architecture Components

#### 1. Core T&T Monolith (Modular + Hexagonal Architecture)

**Purpose**: Government oversight, analytics, regulatory compliance, GS1 functionality

**Technology**: NestJS/TypeScript (consolidate existing services)

**Architecture Pattern**: 
- **Modular Monolith**: Clear module boundaries, single deployment
- **Hexagonal Architecture**: Domain logic isolated from infrastructure

**Structure**:
```
core-monolith/
├── modules/
│   ├── regulator/          # PPB oversight, journey tracking, recalls
│   ├── manufacturer/       # Core manufacturer domain logic
│   ├── distributor/        # Core distributor domain logic
│   ├── auth/               # Authentication & authorization
│   └── notification/        # Alerts, expiry warnings
├── shared/
│   ├── gs1/                # GS1 Service Layer ⭐ (Critical)
│   │   ├── sscc.service.ts
│   │   ├── sgtin.service.ts
│   │   ├── batch.service.ts
│   │   ├── epcis-event.service.ts
│   │   └── barcode.service.ts
│   ├── domain/             # Shared domain entities
│   └── infrastructure/      # Database, EPCIS client adapters
└── web/                     # Full applications for Type B users
    ├── manufacturer-web/
    └── distributor-web/
```

**Database**: Single PostgreSQL database
- All modules share one database
- Enables SQL joins across all data
- Single source of truth for analytics
- ACID transactions across modules

**Key Features**:
- Direct method calls (no HTTP overhead between modules)
- GS1 Service Layer (centralized GS1 functionality)
- Hexagonal architecture (clean boundaries, testable)
- Single deployment unit

#### 2. Integration Services (Microservices/Adapters)

**Purpose**: Translate external system data → GS1 format → Core Monolith

**Technology**: NestJS/TypeScript (lightweight services)

**Services**:
- `manufacturer-integration-service` - Adapter for manufacturer ERP/WMS
- `supplier-integration-service` - Adapter for supplier ERP/WMS
- `facility-integration-service` - Adapter for facility LMIS

**What They Do**:
```typescript
// Example: manufacturer-integration-service
@Controller('api/integration/manufacturer')
export class ManufacturerIntegrationController {
  
  // Receives data from manufacturer's ERP
  @Post('batches')
  async receiveBatchFromERP(@Body() erpBatch: ERPBatchDto) {
    // 1. Validate ERP data format
    // 2. Call Core Monolith's GS1 Service to generate batch number
    // 3. Transform to GS1 format
    // 4. Send to Core Monolith's Manufacturer Module
    // 5. Core Monolith generates EPCIS event
  }
  
  @Post('shipments')
  async receiveShipmentFromERP(@Body() erpShipment: ERPShipmentDto) {
    // 1. Call Core Monolith's GS1 Service to generate SSCC
    // 2. Transform ERP shipment → GS1 shipment
    // 3. Send to Core Monolith
  }
}
```

**Why Separate Services?**
- Different integration patterns (REST, SOAP, file upload, etc.)
- Different data formats per manufacturer/supplier
- Can be deployed/managed independently
- Don't need to be in core monolith
- Can scale independently if needed

**Communication with Core Monolith**:
- Option A: HTTP API calls (if separate deployment)
- Option B: Shared library (if same deployment)
- Recommendation: Start with HTTP, optimize later

#### 3. Full Applications (Optional - Can be in Monolith or Separate)

**Purpose**: Complete UI for manufacturers/suppliers without systems (Type B users)

**Options**:
- **Option A**: Part of Core Monolith (simpler)
  - `modules/manufacturer/web/` - Web UI
  - `modules/distributor/web/` - Web UI
- **Option B**: Separate Frontend Apps (more flexible)
  - `manufacturer-webapp/` - Standalone Next.js app
  - `distributor-webapp/` - Standalone Next.js app

**Recommendation**: Keep in monolith initially, extract later if needed.

**Features**:
- Batch creation with GS1-compliant batch numbers
- SSCC generation for shipments
- Case/package aggregation
- EPCIS event generation
- Barcode/QR code generation
- Shipment management
- Journey tracking

#### 4. GS1 Service Layer (Critical Component)

**Location**: `core-monolith/shared/gs1/`

**Purpose**: Centralized GS1 functionality used by all modules and integration services

**Services**:

```typescript
// gs1/gs1.service.ts
@Injectable()
export class GS1Service {
  
  // Generate SSCC (Serial Shipping Container Code)
  async generateSSCC(companyPrefix: string): Promise<string> {
    // GS1-compliant SSCC generation
    // Uses company's GS1 prefix
    // Returns valid SSCC with check digit
    // Format: urn:epc:id:sscc:CompanyPrefix.SerialReference.CheckDigit
  }
  
  // Generate SGTIN (Serialized GTIN)
  async generateSGTIN(gtin: string, serialNumber: string): Promise<string> {
    // Creates urn:epc:id:sgtin: format
    // Validates GTIN format
    // Returns EPC URI
  }
  
  // Generate Batch Number
  async generateBatchNumber(productId: number, userId: string): Promise<string> {
    // GS1-compliant batch number
    // Ensures uniqueness
    // Returns batch identifier
  }
  
  // Create EPCIS Event
  async createEPCISEvent(eventData: EPCISEventData): Promise<EPCISDocument> {
    // Validates and creates EPCIS 2.0 compliant event
    // Handles AggregationEvent, ObjectEvent, etc.
    // Returns valid EPCISDocument
  }
  
  // Generate Barcode/QR Code
  async generateBarcode(epc: string, format: 'code128' | 'datamatrix'): Promise<Buffer> {
    // Generates barcode image
    // Supports Code 128, Data Matrix, QR Code
    // Returns image buffer
  }
  
  // Validate GS1 Identifier
  async validateGS1Identifier(identifier: string, type: 'SSCC' | 'SGTIN' | 'GTIN'): Promise<boolean> {
    // Validates GS1 format
    // Checks check digits
    // Returns validation result
  }
}
```

**Used By**:
- Core Monolith modules (for Type B users)
- Integration Services (for Type A users)
- External systems (via API)

#### 5. EPCIS Service (Keep Separate)

**Technology**: Java/Quarkus (OpenEPCIS)

**Purpose**: EPCIS event capture, validation, persistence, querying

**Why Keep Separate**:
- Different tech stack (Java vs TypeScript)
- Event-sourced architecture (different pattern)
- Industry-standard implementation (OpenEPCIS)
- Can scale independently

**Integration**: Core Monolith sends EPCIS events via HTTP API

---

## Data Architecture

### Database Consolidation

**Current**: 6 separate PostgreSQL databases
**Proposed**: Single PostgreSQL database for Core Monolith

**Benefits**:
- SQL joins across all data
- Single source of truth for analytics
- ACID transactions across modules
- Easier backup and recovery
- Better query optimization

**Schema Improvements**:

1. **Fix Data Types**:
   ```sql
   -- Change from string to numeric
   ALTER TABLE batches 
   ALTER COLUMN qty TYPE NUMERIC(15,2),
   ALTER COLUMN sentQty TYPE NUMERIC(15,2);
   
   ALTER TABLE cases_products 
   ALTER COLUMN qty TYPE NUMERIC(15,2);
   ```

2. **Add Geographic Data Types**:
   ```sql
   -- Enable PostGIS extension
   CREATE EXTENSION postgis;
   
   -- Add location columns
   ALTER TABLE shipment 
   ADD COLUMN pickup_location POINT,
   ADD COLUMN destination_location POINT;
   ```

3. **Add Indexes**:
   ```sql
   CREATE INDEX idx_shipment_pickup_date ON shipment(pickupDate);
   CREATE INDEX idx_shipment_sscc ON shipment(ssccBarcode);
   CREATE INDEX idx_batch_expiry ON batches(expiry);
   CREATE INDEX idx_batch_product ON batches(productId);
   CREATE INDEX idx_shipment_user ON shipment(userId);
   ```

4. **Create Materialized Views for Analytics**:
   ```sql
   CREATE MATERIALIZED VIEW shipment_analytics AS
   SELECT 
     s.id,
     s.ssccBarcode,
     s.pickupDate,
     s.expectedDeliveryDate,
     s.carrier,
     COUNT(DISTINCT p.id) as package_count,
     COUNT(DISTINCT c.id) as case_count,
     SUM(CAST(cp.qty AS NUMERIC)) as total_quantity,
     u.organization as manufacturer_name,
     pr.productName,
     pr.gtin
   FROM shipment s
   LEFT JOIN packages p ON p.shipmentId = s.id
   LEFT JOIN case c ON c.packageId = p.id
   LEFT JOIN cases_products cp ON cp.caseId = c.id
   LEFT JOIN batches b ON b.id = cp.batchId
   LEFT JOIN products pr ON pr.id = b.productId
   LEFT JOIN users u ON u.id = s.userId
   GROUP BY s.id, s.ssccBarcode, s.pickupDate, s.expectedDeliveryDate, 
            s.carrier, u.organization, pr.productName, pr.gtin;
   
   CREATE INDEX idx_shipment_analytics_date ON shipment_analytics(pickupDate);
   ```

5. **Create Analytics Schema (Star Schema)**:
   ```sql
   -- Fact Table
   CREATE TABLE fact_shipment (
     shipment_id INTEGER,
     manufacturer_id UUID,
     distributor_id UUID,
     product_id INTEGER,
     batch_id INTEGER,
     pickup_date DATE,
     delivery_date DATE,
     quantity NUMERIC(15,2),
     sscc VARCHAR(50),
     -- ... other facts
   );
   
   -- Dimension Tables
   CREATE TABLE dim_manufacturer (
     manufacturer_id UUID PRIMARY KEY,
     organization VARCHAR(255),
     gln_number VARCHAR(50),
     -- ... other attributes
   );
   
   CREATE TABLE dim_product (
     product_id INTEGER PRIMARY KEY,
     product_name VARCHAR(255),
     brand_name VARCHAR(255),
     gtin VARCHAR(50),
     -- ... other attributes
   );
   ```

### EPCIS Events Integration

**Current**: Events stored in OpenSearch (separate from business data)

**Proposed**: Sync EPCIS events to PostgreSQL for analytics

**Approach**:
1. EPCIS Service captures events → OpenSearch (primary storage)
2. EPCIS Service publishes events to Kafka topic
3. Core Monolith consumes events from Kafka
4. Core Monolith stores event summary in PostgreSQL

**Event Summary Table**:
```sql
CREATE TABLE epcis_event_summary (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(50), -- 'AggregationEvent', 'ObjectEvent', etc.
  parent_id VARCHAR(255),
  child_epcs TEXT[], -- Array of EPCs
  biz_step VARCHAR(100),
  disposition VARCHAR(100),
  event_time TIMESTAMP,
  read_point_id VARCHAR(255),
  biz_location_id VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_time ON epcis_event_summary(event_time);
CREATE INDEX idx_parent_id ON epcis_event_summary(parent_id);
CREATE INDEX idx_biz_step ON epcis_event_summary(biz_step);
CREATE INDEX idx_event_type ON epcis_event_summary(event_type);
```

---

## Module Responsibilities

### Core Monolith Modules

#### 1. Regulator Module (PPB)
**Responsibilities**:
- Product catalog management (source of truth)
- Journey tracking across entire supply chain
- Recall management
- Compliance reporting
- Analytics and oversight dashboards
- Integration with government systems (KRA, KEBS)

**Database Tables**:
- `products` (product catalog)
- `recall_requests`
- Analytics views and materialized views

#### 2. Manufacturer Module
**Responsibilities**:
- Batch creation (using GS1 Service)
- Case aggregation (batches → cases)
- Package creation (cases → packages)
- Shipment creation (packages → shipments)
- SSCC generation (using GS1 Service)
- EPCIS event generation (via GS1 Service)

**Database Tables**:
- `batches`
- `case`
- `cases_products`
- `packages`
- `shipment`

**For Type B Users**: Full web UI
**For Type A Users**: Called by Integration Service

#### 3. Distributor Module
**Responsibilities**:
- Receive shipments from manufacturers
- Break down packages
- Repackage for facilities
- Forward shipments to facilities
- SSCC generation for new shipments
- EPCIS event generation

**Database Tables**:
- `batches` (received batches)
- `case` (received cases)
- `packages` (received packages)
- `shipment` (forwarded shipments)

**For Type B Users**: Full web UI
**For Type A Users**: Called by Integration Service

#### 4. Auth Module
**Responsibilities**:
- User authentication
- Role-based access control
- User management
- Integration with Keycloak (optional)

**Database Tables**:
- `users`
- `roles`

#### 5. Notification Module
**Responsibilities**:
- Batch expiry warnings
- Recall notifications
- Activity logging
- Email/SMS notifications

**Database Tables**:
- `ppb_activity_logs`
- `batch_notification_settings`

### Integration Services

#### Manufacturer Integration Service
**Responsibilities**:
- Receive data from manufacturer ERP/WMS
- Validate data format
- Call Core Monolith GS1 Service for identifiers
- Transform ERP data → GS1 format
- Send to Core Monolith Manufacturer Module
- Handle different integration patterns (REST, SOAP, file upload)

**Endpoints**:
- `POST /api/integration/manufacturer/batches` - Receive batch from ERP
- `POST /api/integration/manufacturer/shipments` - Receive shipment from ERP
- `POST /api/integration/manufacturer/cases` - Receive case from ERP

#### Supplier Integration Service
**Similar to Manufacturer Integration Service**

#### Facility Integration Service
**Responsibilities**:
- Receive events from facility LMIS
- Validate event format
- Transform to EPCIS format
- Send to EPCIS Service
- Update Core Monolith for journey tracking

**Endpoints**:
- `POST /api/integration/facility/events/received` - Product received
- `POST /api/integration/facility/events/consumed` - Product consumed

---

## Data Flow Examples

### Scenario 1: Manufacturer with ERP (Type A)

```
Manufacturer ERP System
    ↓ (sends: product, quantity, expiry date)
Manufacturer Integration Service
    ↓ (validates, calls GS1 Service)
Core Monolith GS1 Service
    ↓ (generates: batch number, SSCC)
Core Monolith Manufacturer Module
    ↓ (creates batch, shipment in PostgreSQL)
Core Monolith → EPCIS Service
    ↓ (sends EPCIS event)
EPCIS Service → OpenSearch
    ↓ (stores event)
EPCIS Service → Kafka
    ↓ (publishes event)
Core Monolith (consumes from Kafka)
    ↓ (syncs event summary to PostgreSQL)
Analytics queries can now join business data + events
```

### Scenario 2: Manufacturer without System (Type B)

```
Manufacturer Web App (in Core Monolith)
    ↓ (user creates batch via UI)
Core Monolith Manufacturer Module
    ↓ (calls GS1 Service)
Core Monolith GS1 Service
    ↓ (generates batch number)
Core Monolith Manufacturer Module
    ↓ (saves to PostgreSQL)
Core Monolith → EPCIS Service
    ↓ (sends EPCIS event)
EPCIS Service → OpenSearch + Kafka
    ↓
Core Monolith (syncs event summary)
```

### Scenario 3: Journey Tracking (PPB)

```
PPB Regulator Module
    ↓ (queries journey by SSCC)
Core Monolith PostgreSQL
    ↓ (joins: shipment + packages + cases + batches + products)
    ↓ (joins: epcis_event_summary for event history)
Returns complete journey with:
  - Business data (quantities, dates, locations)
  - Event history (EPCIS events)
  - User details (manufacturer, distributor, facility)
Single query, no HTTP calls needed
```

---

## Detailed Step-by-Step Execution Plan

### Repository Setup Strategy

**Approach**: Create new system as nested git repository within current workspace
- Start as nested repo in `kenya-tnt-system/` folder
- Full access to existing codebase for reference
- Can copy UI components easily
- Eventually extract to separate repository when ready
- All documentation and plans remain accessible

**Location**: `/Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/`

---

### ✅ Phase 1: Repository & Project Setup (Week 1) - COMPLETED

**Status**: Repository structure created, UI components copied, Core Monolith initialized.

#### ✅ Step 1.1: Create Nested Git Repository Structure - COMPLETED

**Location**: Current workspace root

**Commands**:
```bash
# Navigate to current repo root
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis

# Create new system folder
mkdir kenya-tnt-system
cd kenya-tnt-system

# Initialize as nested git repository
git init
git branch -M main

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
build/
.env
.env.local
.env.*.local
*.log
.DS_Store
coverage/
.nyc_output/
*.swp
*.swo
*~
.vscode/
.idea/
EOF

# Create initial README
cat > README.md << 'EOF'
# Kenya National Track & Trace System

New architecture: Modular Monolith with Hexagonal Architecture

## Structure
- `core-monolith/` - Main application
- `integration-services/` - Integration adapters
- `ui-components/` - Reusable UI components (copied from parent repo)

## Reference
- Parent repo: `../` (existing microservices for reference)
- UI Components: `../epcis_track_and_trace_webapp/components/`
- EPCIS Service: `../epcis-service/` (OpenEPCIS - can be replaced with vendor solution)
- Architecture Plan: `../full-rearch-plan.md`
EOF

# Initial commit
git add .
git commit -m "Initial commit: Kenya TNT System structure"
```

**Deliverable**: ✅ Nested git repository initialized

---

#### ✅ Step 1.2: Copy UI Components from Existing Webapp - COMPLETED

**Purpose**: Reuse existing form system, tables, charts, and other components

**Commands**:
```bash
cd kenya-tnt-system
mkdir -p ui-components

# Copy form system (high value)
cp -r ../epcis_track_and_trace_webapp/components/forms ui-components/
cp -r ../epcis_track_and_trace_webapp/components/GenericTable.tsx ui-components/
cp -r ../epcis_track_and_trace_webapp/components/DataTable.tsx ui-components/

# Copy chart components
cp -r ../epcis_track_and_trace_webapp/components/chart ui-components/

# Copy UI primitives
cp -r ../epcis_track_and_trace_webapp/components/ui ui-components/

# Copy reusable components
cp ../epcis_track_and_trace_webapp/components/Button.tsx ui-components/
cp ../epcis_track_and_trace_webapp/components/Modal.tsx ui-components/
cp ../epcis_track_and_trace_webapp/components/ConfirmationModal.tsx ui-components/
cp ../epcis_track_and_trace_webapp/components/SuccessModal.tsx ui-components/
cp ../epcis_track_and_trace_webapp/components/LoadingDots.tsx ui-components/
cp ../epcis_track_and_trace_webapp/components/QRCodeComponent.tsx ui-components/
cp ../epcis_track_and_trace_webapp/components/SSCCBarcode.tsx ui-components/

# Copy layout components
cp -r ../epcis_track_and_trace_webapp/components/Layout.tsx ui-components/
cp -r ../epcis_track_and_trace_webapp/components/sidebar ui-components/
cp -r ../epcis_track_and_trace_webapp/components/navbar ui-components/

# Create reference documentation
cat > ui-components/README.md << 'EOF'
# UI Components

These components were copied from the parent repository's webapp.

## Source
- Original location: `../epcis_track_and_trace_webapp/components/`
- Copied on: [DATE]

## Components
- `forms/` - Dynamic form system (highly reusable)
- `GenericTable.tsx` - Reusable table component
- `chart/` - Chart components
- `ui/` - UI primitives (buttons, inputs, etc.)

## Usage
Import from this directory in the new system.
EOF
```

**Deliverable**: ✅ UI components copied and documented

---

#### ✅ Step 1.3: Initialize Core Monolith NestJS Project - COMPLETED

**Commands**:
```bash
cd kenya-tnt-system

# Create NestJS project structure
npx @nestjs/cli new core-monolith --skip-git --package-manager npm --skip-install

# Or create manually if preferred
mkdir -p core-monolith/src
cd core-monolith

# Initialize package.json
npm init -y

# Install NestJS dependencies
npm install @nestjs/common @nestjs/core @nestjs/platform-express \
  @nestjs/typeorm @nestjs/config @nestjs/jwt @nestjs/passport \
  passport passport-jwt bcrypt class-validator class-transformer \
  typeorm pg reflect-metadata rxjs

# Install dev dependencies
npm install -D @nestjs/cli @types/node @types/express typescript \
  ts-node ts-loader @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint prettier

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@modules/*": ["src/modules/*"]
    }
  }
}
EOF

# Create nest-cli.json
cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "tsconfig.json"
  }
}
EOF
```

**Deliverable**: ✅ Core Monolith project initialized

---

#### ✅ Step 1.4: Create Hexagonal Architecture Structure - COMPLETED

**Commands**:
```bash
cd kenya-tnt-system/core-monolith/src

# Create directory structure
mkdir -p modules/{regulator,manufacturer,distributor,auth,notification}
mkdir -p shared/{gs1,domain,infrastructure}
mkdir -p shared/domain/{entities,value-objects,services}
mkdir -p shared/infrastructure/{database,epcis,redis,external}
mkdir -p web/{manufacturer-web,distributor-web}
mkdir -p config
mkdir -p common/{decorators,filters,guards,interceptors,pipes}

# Create main app structure
cat > main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
EOF

# Create app.module.ts skeleton
cat > app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { GS1Module } from './shared/gs1/gs1.module';
import { AuthModule } from './modules/auth/auth.module';
import { RegulatorModule } from './modules/regulator/regulator.module';
import { ManufacturerModule } from './modules/manufacturer/manufacturer.module';
import { DistributorModule } from './modules/distributor/distributor.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    GS1Module,
    AuthModule,
    RegulatorModule,
    ManufacturerModule,
    DistributorModule,
    NotificationModule,
  ],
})
export class AppModule {}
EOF
```

**Deliverable**: ✅ Hexagonal architecture structure created

---

### ✅ Phase 2: EPCIS Service Abstraction Layer (Week 1-2) - COMPLETED

**Status**: Vendor-agnostic EPCIS adapter pattern implemented. Configured to connect to OpenEPCIS on port 8081.

#### ✅ Step 2.1: Create Vendor-Agnostic EPCIS Adapter Interface - COMPLETED

**Purpose**: Support both OpenEPCIS (current) and vendor EPCIS services (future)

**File**: `core-monolith/src/shared/infrastructure/epcis/epcis-adapter.interface.ts`

```typescript
// EPCIS Adapter Interface - Vendor Agnostic
export interface IEPCISAdapter {
  // Event Capture
  captureEvent(document: EPCISDocument): Promise<CaptureResponse>;
  captureEvents(documents: EPCISDocument[]): Promise<CaptureResponse[]>;
  
  // Event Query
  queryEvents(query: EPCISQuery): Promise<EPCISQueryDocument>;
  getEventById(eventId: string): Promise<EPCISEvent>;
  getEventsByEPC(epc: string, options?: QueryOptions): Promise<EPCISEvent[]>;
  
  // Health Check
  healthCheck(): Promise<boolean>;
  
  // Configuration
  configure(config: EPCISAdapterConfig): void;
}

export interface EPCISAdapterConfig {
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  authType: 'none' | 'basic' | 'bearer' | 'api-key';
  timeout?: number;
}
```

**Deliverable**: ✅ EPCIS adapter interface defined

---

#### ✅ Step 2.2: Implement OpenEPCIS Adapter - COMPLETED

**File**: `core-monolith/src/shared/infrastructure/epcis/openepcis.adapter.ts`

```typescript
import { Injectable, HttpService } from '@nestjs/axios';
import { IEPCISAdapter, EPCISAdapterConfig } from './epcis-adapter.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OpenEPCISAdapter implements IEPCISAdapter {
  private config: EPCISAdapterConfig;
  
  constructor(private readonly httpService: HttpService) {}
  
  configure(config: EPCISAdapterConfig): void {
    this.config = config;
  }
  
  async captureEvent(document: EPCISDocument): Promise<CaptureResponse> {
    const headers = this.buildHeaders();
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.config.baseUrl}/capture`,
        document,
        { headers }
      )
    );
    return response.data;
  }
  
  // ... implement other interface methods
}
```

**Deliverable**: ✅ OpenEPCIS adapter implemented

---

#### ✅ Step 2.3: Create Vendor EPCIS Adapter Template - COMPLETED

**File**: `core-monolith/src/shared/infrastructure/epcis/vendor-epcis.adapter.ts`

```typescript
// Template for vendor EPCIS service
// Replace with actual vendor SDK/API when needed
@Injectable()
export class VendorEPCISAdapter implements IEPCISAdapter {
  // Implement interface methods using vendor SDK
  // This allows switching EPCIS providers without changing business logic
}
```

**Deliverable**: ✅ Vendor adapter template created

---

#### ✅ Step 2.4: Create EPCIS Service Factory - COMPLETED

**File**: `core-monolith/src/shared/infrastructure/epcis/epcis-service.factory.ts`

```typescript
@Injectable()
export class EPCISServiceFactory {
  createAdapter(type: 'openepcis' | 'vendor', config: EPCISAdapterConfig): IEPCISAdapter {
    switch (type) {
      case 'openepcis':
        return new OpenEPCISAdapter(this.httpService);
      case 'vendor':
        return new VendorEPCISAdapter(config);
      default:
        throw new Error(`Unknown EPCIS adapter type: ${type}`);
    }
  }
}
```

**Configuration**: Use environment variable to switch adapters
```env
EPCIS_ADAPTER_TYPE=openepcis  # or 'vendor'
EPCIS_BASE_URL=http://localhost:8080
EPCIS_API_KEY=...
```

**Deliverable**: ✅ Factory pattern for EPCIS adapter selection

---

### ✅ Phase 3: GS1 Service Layer Implementation (Week 2) - COMPLETED

**Status**: All GS1 services implemented (SSCC, SGTIN, Batch Number, EPCIS Events, Barcode/QR Code generation). **Additional**: GLN Service also implemented.

#### ✅ Step 3.1: Create GS1 Module Structure - COMPLETED

**Commands**:
```bash
cd kenya-tnt-system/core-monolith/src/shared/gs1

# Create module files
touch gs1.module.ts
touch gs1.service.ts
touch sscc.service.ts
touch sgtin.service.ts
touch batch-number.service.ts
touch epcis-event.service.ts
touch barcode.service.ts
touch dto/
mkdir dto
```

**File**: `gs1.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { GS1Service } from './gs1.service';
import { SSCCService } from './sscc.service';
import { SGTINService } from './sgtin.service';
import { BatchNumberService } from './batch-number.service';
import { EPCISEventService } from './epcis-event.service';
import { BarcodeService } from './barcode.service';
import { EPCISModule } from '../infrastructure/epcis/epcis.module';

@Module({
  imports: [EPCISModule],
  providers: [
    GS1Service,
    SSCCService,
    SGTINService,
    BatchNumberService,
    EPCISEventService,
    BarcodeService,
  ],
  exports: [GS1Service],
})
export class GS1Module {}
```

**Deliverable**: ✅ GS1 module structure created

---

#### ✅ Step 3.2: Implement SSCC Service - COMPLETED

**File**: `sscc.service.ts`

**Reference**: Current implementation in `epcis-manufacturer-service/src/shipments/shipments.service.ts` (lines 44-75)

**Implementation Steps**:
1. Extract SSCC generation logic from existing services. Or enhance it. I am told by my developer that right now SSCC generation is random and not really based off of the GS1 company prefix, etc.
2. Implement GS1-compliant SSCC generation
3. Add validation
4. Add check digit calculation
5. Ensure uniqueness checking

**Key Features**:
- GS1-compliant format
- Check digit validation
- Uniqueness guarantee
- Company prefix support (for GS1 migration)

**Deliverable**: ✅ SSCC service implemented

---

#### ✅ Step 3.3: Implement SGTIN Service - COMPLETED

**File**: `sgtin.service.ts`

**Purpose**: Generate Serialized GTIN for unit-level tracking

**Implementation Steps**:
1. Implement SGTIN format: `urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber`
2. Validate GTIN format
3. Generate serial numbers
4. Create EPC URI format

**Deliverable**: ✅ SGTIN service implemented

---

#### ✅ Step 3.4: Implement Batch Number Service - COMPLETED

**File**: `batch-number.service.ts`

**Purpose**: Generate GS1-compliant batch numbers

**Implementation Steps**:
1. Generate unique batch numbers
2. Support GS1 batch identifier format
3. Ensure uniqueness per product
4. Validate batch number format

**Deliverable**: ✅ Batch number service implemented

---

#### ✅ Step 3.5: Implement EPCIS Event Service - COMPLETED

**File**: `epcis-event.service.ts`

**Purpose**: Create EPCIS 2.0 compliant events using EPCIS adapter

**Implementation Steps**:
1. Use EPCIS adapter interface (not direct HTTP calls)
2. Create AggregationEvent documents
3. Create ObjectEvent documents
4. Validate EPCIS document structure
5. Handle event creation errors

**Key**: Uses `IEPCISAdapter` interface, so works with any EPCIS provider

**Deliverable**: ✅ EPCIS event service implemented

---

#### ✅ Step 3.6: Implement Barcode Service - COMPLETED

**Additional**: GLN (Global Location Number) Service also implemented (not in original plan).

**File**: `barcode.service.ts`

**Purpose**: Generate barcodes and QR codes for GS1 identifiers

**Implementation Steps**:
1. Install barcode libraries (`jsbarcode`, `qrcode`)
2. Generate Code 128 barcodes
3. Generate Data Matrix codes
4. Generate QR codes
5. Support GS1 barcode formats

**Deliverable**: ✅ Barcode service implemented

---

### ✅ Phase 4: Database Setup & Schema Design (Week 2-3) - COMPLETED

**Status**: Single PostgreSQL database with PostGIS created. Consolidated schema with fixed numeric types. All domain entities created. Database migrations system in place.

#### ✅ Step 4.1: Create Single PostgreSQL Database - COMPLETED

**Commands**:
```bash
# Create database
createdb kenya_tnt_db

# Or via Docker
docker run --name kenya-tnt-postgres \
  -e POSTGRES_DB=kenya_tnt_db \
  -e POSTGRES_USER=tnt_user \
  -e POSTGRES_PASSWORD=tnt_password \
  -p 5433:5432 \
  -d postgres:15-alpine

# Enable PostGIS extension
psql -U tnt_user -d kenya_tnt_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

**Deliverable**: ✅ Single PostgreSQL database created with PostGIS

---

#### ✅ Step 4.2: Design Consolidated Schema - COMPLETED

**File**: `core-monolith/database/schema.sql`

**Steps**:
1. Design and create a consolidated schema. Take inspiration from 6 databases but enhance to be grear
2. Fix data types (string → numeric for quantities)
3. Add proper foreign key constraints
4. Add indexes
5. Add PostGIS columns for locations

**Key Changes**:
```sql
-- Fix quantity types
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  batchno VARCHAR(255) NOT NULL UNIQUE,
  expiry DATE NOT NULL,
  qty NUMERIC(15,2) NOT NULL,  -- Changed from VARCHAR
  sent_qty NUMERIC(15,2) DEFAULT 0,  -- Changed from VARCHAR
  user_id UUID NOT NULL,
  -- ... other fields
  CONSTRAINT fk_batch_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Add location columns with PostGIS
ALTER TABLE shipment 
ADD COLUMN pickup_location POINT,
ADD COLUMN destination_location POINT;

-- Add indexes
CREATE INDEX idx_shipment_pickup_date ON shipment(pickup_date);
CREATE INDEX idx_shipment_sscc ON shipment(sscc_barcode);
CREATE INDEX idx_batch_expiry ON batches(expiry);
CREATE INDEX idx_batch_product ON batches(product_id);
```

**Deliverable**: ✅ Consolidated schema designed (with migrations system)

---

#### ✅ Step 4.3: Create Database Module with TypeORM - COMPLETED

**File**: `core-monolith/src/shared/infrastructure/database/database.module.ts`

**Implementation Steps**:
1. Configure TypeORM with single database connection
2. Set up entity paths
3. Configure migrations
4. Set up connection pooling
5. Add health check

**Deliverable**: ✅ Database module configured

---

#### ✅ Step 4.4: Create Domain Entities - COMPLETED

**Location**: `core-monolith/src/shared/domain/entities/`

**Steps**:
1. Create base entity class
2. Create Product entity (reference from PPB service)
3. Create Batch entity (fix qty to numeric)
4. Create Case entity
5. Create Package entity
6. Create Shipment entity
7. Create User entity
8. Create RecallRequest entity

**Key**: Use proper types (NUMERIC, DATE, UUID) from the start

**Deliverable**: ✅ Domain entities created with correct types

**Additional**: Master Data entities (Supplier, Premise, LogisticsProvider) also created (not in original plan).

---

### ✅ Phase 5: Core Modules Implementation (Weeks 3-6) - COMPLETED

**Status**: Core modules implemented. Auth and Notification modules skipped as requested. **Additional**: Master Data module, Consignments feature, PPB Batch service, and Kafka consumer implemented (not in original plan).



#### ✅ Step 5.2: Implement Regulator Module - COMPLETED

**Reference**: `epcis-ppb-service/`

**Steps**:
1. ✅ Product catalog service (source of truth)
2. ✅ Journey tracking (single SQL query, no HTTP calls)
3. ✅ Recall management
4. ✅ Analytics endpoints
5. ✅ Remove HTTP calls to other services

**Key Changes**:
- Journey tracking: Single SQL query joining all tables
- Product catalog: Direct database access
- Analytics: Use materialized views

**Files to Create**:
- `modules/regulator/regulator.module.ts`
- `modules/regulator/products/products.service.ts`
- `modules/regulator/journey/journey.service.ts`
- `modules/regulator/recall/recall.service.ts`
- `modules/regulator/analytics/analytics.service.ts`

**Deliverable**: ✅ Regulator module implemented

---

#### ✅ Step 5.3: Implement Manufacturer Module - COMPLETED

**Reference**: `epcis-manufacturer-service/`

**Steps**:
1. ✅ Batch service (use GS1 Service for batch numbers)
2. ✅ Case service (use GS1 Service, direct DB access)
3. ✅ Package service (use GS1 Service)
4. ✅ Shipment service (use GS1 Service for SSCC)
5. ✅ Remove HTTP calls to PPB (direct DB access to products table)
6. ✅ Use EPCIS adapter (not direct HTTP to EPCIS service)

**Additional**: 
- ✅ Consignments feature implemented (not in original plan)
- ✅ PPB Batch service with Kafka consumer (not in original plan)
- ✅ PPB Consignment import (Option A JSON structure) with EPCIS event generation

**Key Changes**:
- Use GS1 Service Layer (not duplicate SSCC generation)
- Direct database access (no HTTP to PPB)
- Use EPCIS adapter interface
- Fix quantity types (numeric)

**Files to Create**:
- `modules/manufacturer/manufacturer.module.ts`
- `modules/manufacturer/batches/batch.service.ts`
- `modules/manufacturer/cases/case.service.ts`
- `modules/manufacturer/packages/package.service.ts`
- `modules/manufacturer/shipments/shipment.service.ts`

**Business Logic to Port**:
- Batch quantity validation: `availableQty = qty - sentQty`
- Case aggregation: batches → cases
- Package creation: cases → packages
- Shipment creation: packages → shipments

**Deliverable**: ✅ Manufacturer module implemented

---

#### ✅ Step 5.4: Implement Distributor Module - COMPLETED

**Reference**: `epcis-supplier-service/`

**Steps**:
1. ✅ Receive shipment service
2. ✅ Forward shipment service
3. ✅ Use GS1 Service for SSCC generation
4. ✅ Use EPCIS adapter for events
5. ✅ Direct database access (no HTTP calls)

**Key Changes**:
- Similar to manufacturer but for receiving/forwarding
- Use parent SSCC tracking
- Direct DB access

**Deliverable**: ✅ Distributor module implemented

---

### ✅ Phase 6: Integration Services (Weeks 7-8) - PARTIALLY COMPLETED

**Status**: Facility Integration Service completed. Manufacturer and Supplier integration services pending (see MANUFACTURER_SUPPLIER_INTEGRATION_ANALYSIS.md for hybrid approach).

#### ⏳ Step 6.1: Create Manufacturer Integration Service - NOT STARTED

**Location**: `kenya-tnt-system/integration-services/manufacturer-integration/`

**Steps**:
1. Create NestJS service structure
2. Create ERP adapter interface
3. Implement REST API endpoints
4. Implement data transformation (ERP → GS1)
5. Call Core Monolith GS1 Service (via HTTP or shared library)
6. Call Core Monolith Manufacturer Module (via HTTP)

**Endpoints**:
- `POST /api/integration/manufacturer/batches`
- `POST /api/integration/manufacturer/shipments`
- `POST /api/integration/manufacturer/cases`

**Deliverable**: ⏳ Manufacturer integration service created - NOT STARTED

---

#### ⏳ Step 6.2: Create Supplier Integration Service - NOT STARTED

**Similar to Manufacturer Integration Service**

**Deliverable**: ⏳ Supplier integration service created - NOT STARTED

---

#### ✅ Step 6.3: Create Facility Integration Service - COMPLETED

**Purpose**: Replace facility module - only receives events from LMIS

**Steps**:
1. ✅ Create lightweight service
2. ✅ Create LMIS adapter interface
3. ✅ Implement event receiving endpoints (unified endpoint for all event types)
4. ✅ Transform LMIS events → EPCIS format
5. ✅ Send to EPCIS Service via adapter
6. ✅ Update Core Monolith for journey tracking

**Endpoints**:
- ✅ `POST /api/integration/facility/events` - Unified endpoint for all LMIS event types (dispense, receive, adjust, stock_count, return, recall)

**Additional Features Implemented**:
- ✅ API key authentication
- ✅ 8 retry attempts with exponential backoff
- ✅ Location data persistence support
- ✅ Logging, metrics, and Swagger documentation
- ✅ Mapping specification document created (`FACILITY_INTEGRATION_MAPPING_SPEC.md`)

**Deliverable**: ✅ Facility integration service created (replaces facility module) - COMPLETED

---

### ✅ Phase 7: Analytics Schema & Optimization (Weeks 9-10) - PARTIALLY COMPLETED

**Status**: L5 TNT P0 analytics tables implemented. PostGIS enabled. Normalized EPCIS event structure implemented. Materialized views and star schema deferred to backlog (documented in SCHEMA_ENHANCEMENTS_BACKLOG.md).

#### ⏳ Step 7.1: Create Analytics Schema (Star Schema) - DEFERRED TO BACKLOG

**File**: `core-monolith/database/analytics-schema.sql`

**Status**: Documented in `SCHEMA_ENHANCEMENTS_BACKLOG.md` (Section 11.2). Will be implemented when analytics requirements are prioritized.

**Steps**:
1. Create fact_shipment table
2. Create dimension tables (manufacturer, distributor, product, facility, time)
3. Create ETL process to populate fact/dimension tables
4. Set up scheduled ETL jobs

**Deliverable**: ⏳ Analytics schema created - DEFERRED TO BACKLOG (documented)

---

#### ⏳ Step 7.2: Create Materialized Views - NOT STARTED

**File**: `core-monolith/database/materialized-views.sql`

**Views to Create**:
1. `shipment_analytics` - Pre-aggregated shipment data
2. `batch_analytics` - Batch statistics
3. `product_journey_analytics` - Product journey aggregations
4. `recall_analytics` - Recall statistics

**Refresh Strategy**: Daily or on-demand

**Deliverable**: ⏳ Materialized views created - NOT STARTED (backlog documented in SCHEMA_ENHANCEMENTS_BACKLOG.md)

---

#### ✅ Step 7.3: Implement EPCIS Event Sync - COMPLETED (Dual Write Strategy)

**Purpose**: Sync EPCIS events to PostgreSQL for analytics

**Implementation**: Dual write strategy (not Kafka consumer)
1. ✅ EPCIS events written to OpenEPCIS (primary)
2. ✅ Event summaries written to normalized PostgreSQL tables (secondary)
3. ✅ Normalized structure: `epcis_events` + `epcis_event_epcs` (replaces denormalized `epcis_event_summary`)
4. ✅ Actor context included (actor_type, actor_user_id, actor_gln, actor_organization)
5. ✅ 8 retry attempts with exponential backoff
6. ✅ Idempotency checks

**Migrations**:
- ✅ `V6__Normalize_EPCIS_Event_Structure.sql` - Creates normalized tables
- ✅ `V7__Fix_L5_TNT_Product_FKs_And_Remove_Legacy_Tables.sql` - Removes legacy `epcis_event_summary` table

**File**: `core-monolith/src/shared/gs1/epcis-event.service.ts`

**Deliverable**: ✅ EPCIS event sync implemented (dual write to normalized tables) - COMPLETED

---

#### ✅ Step 7.4: Add PostGIS for Location Analytics - PARTIALLY COMPLETED

**Steps**:
1. ✅ Enable PostGIS extension (done in schema)
2. ✅ Add location columns to shipment table (pickup_location_point, destination_location_point)
3. ⏳ Create spatial indexes - NOT STARTED
4. ⏳ Implement location-based queries - NOT STARTED
5. ⏳ Add distance calculations - NOT STARTED

**Deliverable**: ⚠️ Location analytics partially enabled (schema ready, queries pending)

---

### ✅ Phase 8: Full Applications for Type B Users (Weeks 11-12) - COMPLETED

**Status**: All three web applications (Manufacturer, Distributor, Regulator/PPB) have been created in the separate Next.js frontend app (`frontend/`). All module UIs are implemented with full CRUD operations, forms, and integration with Core Monolith APIs.

#### ✅ Step 8.1: Create Manufacturer Web Application - COMPLETED

**Location**: `frontend/app/manufacturer/` (separate Next.js app)

**Completed**:
1. ✅ Next.js project structure (already existed)
2. ✅ UI components from `ui-components/` (already copied)
3. ✅ Batch creation form (`/manufacturer/batches`) - Full CRUD with DynamicForm
4. ✅ Case aggregation UI (`/manufacturer/cases`) - Create cases with products
5. ✅ Package creation UI (`/manufacturer/packages`) - Create packages with cases
6. ✅ Shipment creation UI (`/manufacturer/shipments`) - Create shipments with SSCC display and dispatch functionality
7. ✅ Integration with Manufacturer Module via REST API (`manufacturerApi`)

**Features Implemented**:
- ✅ Batch creation with GS1 batch numbers (auto-generated if not provided)
- ✅ SSCC generation and display (via GS1 Service through API)
- ✅ Barcode/QR code display (SSCCBarcode component)
- ✅ Shipment dispatch functionality
- ✅ Navigation layout with module-specific menu

**Deliverable**: ✅ Manufacturer web app created (including consignments page)

---

#### ✅ Step 8.2: Create Distributor Web Application - COMPLETED

**Location**: `frontend/app/distributor/` (separate Next.js app)

**Completed**:
1. ✅ Shipment receive UI (`/distributor/shipments`) - Receive shipments from manufacturers using parent SSCC
2. ✅ Shipment forward UI - Forward received shipments to facilities
3. ✅ Integration with Distributor Module via REST API (`distributorApi`)
4. ✅ Navigation layout

**Features Implemented**:
- ✅ Receive shipments by parent SSCC
- ✅ Forward shipments to facilities
- ✅ View received shipments list
- ✅ SSCC barcode display

**Deliverable**: ✅ Distributor web app created

---

#### ✅ Step 8.3: Create Regulator/PPB Web Application - COMPLETED

**Location**: `frontend/app/regulator/` (separate Next.js app)

**Completed**:
1. ✅ Product catalog management UI (`/regulator/products`) - Full CRUD operations
2. ✅ Journey tracking UI (`/regulator/journey`) - SSCC lookup with event visualization
3. ✅ Recall management UI (`/regulator/recall`) - Create and manage recalls with status updates
4. ✅ Analytics dashboards (`/regulator/analytics`) - Dashboard with metrics and charts
5. ✅ Integration with Regulator Module via REST API (`regulatorApi`)
6. ✅ Navigation layout with all regulator pages

**Features Implemented**:
- ✅ Product catalog CRUD (source of truth) - Create, view, delete products
- ✅ Journey tracking by SSCC (POST request with SSCC, displays full journey with events)
- ✅ Recall creation and management - Create recalls, update status (PENDING → IN_PROGRESS → COMPLETED)
- ✅ Analytics dashboards - Total products, batches, shipments, recalls, expired batches, shipments by status
- ✅ Chart components integration (ProductBarChart, MonthlyEarningsChart)
- ⏳ Compliance reports (UI structure ready, backend integration pending)
- ⏳ Integration with government systems (KRA, KEBS) - Backend integration pending

**Deliverable**: ✅ Regulator/PPB web app created

---

**Phase 8 Summary**:
- ✅ All three web applications fully implemented
- ✅ All pages created with proper navigation
- ✅ API client utilities created and integrated
- ✅ Forms using DynamicForm component
- ✅ Tables using GenericTable component
- ✅ SSCC barcode display integrated
- ✅ Error handling and loading states
- ✅ Module-specific layouts with navigation
- ✅ Home page updated with links to all modules


### ⏳ Phase 9: Testing & Validation (Weeks 13-14) - PENDING

**Status**: Not started. No test files found in codebase.

#### ⏳ Step 9.1: Unit Testing - NOT STARTED

**Steps**:
1. Test GS1 Service Layer
2. Test each module independently
3. Test EPCIS adapter (mock interface)
4. Test database operations
5. Achieve 80%+ code coverage

**Deliverable**: ⏳ Unit tests written - NOT STARTED

---

#### ⏳ Step 9.2: Integration Testing - NOT STARTED

**Steps**:
1. Test module interactions
2. Test EPCIS event flow
3. Test database transactions
4. Test integration services
5. Test analytics queries

**Deliverable**: ⏳ Integration tests written - NOT STARTED

---

#### ⏳ Step 9.3: Performance Testing - NOT STARTED

**Steps**:
1. Load test with 100K events/day
2. Test analytics query performance
3. Test journey tracking performance
4. Optimize slow queries
5. Add missing indexes

**Deliverable**: ⏳ Performance validated - NOT STARTED

---

#### ⏳ Step 9.4: GS1 Compliance Testing - NOT STARTED

**Steps**:
1. Validate SSCC format with GS1 tools
2. Validate SGTIN format
3. Validate EPCIS event structure
4. Test with GS1 validation services
5. Fix any compliance issues

**Deliverable**: ⏳ GS1 compliance verified - NOT STARTED

---

### ⚠️ Phase 10: Documentation & Deployment Prep (Weeks 15-16) - PARTIALLY COMPLETED

**Status**: API documentation (Swagger) completed. Setup documentation exists. Deployment and user documentation pending.

#### ✅ Step 10.1: Create API Documentation - COMPLETED

**Steps**:
1. ✅ Set up Swagger/OpenAPI (configured in main.ts)
2. ✅ Document all endpoints (Swagger annotations on controllers)
3. ✅ Document GS1 Service API (via Swagger)
4. ⏳ Document Integration Service APIs - NOT APPLICABLE (not implemented)
5. ⏳ Create Postman collection - NOT STARTED

**Deliverable**: ✅ API documentation complete (Swagger UI available at /api/docs)

---

#### ⏳ Step 10.2: Create Deployment Documentation - NOT STARTED

**Steps**:
1. Document deployment process
2. Create Docker configurations
3. Document environment variables
4. Create deployment scripts
5. Document database migration process

**Deliverable**: ⏳ Deployment docs complete - NOT STARTED (setup docs exist: SETUP.md, QUICK_SETUP.md)

---

#### ⏳ Step 10.3: Create User Documentation - NOT STARTED

**Steps**:
1. Document for Type B users (manufacturers without systems)
2. Document for Type A users (integration guide)
3. Create video tutorials
4. Create FAQ

**Deliverable**: ⏳ User documentation complete - NOT STARTED

---

### ⏳ Phase 11: Extract to Separate Repository (When Ready) - PENDING

**Status**: Repository is nested in workspace. Extraction pending.

#### ⏳ Step 11.1: Prepare for Extraction - NOT STARTED

**Commands**:
```bash
cd kenya-tnt-system

# Ensure all code is committed
git add .
git commit -m "Ready for extraction"

# Create remote repository (on GitHub/GitLab)
# Then add remote
git remote add origin git@github.com:your-org/kenya-tnt-system.git

# Push to remote
git push -u origin main
```

#### Step 11.2: Update Parent Repository

**Commands**:
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis

# Option A: Keep as reference (add to .gitignore)
echo "kenya-tnt-system/" >> .gitignore

# Option B: Convert to git submodule
git submodule add git@github.com:your-org/kenya-tnt-system.git kenya-tnt-system
```

**Deliverable**: ⏳ Repository extracted and ready for independent development - NOT STARTED

---

#### ⏳ Step 11.2: Update Parent Repository - NOT STARTED

**Deliverable**: ⏳ Parent repository updated - NOT STARTED

---

## EPCIS Vendor Agnostic Design

### Adapter Pattern Implementation

**Key Design Decision**: All EPCIS interactions go through `IEPCISAdapter` interface

**Benefits**:
- Can switch from OpenEPCIS to vendor solution without code changes
- Easy to test (mock adapter)
- Supports multiple EPCIS providers simultaneously
- Future-proof for vendor selection

**Configuration**:
```env
# Current: OpenEPCIS
EPCIS_ADAPTER_TYPE=openepcis
EPCIS_BASE_URL=http://localhost:8080

# Future: Vendor Solution
EPCIS_ADAPTER_TYPE=vendor
EPCIS_BASE_URL=https://vendor-epcis-api.com
EPCIS_API_KEY=...
EPCIS_API_SECRET=...
```

**Implementation**:
- All modules use `IEPCISAdapter` interface
- Factory pattern selects adapter based on config
- No direct HTTP calls to EPCIS service in business logic
- Easy to swap adapters

---

## Execution Checklist

### ✅ Phase 1: Repository & Project Setup (Week 1) - COMPLETED
- [x] Create nested git repository
- [x] Copy UI components
- [x] Initialize Core Monolith
- [x] Create Hexagonal Architecture structure
- [x] Create EPCIS adapter interface
- [x] Implement OpenEPCIS adapter

### ✅ Phase 2: EPCIS Service Abstraction Layer (Week 1-2) - COMPLETED
- [x] Create vendor-agnostic EPCIS adapter interface
- [x] Implement OpenEPCIS adapter
- [x] Create vendor EPCIS adapter template
- [x] Create EPCIS service factory
- [x] Configure EPCIS connection (port 8081)

### ✅ Phase 3: GS1 Service Layer Implementation (Week 2) - COMPLETED
- [x] Create GS1 module structure
- [x] Implement SSCC service
- [x] Implement SGTIN service
- [x] Implement Batch Number service
- [x] Implement EPCIS Event service
- [x] Implement Barcode service
- [x] Create unified GS1 service
- [x] Implement GLN service (additional, not in original plan)

### ✅ Phase 4: Database Setup & Schema Design (Week 2-3) - COMPLETED
- [x] Create single PostgreSQL database (Docker with PostGIS)
- [x] Design consolidated schema
- [x] Fix data types (VARCHAR → NUMERIC for quantities)
- [x] Add PostGIS columns for locations
- [x] Create database module with TypeORM
- [x] Create domain entities (all tables)
- [x] Run schema migration

### ✅ Phase 5: Core Modules Implementation (Weeks 3-6) - COMPLETED
- [x] Implement Regulator Module
  - [x] Products service (PPB publishes product catalog)
  - [x] Journey tracking service (single SQL query)
  - [x] Recall management service
  - [x] Analytics service
  - [x] PPB Batch service (additional, not in original plan)
- [x] Implement Manufacturer Module
  - [x] Batch service (calls PPB API for products, uses GS1 Service)
  - [x] Case service (uses GS1 Service, numeric quantities)
  - [x] Package service (uses GS1 Service)
  - [x] Shipment service (uses GS1 Service for SSCC)
  - [x] Consignments service (additional, not in original plan)
  - [x] PPB Approved Batches API (additional, not in original plan)
- [x] Implement Distributor Module
  - [x] Receive shipment service (direct DB query)
  - [x] Forward shipment service (new SSCC generation)
- [x] Implement Master Data Module (additional, not in original plan)
  - [x] Supplier management
  - [x] Premise management
  - [x] Logistics Provider management
  - [x] Product catalog (PPB products)
- [x] Implement L5 TNT Analytics Module (additional, not in original plan)
  - [x] Product status tracking (P0)
  - [x] Product destruction tracking (P0)
  - [x] Product returns tracking (P0)
  - [x] Product verifications tracking (P0)
  - [x] Facility operations tracking (P0) - receiving, dispensing, inventory
- [x] Implement Kafka Consumer (additional, not in original plan)
  - [x] Multi-topic consumer for PPB data streams
  - [x] PPB batch data ingestion
  - [x] Manufacturer, Supplier, Premise data sync
  - [x] PPB consignment instantiation handler
- [ ] Implement Auth Module - **SKIPPED** (as requested)
- [ ] Implement Notification Module - **SKIPPED** (as requested)


### ✅ Phase 6: Full Applications for Type B Users (Weeks 11-12) - COMPLETED
- [x] Create Next.js frontend application
- [x] Copy UI components to frontend
- [x] Create basic home page
- [x] Create Manufacturer Web App (full UI) - All pages: batches, cases, packages, shipments, consignments
- [x] Create Distributor Web App (full UI) - Shipments page
- [x] Create Regulator/PPB Web App (full UI) - Products, journey, recall, analytics pages
- [x] Test full applications (manual testing via UI)

### ✅ Phase 6: Integration Services for Type A users (Weeks 7-8) - PARTIALLY COMPLETED
- [x] Create Facility Integration Service - ✅ COMPLETED
  - ✅ Unified endpoint for all LMIS event types (dispense, receive, adjust, stock_count, return, recall)
  - ✅ Business event → EPCIS transformation
  - ✅ Location data persistence support
  - ✅ 8 retry attempts with exponential backoff
  - ✅ API key authentication
  - ✅ Logging, metrics, and Swagger documentation
  - ✅ Mapping specification document created (`FACILITY_INTEGRATION_MAPPING_SPEC.md`)
- [ ] Create Manufacturer Integration Service (Hybrid approach - see MANUFACTURER_SUPPLIER_INTEGRATION_ANALYSIS.md) - ⏳ PENDING
  - [ ] Support business events → EPCIS (for Type B manufacturers)
  - [ ] Support direct EPCIS validation (for Type A manufacturers)
- [ ] Create Supplier Integration Service - ⏳ PENDING
  - [ ] Business events → EPCIS transformation
  - [ ] Forward shipment handling

**Note**: See `MANUFACTURER_SUPPLIER_INTEGRATION_ANALYSIS.md` for architecture analysis and recommended hybrid approach.

### ✅ Phase 7: Analytics Schema & Optimization (Weeks 9-10) - PARTIALLY COMPLETED
- [x] Implement EPCIS Event Sync - ✅ COMPLETED (Dual write to normalized tables)
  - ✅ Normalized event structure (`epcis_events` + `epcis_event_epcs`)
  - ✅ Actor context in events (P0)
  - ✅ 8 retry attempts with exponential backoff
  - ✅ Legacy `epcis_event_summary` table removed
- [x] Add PostGIS for location analytics - ✅ COMPLETED (schema ready, queries pending)
- [x] Implement L5 TNT Analytics Tables (P0) - ✅ COMPLETED
  - ✅ Product status tracking
  - ✅ Product destruction tracking
  - ✅ Product returns tracking
  - ✅ Product verifications tracking
  - ✅ Facility operations tracking (receiving, dispensing, inventory)
- [x] Database schema cleanup - ✅ COMPLETED
  - ✅ Removed legacy `products` table (replaced by `ppb_products`)
  - ✅ Removed legacy `epcis_event_summary` table (replaced by normalized structure)
  - ✅ Fixed all foreign keys to reference `ppb_products`
  - ✅ Recreated `ppb_product_to_program_mapping` table
- [ ] Create Analytics Schema (Star Schema) - ⏳ DEFERRED TO BACKLOG (documented in SCHEMA_ENHANCEMENTS_BACKLOG.md)
- [ ] Create Materialized Views - ⏳ DEFERRED TO BACKLOG (documented in SCHEMA_ENHANCEMENTS_BACKLOG.md)


### ⏳ Phase 9: Testing & Validation (Weeks 13-14) - PENDING
- [ ] Unit testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] GS1 compliance testing

### ⚠️ Phase 10: Documentation & Deployment Prep (Weeks 15-16) - PARTIALLY COMPLETED
- [x] Create API documentation (Swagger) - Fully configured and working
- [x] Create setup documentation (SETUP.md, QUICK_SETUP.md, START_HERE.md)
- [ ] Create deployment documentation
- [ ] Create user documentation

### ⏳ Phase 11: Extract to Separate Repository - PENDING
- [ ] Prepare for extraction
- [ ] Update parent repository

### 🔄 Phase 12: Integration Services Extraction (Future Enhancement) - PLANNED
**Status**: Optional - Only if scaling needs arise

- [ ] Extract Facility Integration Service to separate microservice (if needed)
- [ ] Extract Manufacturer Integration Service to separate microservice (if needed)
- [ ] Extract Supplier Integration Service to separate microservice (if needed)
- [ ] Create shared integration service library
- [ ] Implement service-to-service communication
- [ ] Add API gateway for integration services

**Note**: Current implementation uses adapter pattern within Core Monolith, making future extraction straightforward if needed. See `MANUFACTURER_SUPPLIER_INTEGRATION_ANALYSIS.md` for detailed analysis.

---

## Key Implementation Notes

### EPCIS Vendor Support

**Current**: OpenEPCIS (open source)
**Future**: Any vendor EPCIS service

**How to Switch**:
1. Implement `VendorEPCISAdapter` using vendor SDK
2. Update `EPCIS_ADAPTER_TYPE` environment variable
3. No code changes in business logic needed

**Testing Vendor Adapter**:
- Create mock vendor adapter for testing
- Test with vendor sandbox environment
- Validate EPCIS 2.0 compliance

### Nested Repository Benefits

1. **Same IDE**: All code accessible in one workspace
2. **Easy Reference**: Can read existing code patterns
3. **Easy Copy**: Can copy UI components directly
4. **Documentation**: All plans and docs in parent repo
5. **Clean Separation**: Own git history, can extract later

### Migration from Existing Code

**Copy**:
- UI components (forms, tables, charts)
- Business logic patterns (reference, rewrite cleanly)
- Domain entity structures (fix types)

**Don't Copy**:
- Microservice structure
- HTTP service calls
- Database schemas (fix from start)
- Duplicate code

---

This execution plan provides detailed, actionable steps for building the new system from scratch while leveraging existing components and maintaining vendor flexibility for EPCIS services.

---

## Benefits of New Architecture

### Analytics Benefits

1. **Single Database**: All data in one place, SQL joins possible
2. **Fixed Schema**: Numeric types, proper indexes, geographic data
3. **Denormalized Views**: Pre-aggregated data for fast queries
4. **Event Integration**: EPCIS events synced to PostgreSQL
5. **Star Schema**: Analytics-optimized schema
6. **Materialized Views**: Fast dashboard queries

### Performance Benefits

1. **No HTTP Overhead**: Direct method calls between modules
2. **Single Query**: Journey tracking in one SQL query
3. **Optimized Queries**: Proper indexes and materialized views
4. **Reduced Latency**: No network calls for internal operations

### Operational Benefits

1. **Single Deployment**: Core Monolith = one deployment unit
2. **Easier Debugging**: All code in one codebase
3. **Better Testing**: Can test modules together
4. **Simpler Monitoring**: One service to monitor (core monolith)
5. **Easier Backup**: One database to backup

### Integration Benefits

1. **Flexible Integration**: Integration services handle different systems
2. **GS1 Functionality**: Centralized, reusable GS1 services
3. **Support Both Types**: Type A (with systems) and Type B (without systems)
4. **Migration Path**: Start with full apps, add integrations as needed

### Business Benefits

1. **Faster Analytics**: Regulatory reports in seconds, not minutes
2. **Better Insights**: Can analyze across entire supply chain
3. **Easier Compliance**: Single source of truth
4. **Scalability**: Can handle 100K-1M events/day
5. **Cost Effective**: Fewer services to manage

---

## Technical Specifications

### Technology Stack

**Core Monolith**:
- Framework: NestJS (TypeScript)
- Database: PostgreSQL 15+ (with PostGIS extension)
- ORM: TypeORM
- Architecture: Hexagonal (Ports & Adapters)

**Integration Services**:
- Framework: NestJS (TypeScript)
- Lightweight services
- Can be deployed separately or as part of monolith

**EPCIS Service**:
- Framework: Quarkus (Java)
- Storage: OpenSearch
- Streaming: Kafka
- Keep separate (different tech stack)

**Frontend**:
- Framework: Next.js (TypeScript)
- Can be part of monolith or separate

### Database Schema

**Core Tables** (in single PostgreSQL database):
- `users` (auth)
- `products` (regulator)
- `batches` (manufacturer/distributor)
- `case` (manufacturer/distributor)
- `cases_products` (junction)
- `packages` (manufacturer/distributor)
- `shipment` (manufacturer/distributor)
- `shipment_products` (junction)
- `recall_requests` (regulator)
- `ppb_activity_logs` (notification)
- `batch_notification_settings` (notification)
- `epcis_event_summary` (synced from EPCIS)

**Analytics Tables**:
- `fact_shipment` (fact table)
- `dim_manufacturer` (dimension)
- `dim_distributor` (dimension)
- `dim_product` (dimension)
- `dim_facility` (dimension)
- `dim_time` (dimension)

**Materialized Views**:
- `shipment_analytics`
- `batch_analytics`
- `product_journey_analytics`
- `recall_analytics`

### GS1 Service API

```typescript
interface GS1Service {
  // SSCC Generation
  generateSSCC(companyPrefix: string): Promise<string>;
  validateSSCC(sscc: string): Promise<boolean>;
  
  // SGTIN Generation
  generateSGTIN(gtin: string, serialNumber: string): Promise<string>;
  validateSGTIN(sgtin: string): Promise<boolean>;
  
  // Batch Management
  generateBatchNumber(productId: number, userId: string): Promise<string>;
  validateBatchNumber(batchNo: string): Promise<boolean>;
  
  // EPCIS Events
  createAggregationEvent(data: AggregationEventData): Promise<EPCISDocument>;
  createObjectEvent(data: ObjectEventData): Promise<EPCISDocument>;
  
  // Barcode Generation
  generateBarcode(epc: string, format: BarcodeFormat): Promise<Buffer>;
  generateQRCode(epc: string): Promise<Buffer>;
}
```

### Integration Service API

```typescript
// Manufacturer Integration Service
interface ManufacturerIntegrationAPI {
  // Receive batch from ERP
  POST /api/integration/manufacturer/batches
  Body: {
    productCode: string;
    quantity: number;
    expiryDate: string;
    productionDate: string;
    // ... other ERP fields
  }
  
  // Receive shipment from ERP
  POST /api/integration/manufacturer/shipments
  Body: {
    packages: Array<{
      cases: Array<{
        batches: Array<{
          batchNumber: string;
          quantity: number;
        }>;
      }>;
    }>;
    destination: string;
    carrier: string;
    // ... other ERP fields
  }
}
```

---

## Risk Mitigation

### Risks and Mitigations

1. **Risk**: Database migration complexity
   - **Mitigation**: Phased migration, comprehensive testing, rollback plan

2. **Risk**: Integration service complexity
   - **Mitigation**: Start simple, add complexity gradually, use adapters pattern

3. **Risk**: Performance degradation during migration
   - **Mitigation**: Run in parallel initially, gradual cutover, performance monitoring

4. **Risk**: External system integration challenges
   - **Mitigation**: Flexible adapter pattern, support multiple formats, comprehensive documentation

5. **Risk**: GS1 compliance issues
   - **Mitigation**: Use GS1 standards library, validation at every step, testing with GS1 tools

---

## Success Metrics

### Performance Metrics

- **Analytics Query Time**: < 2 seconds for complex journey queries (currently: 10-30 seconds)
- **Event Processing**: Handle 100K-1M events/day
- **API Response Time**: < 500ms for 95th percentile
- **Database Query Time**: < 100ms for simple queries

### Business Metrics

- **Regulatory Compliance**: 100% of shipments tracked
- **Integration Success**: 80%+ of Type A manufacturers integrated within 6 months
- **User Adoption**: 90%+ of Type B manufacturers using system within 3 months
- **Data Quality**: 99.9% data accuracy

---

## Conclusion

This re-architecture plan addresses the critical issues in the current microservices architecture while supporting Kenya's specific context:

1. **Analytics Ready**: Single database, proper schema, materialized views
2. **GS1 Functionality**: Centralized GS1 Service Layer for all stakeholders
3. **Flexible Integration**: Integration services for existing systems
4. **Full Applications**: Complete UI for stakeholders without systems
5. **Scalable**: Can handle 100K-1M events/day
6. **Maintainable**: Modular monolith with hexagonal architecture

The hybrid approach provides the best of both worlds:
- **Core Monolith**: Single database, direct method calls, better analytics
- **Integration Services**: Flexibility for external system integration
- **GS1 Service Layer**: Centralized GS1 functionality for all

This architecture supports Kenya's GS1 migration while accommodating both sophisticated manufacturers with existing systems and smaller manufacturers without systems.

