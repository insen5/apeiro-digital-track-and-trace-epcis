# PPB Inbound JSON Roadmap

**Last Updated**: 2025-01-XX  
**Status**: Option A (Single JSON) - Production Ready

---

## Overview

This document tracks the implementation and evolution of PPB (Pharmacy and Poisons Board) consignment instantiation data ingestion. The system supports two architectural patterns:

- **Option A (Current)**: Single JSON with full hierarchy and serial numbers
- **Option B (Future)**: Two separate JSONs (consignment + serial numbers)

---

## Current Implementation: Option A (Single JSON)

### Structure

```json
{
  "header": {
    "eventID": "EVT-2025-0001",
    "eventType": "REGULATORY_INSTANTIATION",
    "eventTimestamp": "2025-11-01T12:45:00Z",
    "sourceSystem": "PPB",
    "destinationSystem": "TNT",
    "version": "1.0"
  },
  "consignment": {
    "consignmentID": "CNS-2025-98765",
    "shipmentDate": "2025-10-25",
    "countryOfOrigin": "IN",
    "destinationCountry": "KE",
    "manufacturer": {
      "ppbID": "345345",
      "gln": "61640056789012"
    },
    "mah": {
      "ppbID": "34234324",
      "gln": "61640056789013"
    },
    "registrationNo": "12243324",
    "items": [
      {
        "type": "shipment",
        "sscc": "123456789012345678",
        "parentSSCC": null
      },
      {
        "type": "package",
        "sscc": "123456789012345679",
        "parentSSCC": "123456789012345678"
      },
      {
        "type": "case",
        "sscc": "123456789012345680",
        "parentSSCC": "123456789012345679"
      },
      {
        "type": "batch",
        "parentSSCC": "123456789012345680",
        "GTIN": "61640056789012",
        "productName": "Metformin 500mg Tablets",
        "batchNo": "BATCH-2025-001",
        "manufactureDate": "2024-09-16",
        "expiryDate": "2027-09-16",
        "quantityApproved": 5000,
        "serialNumbers": [
          "KE0010001",
          "KE0010002",
          "KE0010003"
        ]
      }
    ]
  }
}
```

### Key Features

1. **Full Hierarchy**: Shipment → Package → Case → Batch with SSCC relationships
2. **Serial Numbers**: Included at batch level (SGTINs derived from GTIN + Serial Number)
3. **EPCIS Events**: Automatically generated on import
4. **Backward Compatible**: Supports legacy format (manufacturerPPBID, MAHPPBID, quantity)

### Ingestion Methods

1. **Direct API**: `POST /api/regulator/ppb-batches/consignment/import`
2. **Kafka Topic**: `ppb.consignment.instantiation`
3. **Frontend UI**: Regulator PPB Batches page → "Import Consignment JSON" button

### Processing Flow

```
PPB JSON (Option A)
    ↓
ConsignmentService.importFromPPB()
    ├── Validate structure
    ├── Build SSCC hierarchy
    ├── Create entities (Shipment → Package → Case → Batch)
    ├── Store serial numbers
    ├── Generate EPCIS AggregationEvents (batches→cases, cases→packages, packages→shipments)
    └── Generate EPCIS ObjectEvent (products entered Kenya)
```

---

## Future: Option B (Two JSONs)

### When to Migrate

**Trigger Conditions:**
- Serial number payloads exceed **~10MB** per consignment
- High-volume serial ingestion from manufacturers required
- Need to ingest serials separately from consignment approval
- Real-time serial updates required
- PPB wants to separate regulatory approval from serial data

### Structure

#### JSON 1: Regulatory Consignment Instantiation

```json
{
  "header": {
    "eventID": "EVT-2025-0001",
    "eventType": "REGULATORY_INSTANTIATION",
    "eventTimestamp": "2025-11-01T12:45:00Z",
    "sourceSystem": "PPB",
    "destinationSystem": "TNT"
  },
  "consignment": {
    "consignmentID": "CNS-2025-98765",
    "manufacturer": { "ppbID": "345345", "gln": "..." },
    "mah": { "ppbID": "34234324", "gln": "..." },
    "registrationNo": "12243324",
    "shipmentDate": "2025-10-25",
    "countryOfOrigin": "IN",
    "destinationCountry": "KE",
    "items": [
      {
        "type": "shipment",
        "sscc": "123456789012345678",
        "parentSSCC": null
      },
      {
        "type": "package",
        "sscc": "123456789012345679",
        "parentSSCC": "123456789012345678"
      },
      {
        "type": "case",
        "sscc": "123456789012345680",
        "parentSSCC": "123456789012345679"
      },
      {
        "type": "batch",
        "parentSSCC": "123456789012345680",
        "GTIN": "61640056789012",
        "batchNo": "BATCH-2025-001",
        "quantityApproved": 5000
        // NO serialNumbers here
      }
    ]
  }
}
```

#### JSON 2: Serial Number Load

```json
{
  "batchSerialLoadID": "BSL-2025-0001",
  "consignmentID": "CNS-2025-98765",
  "GTIN": "61640056789012",
  "batchNo": "BATCH-2025-001",
  "serialNumbers": [
    "KE0010001",
    "KE0010002",
    "KE0010003",
    // ... potentially thousands
  ]
}
```

### Kafka Topics

- **Topic 1**: `ppb.consignment.instantiation` (consignment without serials)
- **Topic 2**: `ppb.consignment.serial-numbers` (serial number payloads)

### Migration Strategy

1. **Phase 1**: Support both patterns simultaneously
   - Option A: Process if `serialNumbers` present in batch items
   - Option B: Process consignment, then merge serials separately

2. **Phase 2**: Add new service method
   ```typescript
   async importSerialNumbers(dto: SerialNumberLoadDto): Promise<void>
   ```

3. **Phase 3**: Update PPB to send two messages
   - Consignment message (without serials)
   - Serial number message(s) (linked by consignmentID + batchNo)

4. **Phase 4**: Deprecate Option A (optional, can keep both)

---

## Implementation Details

### DTOs

**File**: `core-monolith/src/modules/manufacturer/dto/import-ppb-consignment.dto.ts`

- `PPBHeaderDto`: Header with event metadata
- `ManufacturerDto`: Manufacturer info (ppbID, gln)
- `MAHDto`: MAH info (ppbID, gln)
- `PPBConsignmentDto`: Consignment with items array
- `PPBItemDto`: Individual item (shipment/package/case/batch)
- `ImportPPBConsignmentDto`: Root DTO

**Backward Compatibility:**
- Legacy fields (`manufacturerPPBID`, `MAHPPBID`, `quantity`) still supported
- Service handles both new (`manufacturer.ppbID`) and legacy formats

### Service Layer

**File**: `core-monolith/src/modules/manufacturer/consignments/consignment.service.ts`

**Key Methods:**
- `importFromPPB(userId, dto)`: Process Option A JSON
- `findAll(userId)`: Get consignments for user
- `findOne(id, userId)`: Get consignment by ID

**EPCIS Event Generation:**
- AggregationEvents: Batches → Cases, Cases → Packages, Packages → Shipments
- ObjectEvent: Products entered Kenya (bizStep: receiving, disposition: at_destination)

### Kafka Consumer

**File**: `core-monolith/src/shared/infrastructure/kafka/multi-topic-consumer.service.ts`

**Topic Handler:**
- `ppb.consignment.instantiation`: Routes to `ConsignmentService.importFromPPB()`

**Future Handler (Option B):**
- `ppb.consignment.serial-numbers`: Routes to `ConsignmentService.importSerialNumbers()`

### API Endpoints

**Regulator:**
- `POST /api/regulator/ppb-batches/consignment/import`: Direct JSON import

**Manufacturer:**
- `GET /api/manufacturer/ppb-batches`: Get approved batches for manufacturer
- `GET /api/manufacturer/ppb-batches/:id`: Get batch details

### Frontend

**Regulator PPB Batches Page:**
- Location: `frontend/app/regulator/ppb-batches/page.tsx`
- Feature: "Import Consignment JSON" button with modal
- Functionality: Paste JSON, validate, import, generate EPCIS events

**Manufacturer PPB Batches (Future):**
- Location: `frontend/app/manufacturer/ppb-batches/page.tsx` (to be created)
- Feature: View approved batches filtered by manufacturer GLN/name
- Status: Endpoint exists, frontend page needed

---

## Data Model

### Database Tables

1. **`consignments`**: Consignment header and metadata
2. **`consignment_batches`**: Junction table (consignment ↔ batch)
3. **`serial_numbers`**: Serial numbers linked to batches
4. **`shipments`**: Shipment entities with SSCCs
5. **`packages`**: Package entities with SSCCs
6. **`cases`**: Case entities with SSCCs
7. **`batches`**: Batch entities
8. **`ppb_batches`**: PPB approved batch records (from Kafka)

### Relationships

```
Consignment
  ├── ConsignmentBatch (many-to-many)
  │     └── Batch
  │           └── SerialNumber (one-to-many)
  ├── Shipment (via SSCC matching)
  │     └── Package
  │           └── Case
  │                 └── CasesProducts (batch linkage)
```

---

## SSCC Hierarchy

### Structure

- **Shipment**: Root level (parentSSCC = null)
- **Package**: Parent = Shipment SSCC
- **Case**: Parent = Package SSCC
- **Batch**: Parent = Case SSCC (or Package/Shipment if no case)

### Validation

- SSCC format: 18 digits with check digit
- Parent-child relationships validated
- Missing parents auto-created (e.g., if batch parent is package, create case)

---

## SGTIN Generation

### Strategy

**Current**: Serial numbers stored, SGTINs generated on-demand

**Format**: `urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber`

**Components:**
- CompanyPrefix: Extracted from GTIN
- ItemRef: Remaining digits from GTIN
- SerialNumber: From `serialNumbers` array

**Usage:**
- EPCIS ObjectEvents for unit-level tracking
- Product verification queries
- Serial number lookups

---

## EPCIS Events

### Event Types Generated

1. **AggregationEvents**:
   - Batches → Cases (bizStep: packing, disposition: in_progress)
   - Cases → Packages (bizStep: packing, disposition: in_progress)
   - Packages → Shipments (bizStep: shipping, disposition: in_transit)

2. **ObjectEvent**:
   - Products entered Kenya (bizStep: receiving, disposition: at_destination)
   - EPCs: Batch EPC URIs or SGTINs for serialized items

### Event Timing

- **Generated**: Immediately upon consignment import
- **Location**: Kenya destination GLN (from manufacturer GLN or final destination)
- **Action**: ADD (products instantiated in country)

---

## Performance Considerations

### Option A Limits

- **Recommended**: < 10MB per consignment
- **Serial Numbers**: Typically 100-10,000 per batch
- **Batches per Consignment**: Typically 1-100

### Option B Benefits

- **Scalability**: Handle large serial number payloads separately
- **Performance**: Process consignment approval faster (no serial blocking)
- **Flexibility**: Update serials independently

---

## Testing

### Test JSON Examples

**Location**: `kenya-tnt-system/core-monolith/database/seed_ppb_consignment_examples.json`

**Test Scenarios:**
1. Full hierarchy with all SSCCs
2. Missing SSCCs (auto-generated)
3. Multiple batches per consignment
4. Large serial number arrays
5. Legacy format compatibility

### Kafka Testing

**Script**: `kenya-tnt-system/core-monolith/scripts/test-kafka-messages.sh`

**Topics to Test:**
- `ppb.consignment.instantiation`: Send Option A JSON
- `ppb.consignment.serial-numbers`: Send Option B serial payload (future)

---

## Migration Checklist

### Option A → Option B Migration

- [ ] Add `SerialNumberLoadDto` for Option B
- [ ] Add `importSerialNumbers()` method to `ConsignmentService`
- [ ] Add Kafka handler for `ppb.consignment.serial-numbers` topic
- [ ] Update PPB to send two messages (consignment + serials)
- [ ] Test both patterns simultaneously
- [ ] Update documentation
- [ ] Monitor performance metrics
- [ ] Deprecate Option A (optional)

---

## Recommendations

### Current (Option A)

✅ **Use Option A when:**
- Serial number payloads < 10MB
- Simple integration preferred
- PPB sends complete data in one message
- Demo/testing scenarios

### Future (Option B)

✅ **Migrate to Option B when:**
- Serial payloads exceed 10MB
- High-volume serial ingestion needed
- Serial updates required independently
- PPB wants to separate approval from serial data

### Best Practices

1. **Always validate SSCC hierarchy** before processing
2. **Generate SGTINs on-demand** (don't store separately)
3. **Link consignments to PPB batches** via `consignment_ref_number`
4. **Monitor Kafka consumer lag** for high-volume scenarios
5. **Use transactions** for consignment import (all-or-nothing)
6. **Log EPCIS event IDs** for traceability

---

## Open Questions / Future Work

1. **Serial Number Deduplication**: How to handle duplicate serials across consignments?
2. **Partial Serial Updates**: Can serials be updated after consignment approval?
3. **EPCIS Event Updates**: Should events be updated if consignment data changes?
4. **Manufacturer Frontend**: Create dedicated page for viewing approved batches
5. **Real-time Notifications**: Notify manufacturers when batches approved
6. **Batch Linking**: Link PPB batches to consignments automatically

---

## References

- **GS1 Standards**: SSCC, SGTIN, EPCIS 2.0
- **PPB Consignment Import**: `PPB_CONSIGNMENT_IMPORT.md`
- **GS1 Terminology**: `GS1_TERMINOLOGY.md`
- **Kafka Setup**: `KAFKA_SETUP.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## Changelog

### 2025-01-XX - Option A Implementation
- ✅ Implemented single JSON structure (Option A)
- ✅ Added Kafka consumer for `ppb.consignment.instantiation`
- ✅ Added regulator endpoint for direct JSON import
- ✅ Updated frontend with JSON paste functionality
- ✅ Backward compatibility with legacy format
- ✅ EPCIS event generation on import
- ✅ SGTIN derivation from serial numbers

### Future - Option B Preparation
- ⏳ Add `SerialNumberLoadDto`
- ⏳ Add `importSerialNumbers()` method
- ⏳ Add Kafka handler for serial numbers topic
- ⏳ Create manufacturer PPB batches frontend page
- ⏳ Performance testing for large payloads

