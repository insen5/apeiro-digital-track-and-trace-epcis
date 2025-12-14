# EPCIS Track and Trace System Architecture

## Overview

This is a distributed microservices architecture for pharmaceutical track and trace using EPCIS (Electronic Product Code Information Services) standards. The system enables end-to-end visibility of pharmaceutical products from manufacturing through distribution to end-user facilities.

## Service Boundaries

### Backend Services (NestJS)

1. **epcis-auth-service**
   - **Purpose**: Authentication and user management
   - **Key Features**: JWT-based auth, Keycloak integration, user CRUD operations
   - **Database**: PostgreSQL (users, roles)

2. **epcis-manufacturer-service**
   - **Purpose**: Manufacturer operations
   - **Key Features**: Batch creation, case aggregation, package management, shipment creation
   - **Database**: PostgreSQL (batches, cases, packages, shipments)
   - **EPCIS Integration**: Sends AggregationEvents for case creation and shipment dispatch

3. **epcis-supplier-service** (CPA - Central Procurement Agency)
   - **Purpose**: Supplier/CPA operations
   - **Key Features**: Case aggregation, package management, shipment forwarding
   - **Database**: PostgreSQL (batches, cases, packages, shipments)
   - **EPCIS Integration**: Sends AggregationEvents for case and shipment operations

4. **epcis-ppb-service** (Pharmacy and Poisons Board)
   - **Purpose**: Regulatory oversight and product catalog management
   - **Key Features**: Product catalog, batch tracking, journey tracking, recall management
   - **Database**: PostgreSQL (products, batches, recall_requests)
   - **EPCIS Integration**: Receives and queries EPCIS events for journey tracking

5. **epcis-user-facility-service**
   - **Purpose**: End-user facility operations (hospitals, clinics)
   - **Key Features**: Shipment receiving, batch tracking, product management
   - **Database**: PostgreSQL (batches, shipments, shipment_products)
   - **EPCIS Integration**: Sends receiving events, queries product history

6. **epcis-notification-service**
   - **Purpose**: Notifications and batch expiry warnings
   - **Key Features**: Email notifications, batch expiry monitoring, activity logging
   - **Database**: PostgreSQL (activity logs, notification settings)
   - **Scheduling**: Cron jobs for batch expiry checks

### Core EPCIS Service (Java/Quarkus)

7. **epcis-service**
   - **Purpose**: EPCIS event capture, validation, persistence, and querying
   - **Technology**: Quarkus, Kafka Streams, OpenSearch
   - **Key Features**:
     - Event capture via REST API (`/capture`)
     - Event validation (schema, duplication, integrity)
     - Event persistence to OpenSearch
     - Event querying via EPCIS Query Interface
     - Kafka Streams-based event processing pipeline
   - **Storage**: OpenSearch (event repository)

### Frontend

8. **epcis_track_and_trace_webapp**
   - **Purpose**: Web UI for all stakeholders
   - **Technology**: Next.js, React, TypeScript
   - **Key Features**: Role-based dashboards, product tracking, shipment management, analytics

## Ports & Dependencies

### Service Ports (Configurable via Environment Variables)

| Service | Default Port | Environment Variable |
|---------|-------------|---------------------|
| epcis-auth-service | 3000 | `PORT` or `APP_PORT` |
| epcis-manufacturer-service | 3000 | `PORT` or `APP_PORT` |
| epcis-supplier-service | 3000 | `PORT` or `APP_PORT` |
| epcis-ppb-service | 3000 | `PORT` or `APP_PORT` |
| epcis-user-facility-service | 3000 | `PORT` or `APP_PORT` |
| epcis-notification-service | 3000 | `PORT` or `APP_PORT` |
| epcis-service (REST API) | 8080 | Quarkus default |
| Kafka | 9092 | Docker compose |
| OpenSearch | 9200 | Docker compose |
| OpenSearch Dashboards | 5601 | Docker compose |

### Infrastructure Dependencies

- **PostgreSQL**: Each NestJS service has its own database
- **Redis**: Caching and session management (used by auth and notification services)
- **Kafka**: Event streaming (used by epcis-service)
- **OpenSearch**: Event storage and indexing (used by epcis-service)
- **Keycloak**: Identity and access management (optional, can use JWT directly)

### Service-to-Service Dependencies

```
Frontend (Next.js)
  ├──> Auth Service (JWT validation)
  ├──> Manufacturer Service
  ├──> Supplier Service
  ├──> PPB Service
  └──> User Facility Service

Manufacturer/Supplier/User Facility Services
  ├──> Auth Service (user validation)
  ├──> PPB Service (product catalog via SharedProductService)
  └──> EPCIS Service (event capture)

PPB Service
  ├──> Auth Service (user validation)
  ├──> Manufacturer Service (journey tracking)
  ├──> Supplier Service (journey tracking)
  ├──> User Facility Service (journey tracking)
  └──> EPCIS Service (event querying)

Notification Service
  ├──> Auth Service (user lookup)
  ├──> PPB Service (product/batch data via SharedProductService)
  └──> Mail Service (SMTP)

EPCIS Service
  ├──> Kafka (event streaming)
  └──> OpenSearch (event storage)
```

## Kafka Topics

### Topic List

The following topics are created during Kafka setup (`docker-compose.kafka-setup.yml`):

1. **capture-document-event** - Individual document events
2. **capture-document-event-count** - Event count metrics
3. **capture-documents** - Captured document aggregations
4. **capture-documents-agg** - Aggregated capture documents
5. **epcis-event-captured** - Raw captured EPCIS events
6. **epcis-event-persisted** - Successfully persisted events
7. **epcis-event-validated** - Validation results (routed to success/failure)
8. **epcis-event-validated-failure** - Failed validation events
9. **epcis-event-validated-success** - Successfully validated events
10. **streaming-subscription** - WebSocket subscription events
11. **event-saved** - Final saved events (consumed by multiple groups)
12. **epcis-event-capture-queue** - Incoming capture queue

### Topic Usage

- **epcis-event-captured** → Validation → **epcis-event-validated-success/failure**
- **epcis-event-validated-success** → Persistence → **epcis-event-persisted** → **event-saved**
- **event-saved** → Consumed by:
  - `streaming-consumer-group`: Real-time subscriptions
  - `epc-consumer-group`: EPC indexing

## Shared DTOs / Event Schemas

### EPCIS AggregationEvent Schema

```typescript
interface AggregationEvent {
  eventID: string;                    // UUID format: urn:uuid:...
  type: 'AggregationEvent';
  eventTime: string;                 // ISO 8601 timestamp
  eventTimeZoneOffset: string;       // e.g., '+04:00'
  parentID: string;                  // EPC URI: https://example.com/cases/{label}
  childEPCs: string[];               // Array of EPC URIs: https://example.com/batches/{batchno}
  action: string;                    // 'ADD' | 'DELETE' | 'OBSERVE'
  bizStep?: string;                  // e.g., 'packing', 'shipping', 'receiving'
  disposition?: string;              // e.g., 'in_progress', 'in_transit', 'in_use'
  bizTransactionList?: Array<{
    type: string;
    bizTransaction: string;
  }>;
  readPoint?: { id: string };
  bizLocation?: { id: string };
}

interface EPCISDocument {
  '@context': string[];              // ['https://ref.gs1.org/standards/epcis/epcis-context.jsonld']
  type: 'EPCISDocument';
  schemaVersion: '2.0';
  creationDate: string;               // ISO 8601
  epcisBody: {
    eventList: AggregationEvent[];
  };
}
```

### Product DTOs

```typescript
// CreateProductDto (shared across services)
{
  productName: string;
  brandName: string;
  gtin: string;                       // Global Trade Item Number (unique)
}

// Product Entity (PPB Service)
{
  id: number;
  productName: string;
  brandName: string;
  userId: string;
  gtin: string;                       // Unique constraint
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Batch DTOs

```typescript
// CreateBatchDto
{
  productId: number;
  batchno: string;                     // Unique batch number
  expiry: Date;                       // Expiry date
  qty: string;                        // Quantity as string
}

// Batch Entity
{
  id: number;
  productId: number;
  batchno: string;                     // Unique constraint
  expiry: Date;
  qty: string;
  sentQty: string;                    // Cumulative shipped quantity
  isEnabled: boolean;
  userId: string;
  earlyWarningNotified: boolean;
  earlyWarningDate?: Date;
  secondaryNotified: boolean;
  secondaryDate?: Date;
  finalNotified: boolean;
  finalDate?: Date;
  postExpiryNotified: boolean;
  postExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Shipment DTOs

```typescript
// CreateShipmentDto
{
  customer: string;
  pickupDate: Date;
  expectedDeliveryDate: Date;
  pickuplocation: string;
  destinationaddress: string;
  carrier: string;
  userId: string;
  customerId?: string;
  packageId: number[];
}

// Shipment Entity (Manufacturer/Supplier)
{
  id: number;
  customer: string;
  pickupDate: Date;
  expectedDeliveryDate: Date;
  pickuplocation: string;
  destinationaddress: string;
  carrier: string;
  userId: string;
  customerId?: string;
  isDispatched: boolean;
  ssccBarcode: string;                // Serial Shipping Container Code
  eventId?: string;                   // EPCIS event ID
  isDeleted: boolean;
  packages: Package[];
}

// Shipment Entity (Supplier - has parent SSCC)
{
  // ... same as above plus:
  parentssccBarcode: string;
  receiveEventId?: string;
}
```

### Case DTOs

```typescript
// CreateCaseDto
{
  label: string;                      // Unique per user
  products: Array<{
    productId: number;
    batchId: number;
    qty: string;
  }>;
}

// Case Entity
{
  id: number;
  label: string;                      // Unique constraint: [userId, label]
  package: Package;
  products: CasesProducts[];
  userId: string;
  eventId?: string;                   // Unique constraint: [userId, eventId]
  isDispatched: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Package DTOs

```typescript
// Package Entity
{
  id: number;
  label: string;
  shipment: Shipment;
  cases: Case[];
  userId: string;
  eventId?: string;                   // Unique constraint: [userId, eventId]
  isDispatched: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Recall DTOs

```typescript
// CreateRecallDto
{
  batchId: number;
  reason: string;
  transporter: string;
  pickupLocation: string;
  pickupDate: Date;
  deliveryLocation: string;
  deliveryDate: Date;
}

// RecallRequest Entity
{
  id: number;
  batchId: number;
  reason: string;
  status: RecallStatus;               // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  transporter: string;
  pickupLocation: string;
  pickupDate: Date;
  deliveryLocation: string;
  deliveryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Journey DTOs

```typescript
// ProductBatchDto (PPB Journey Tracking)
{
  customer: string;
  pickupDate: Date;
  expectedDeliveryDate: Date;
  pickuplocation: string;
  destinationaddress: string;
  carrier: string;
  userId: string;
  customerId?: string;
  isDispatched: boolean;
  ssccBarcode: string;
  parentssccBarcode?: string;
  isDeleted?: boolean;
  productRows: Array<{
    productId: number;
    batchId: number;
    qty: string;
  }>;
}
```

## EPCIS Event Flow

### Event Capture Flow

```
1. Business Service (Manufacturer/Supplier/User Facility)
   └──> Creates business entity (Case, Shipment, etc.)
   └──> Calls EpcisService.sendAggregationEvent()
        ├──> Constructs EPCISDocument with AggregationEvent
        └──> POST to EPCIS Service: {epcisUrl}/capture
             └──> Content-Type: application/ld+json

2. EPCIS Service (Quarkus)
   └──> Receives POST /capture
   └──> Publishes to Kafka: epcis-event-captured topic

3. Kafka Streams Processing (CaptureContextTopology)
   └──> Consumes: epcis-event-captured
   └──> Validation Pipeline:
        ├──> Schema validation
        ├──> Duplication check
        └──> Integrity validation
   └──> Routes to:
        ├──> epcis-event-validated-success (if valid)
        └──> epcis-event-validated-failure (if invalid)

4. Persistence Pipeline
   └──> Consumes: epcis-event-validated-success
   └──> Persists to OpenSearch
   └──> Publishes to: epcis-event-persisted
   └──> Publishes to: event-saved

5. Event Consumption
   └──> streaming-consumer-group: Real-time WebSocket subscriptions
   └──> epc-consumer-group: EPC indexing for queries
```

### Event Query Flow

```
1. Business Service (PPB Service for journey tracking)
   └──> Queries EPCIS Service via REST API
        ├──> GET /events?EQ_bizStep=shipping
        ├──> GET /events?EQ_bizStep=receiving
        └──> GET /epcs/{epc-uri}

2. EPCIS Service
   └──> Queries OpenSearch index: epcis-event
   └──> Returns EPCISDocument with eventList
```

### Event Types and Business Steps

**AggregationEvent Actions:**
- `ADD`: Creating aggregation (case with batches, shipment with packages)
- `DELETE`: Breaking down aggregation
- `OBSERVE`: Observing existing aggregation

**Common Business Steps:**
- `packing`: Case creation (batches → case)
- `shipping`: Shipment dispatch (packages → shipment)
- `receiving`: Shipment receipt at destination
- `in_transit`: During transportation

**Common Dispositions:**
- `in_progress`: Active processing
- `in_transit`: During transportation
- `in_use`: At destination facility
- `disposed`: Disposed/consumed

## PPB Integration Touchpoints

### PPB Service API Endpoints

#### Product Management
- `POST /api/products` - Create product
- `POST /api/products/all` - Get all products for user
- `POST /api/products/get-all` - Get all products (paginated)
- `GET /api/products/:id` - Get product by ID
- `DELETE /api/products/:id` - Soft delete product

#### Journey Tracking
- `POST /api/journey/all` - Get all journeys (paginated)
  - Queries manufacturer, supplier, and user-facility services
  - Aggregates shipment data across supply chain
- `POST /api/journey/get-detail` - Get journey details by SSCC
  - Traces complete journey from manufacturer → supplier → user facility
  - Returns nested shipment hierarchy

#### Batch Management
- `GET /api/batches/all-batches` - Get all batches (paginated)

#### Recall Management
- `POST /api/recalls` - Create recall request
- `GET /api/recalls` - Get all recalls (with filters)
- `GET /api/recalls/:id` - Get recall details

### PPB Service → Other Services Integration

#### SharedProductService (Used by Manufacturer/Supplier/User Facility Services)
```typescript
// Fetches product catalog from PPB Service
GET {ppbUrl}/api/products/:id
Headers: Authorization: Bearer {token}

GET {ppbUrl}/api/products/all
Headers: Authorization: Bearer {token}
```

#### Journey Service Integration
```typescript
// PPB Service queries manufacturer service
POST {manufacturerUrl}/api/ppb-listing/listing
POST {manufacturerUrl}/api/ppb-listing/get-by-sscc

// PPB Service queries supplier service
POST {supplierUrl}/api/ppb-listing/get-by-parentsscc

// PPB Service queries user-facility service
POST {userFacilityUrl}/api/ppb-listing/get-by-parentsscc
```

### PPB Service → EPCIS Service Integration

```typescript
// PPB Service queries EPCIS for event history
GET {epcisUrl}/events?EQ_bizStep=shipping&EQ_bizStep=receiving
GET {epcisUrl}/epcs/{epc-uri}
```

## Database Schemas

### Auth Service Database

**users**
- `id` (UUID, PK)
- `email` (unique)
- `role` (enum: USER_FACILITY, MANUFACTURER, CPA, PPB)
- `roleId` (number)
- `glnnumber` (string)
- `organization` (string)
- `isDeleted` (boolean)
- `refreshToken` (string, nullable)
- `createdAt`, `updatedAt`

### Manufacturer/Supplier Service Database

**batches**
- `id` (PK)
- `productId` (FK to PPB products via API)
- `batchno` (unique)
- `expiry` (date)
- `qty` (string)
- `sentQty` (string, default '0')
- `isEnabled` (boolean)
- `userId` (string, UUID)
- `earlyWarningNotified`, `earlyWarningDate`
- `secondaryNotified`, `secondaryDate`
- `finalNotified`, `finalDate`
- `postExpiryNotified`, `postExpiryDate`
- `createdAt`, `updatedAt`

**case**
- `id` (PK)
- `label` (unique: [userId, label])
- `packageId` (FK)
- `userId` (string)
- `eventId` (unique: [userId, eventId])
- `isDispatched` (boolean)
- `createdAt`, `updatedAt`

**cases_products** (junction table)
- `id` (PK)
- `caseId` (FK)
- `batchId` (FK)
- `productId` (number, reference to PPB)
- `qty` (string)
- `count` (number)

**packages**
- `id` (PK)
- `label` (string)
- `shipmentId` (FK)
- `userId` (string)
- `eventId` (unique: [userId, eventId])
- `isDispatched` (boolean)
- `createdAt`, `updatedAt`

**shipment**
- `id` (PK)
- `customer` (string)
- `pickupDate` (date)
- `expectedDeliveryDate` (date)
- `pickuplocation` (string)
- `destinationaddress` (string)
- `carrier` (string)
- `userId` (string)
- `customerId` (string, nullable)
- `isDispatched` (boolean)
- `ssccBarcode` (string)
- `eventId` (string, nullable)
- `parentssccBarcode` (string, nullable - supplier only)
- `receiveEventId` (string, nullable - supplier only)
- `isDeleted` (boolean)

### PPB Service Database

**products**
- `id` (PK)
- `productName` (string)
- `brandName` (string)
- `userId` (string)
- `gtin` (string, unique)
- `isEnabled` (boolean)
- `createdAt`, `updatedAt`

**recall_requests**
- `id` (PK)
- `batchId` (number)
- `reason` (string)
- `status` (enum: PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `transporter` (string)
- `pickupLocation` (string)
- `pickupDate` (date)
- `deliveryLocation` (string)
- `deliveryDate` (date)
- `createdAt`, `updatedAt`

### User Facility Service Database

**shipment** (similar to manufacturer but with additional fields)
- All manufacturer shipment fields plus:
- `shipmentproducts` (one-to-many relationship)

**shipment_products** (junction table)
- `id` (PK)
- `shipmentId` (FK)
- `productId` (number)
- `batchId` (number)
- `qty` (string)

### Notification Service Database

**ppb_activity_logs**
- Activity logging for audit trail

**batch_notification_settings**
- Notification preferences per batch

## EPC URI Format

The system uses a consistent EPC URI format for identifying entities:

- **Cases**: `https://example.com/cases/{label}` (spaces removed)
- **Batches**: `https://example.com/batches/{batchno}` (spaces removed)
- **Packages**: `https://example.com/packages/{label}` (spaces removed)
- **Shipments**: `https://example.com/shipments/{sscc}` (spaces removed)

## Configuration

### Environment Variables

**Common to All NestJS Services:**
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `PORT` or `APP_PORT` (default: 3000)
- `JWT_SECRET`, `JWT_EXPIRES`
- `TNT_AUTH_URL` - Auth service URL
- `TNT_EPCIS_URL` - EPCIS service URL (default: http://localhost:8080)

**Service-Specific:**
- `TNT_MANUFACTURER_URL` - Manufacturer service URL
- `TNT_SUPPLIER_URL` - Supplier service URL
- `TNT_PPB_URL` - PPB service URL
- `TNT_USERFACILITY_URL` - User facility service URL
- `FRONTEND_MANUFACTURER_DOMAIN` - Frontend URLs for email links
- `FRONTEND_CPA_DOMAIN`
- `FRONTEND_USERFACILITY_DOMAIN`
- `FRONTEND_PPB_DOMAIN`

**EPCIS Service:**
- `QUARKUS_OPENSEARCH_HOSTS` (default: localhost:9200)
- `kafka.bootstrap.servers` (default: localhost:9092)

## Shared Services Pattern

All services implement a `SharedServiceModule` that provides:

1. **SharedProductService**: Fetches product catalog from PPB Service
2. **SharedUserService**: Fetches user details from Auth Service
3. **SharedActivityLogService**: Logs activities to Notification Service

This pattern enables:
- Centralized product catalog (PPB as source of truth)
- Centralized user management (Auth Service as source of truth)
- Centralized activity logging (Notification Service as audit trail)

## Authentication & Authorization

- **JWT-based**: All services validate JWT tokens
- **Keycloak Integration**: Optional, can be used for SSO
- **Role-based Access**: User roles (USER_FACILITY, MANUFACTURER, CPA, PPB)
- **Token Propagation**: Services forward tokens when calling other services

## Deployment

### Docker Compose (EPCIS Service)
- Kafka, OpenSearch, OpenSearch Dashboards
- EPCIS REST API (Quarkus)
- One-time Kafka topic setup script

### Individual Service Deployment
- Each NestJS service can be containerized independently
- Frontend (Next.js) can be deployed to Vercel or similar
- Services communicate via HTTP/REST APIs

## Data Flow Summary

1. **Manufacturer** creates batches → aggregates into cases → packages → shipments
2. **EPCIS Events** captured at each aggregation point (case, package, shipment)
3. **Supplier (CPA)** receives shipments → forwards to user facilities
4. **User Facilities** receive shipments → consume products
5. **PPB** tracks complete journey via EPCIS queries and service-to-service calls
6. **Notifications** sent for batch expiry warnings and recalls


---

## ILMD and Extensions Support (Added: Dec 9, 2025)

### Instance/Lot Master Data (ILMD)

All ObjectEvents now support ILMD (EPCIS 2.0 standard) for batch-level metadata:

- **lotNumber**: Batch/lot number
- **itemExpirationDate**: Product expiry date (ISO 8601)
- **productionDate**: Manufacturing date (ISO 8601)
- **countryOfOrigin**: ISO 3166-1 alpha-2 country code
- Custom fields via [key: string]: any

### Extensions

Custom regulatory and business metadata transmitted via extensions:

- **PPB Batch Data**: permit_id, approval_status, product_code
- **Parties**: manufacturer, MAH, importer details
- **Logistics**: carrier, origin, port_of_entry

See `DATA_PERSISTENCE_ANALYSIS.md` for complete data flow analysis.

---
