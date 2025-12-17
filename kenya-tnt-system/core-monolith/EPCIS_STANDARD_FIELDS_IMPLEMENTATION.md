# EPCIS Standard Fields Implementation

**Date**: 2025-01-XX  
**Status**: ✅ Complete  
**Version**: 1.0

## Overview

This document describes the implementation of missing EPCIS 1.2/2.0 standard fields that were previously not being sent to OpenEPCIS or persisted locally. All fields are now fully supported and compatible with both EPCIS 1.2 and 2.0 standards.

## Implemented Fields

### 1. Business Transaction List (`bizTransactionList`)
- **Purpose**: Link events to business documents (PO, Invoice, ASN, etc.)
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: `epcis_event_biz_transactions` junction table
- **Use Case**: Financial reconciliation, order-to-delivery tracking

### 2. Quantity List (`quantityList`)
- **Purpose**: Track quantities associated with events
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: `epcis_event_quantities` junction table
- **Use Case**: Quantity reconciliation, inventory accuracy

### 3. Source List (`sourceList`)
- **Purpose**: Identify source parties/locations
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: `epcis_event_sources` junction table
- **Use Case**: Supply chain network mapping, partner performance

### 4. Destination List (`destinationList`)
- **Purpose**: Identify destination parties/locations
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: `epcis_event_destinations` junction table
- **Use Case**: Route optimization, compliance tracking

### 5. Sensor Element List (`sensorElementList`)
- **Purpose**: Environmental data (temperature, humidity, etc.)
- **Available in**: EPCIS 2.0 only
- **Database**: `epcis_event_sensors` junction table
- **Use Case**: Cold chain compliance, quality assurance

### 6. Error Declaration (`errorDeclaration`)
- **Purpose**: Record errors during event capture
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: Fields in `epcis_events` table
- **Use Case**: Data quality tracking, error correction

### 7. Action Field (`action`)
- **Purpose**: Event action type (ADD, DELETE, OBSERVE)
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: `epcis_events.action` column
- **Status**: Now persisted (was created but not saved)

### 8. Event Timezone Offset (`eventTimeZoneOffset`)
- **Purpose**: Timezone when event occurred
- **Available in**: EPCIS 1.2 and 2.0
- **Database**: `epcis_events.event_timezone_offset` column
- **Status**: Now persisted (was created but not saved)

## Database Schema

### Migration
- **File**: `database/migrations/V9__Add_EPCIS_Standard_Fields.sql`
- **Tables Created**:
  - `epcis_event_biz_transactions`
  - `epcis_event_quantities`
  - `epcis_event_sources`
  - `epcis_event_destinations`
  - `epcis_event_sensors`
- **Columns Added to `epcis_events`**:
  - `action` VARCHAR(10)
  - `event_timezone_offset` VARCHAR(10)
  - `error_declaration_time` TIMESTAMP
  - `error_declaration_reason` VARCHAR(255)
  - `error_corrective_event_ids` TEXT[]

## Usage Examples

### Using Helper Functions

```typescript
import {
  createBizTransaction,
  createQuantity,
  createSourceDestination,
  createSensorElement,
  createErrorDeclaration,
  BizTransactionType,
  SourceDestinationType,
  SensorType,
  UnitOfMeasure,
} from '@shared/gs1';

// Create event with business transaction
await gs1Service.createAggregationEvent(parentId, childEPCs, {
  bizStep: 'shipping',
  disposition: 'in_transit',
  bizTransactionList: [
    createBizTransaction(BizTransactionType.PURCHASE_ORDER, 'PO-2024-001'),
    createBizTransaction(BizTransactionType.INVOICE, 'INV-2024-12345'),
  ],
  quantityList: [
    createQuantity('urn:epc:class:lgtin:0614141.012345.ABC', 100, UnitOfMeasure.EACH),
  ],
  sourceList: [
    createSourceDestination(SourceDestinationType.LOCATION, 'urn:epc:id:sgln:0614141.00001.0'),
  ],
  destinationList: [
    createSourceDestination(SourceDestinationType.LOCATION, 'urn:epc:id:sgln:0614141.00002.0'),
  ],
  // EPCIS 2.0 only
  sensorElementList: [
    createSensorElement(SensorType.TEMPERATURE, 2.5, UnitOfMeasure.CELSIUS, {
      deviceID: 'TEMP-SENSOR-001',
      time: new Date().toISOString(),
    }),
  ],
});
```

### Direct Usage

```typescript
await epcisEventService.createObjectEvent(epcList, {
  bizStep: 'receiving',
  disposition: 'active',
  bizTransactionList: [
    { type: 'ASN', bizTransaction: 'ASN-2024-001' },
  ],
  quantityList: [
    { epcClass: 'urn:epc:class:lgtin:...', quantity: 50, uom: 'EA' },
  ],
  sourceList: [
    { type: 'location', id: 'urn:epc:id:sgln:0614141.00001.0' },
  ],
  destinationList: [
    { type: 'location', id: 'urn:epc:id:sgln:0614141.00002.0' },
  ],
});
```

## Data Flow

1. **Event Creation**: Caller provides optional EPCIS standard fields
2. **OpenEPCIS**: All fields are sent to OpenEPCIS (source of truth)
3. **Local Persistence**: All fields are persisted locally for analytics
4. **Dual Write**: OpenEPCIS write is primary, local persistence is secondary (retries on failure)

## Benefits

### Analytics
- **Business Transactions**: Link events to orders/invoices for financial reconciliation
- **Quantities**: Track quantities through supply chain for inventory accuracy
- **Source/Destination**: Map supply chain network and analyze partner performance
- **Sensors**: Monitor environmental conditions for cold chain compliance
- **Errors**: Track data quality and system reliability

### Compliance
- **EPCIS 1.2 Compatibility**: All fields work with EPCIS 1.2 stakeholders
- **EPCIS 2.0 Support**: Full support for EPCIS 2.0 features (sensors)
- **OpenEPCIS**: Complete data sent to OpenEPCIS as source of truth
- **Local Persistence**: Fast queries for analytics without hitting OpenEPCIS

## Migration Steps

1. **Run Database Migration**:
   ```bash
   psql -d your_database -f database/migrations/V9__Add_EPCIS_Standard_Fields.sql
   ```

2. **Restart Backend Service**:
   ```bash
   cd kenya-tnt-system/core-monolith
   npm run start:dev
   ```

3. **Update Callers** (Optional, Incremental):
   - Add `bizTransactionList` where transaction IDs are available
   - Add `quantityList` where quantities are tracked
   - Add `sourceList`/`destinationList` where source/destination data exists
   - Add `sensorElementList` for EPCIS 2.0 environmental monitoring

## Files Changed

### Core Implementation
- `src/shared/infrastructure/epcis/types.ts` - Updated interfaces
- `src/shared/gs1/epcis-event.service.ts` - Accept and persist new fields
- `src/shared/gs1/epcis-helpers.ts` - Helper utilities (NEW)
- `src/shared/gs1/gs1.module.ts` - Register new repositories
- `src/shared/domain/entities/epcis-event.entity.ts` - Updated entity
- `src/shared/domain/entities/epcis-event-*.entity.ts` - New junction entities (5 files)

### Database
- `database/migrations/V9__Add_EPCIS_Standard_Fields.sql` - Migration script

## Testing

### Verify OpenEPCIS Storage
```bash
# Query OpenEPCIS to verify fields are stored
curl -X GET "http://localhost:8080/events/{eventId}"
```

### Verify Local Persistence
```sql
-- Check business transactions
SELECT * FROM epcis_event_biz_transactions WHERE event_id = '...';

-- Check quantities
SELECT * FROM epcis_event_quantities WHERE event_id = '...';

-- Check sources/destinations
SELECT * FROM epcis_event_sources WHERE event_id = '...';
SELECT * FROM epcis_event_destinations WHERE event_id = '...';
```

## Notes

- **Backward Compatible**: All new fields are optional, existing code continues to work
- **EPCIS 1.2 Compatible**: All fields except `sensorElementList` work with EPCIS 1.2
- **Performance**: Junction tables are indexed for fast queries
- **Source of Truth**: OpenEPCIS stores complete event data, local DB is for analytics

## Future Enhancements

- [ ] Add quantity tracking to consignment/shipment events
- [ ] Add business transaction linking to consignment events
- [ ] Add source/destination tracking to facility events
- [ ] Add sensor data collection for cold chain monitoring
- [ ] Create analytics queries leveraging new fields

