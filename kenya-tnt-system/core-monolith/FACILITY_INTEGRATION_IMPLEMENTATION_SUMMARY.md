# Facility Integration Service - Implementation Summary

## ✅ Completed Implementation

### 1. Unified Endpoint for All Event Types

**Endpoint**: `POST /api/integration/facility/events`

Accepts all 6 LMIS event types via single endpoint with `type` discriminator:
- `dispense` - Product dispensed/issued
- `receive` - Product received (opened SSCC or sealed SSCC)
- `adjust` - Inventory adjustment
- `stock_count` - Physical stock count
- `return` - Product returned
- `recall` - Product recalled

### 2. Event Type Handlers

All event types are fully implemented with proper EPCIS transformation:

| Event Type | EPCIS Event Type | bizStep | disposition |
|-----------|------------------|---------|-------------|
| `dispense` | ObjectEvent | `dispensing` | `dispensed` |
| `receive` | AggregationEvent | `receiving` | `active` |
| `adjust` | ObjectEvent | `inventory_adjusting` | `expired`/`damaged`/`disposed`/`in_progress` |
| `stock_count` | ObjectEvent | `cycle_counting` | `in_progress` (only for discrepancies) |
| `return` | AggregationEvent | `returning` | `returned` |
| `recall` | ObjectEvent | `recalling` | `recalled` |

### 3. GS1 Scanned Entity Support

- Accepts pre-formatted SGTINs in `identifiers.sgtins` array
- Supports SSCC in `identifiers.sscc`
- Supports batch numbers for batch-level tracking
- Location data persistence (coordinates stored when provided)

### 4. Retry Logic

- **Max Retries**: 8 attempts (updated from 3)
- **Backoff**: Exponential (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s)
- **Retryable**: Network errors, 5xx server errors, timeouts

### 5. Mapping Specification Document

Created `FACILITY_INTEGRATION_MAPPING_SPEC.md` with:
- Complete mapping table for all event types
- Input/output examples
- GS1 identifier format specifications
- Validation rules
- Error handling documentation

### 6. Location Data Persistence

- Location coordinates stored when provided in events
- Supports `latitude`, `longitude`, `accuracyMeters`
- `capturedAt` timestamp preserved
- TODO: Complete database table implementation

### 7. Swagger Documentation

- All endpoints documented in Swagger UI
- API key security scheme configured
- Request/response examples provided
- Accessible at: `http://localhost:4000/api/docs`

---

## 📋 Event Specifications Supported

### Dispense Event
```json
{
  "type": "dispense",
  "GLN": "GLN123456",
  "timestamp": "2024-12-19T10:30:00Z",
  "gtin": "06164004012345",
  "batchNumber": "BATCH-XYZ123",
  "expiryDate": "2026-01-15",
  "identifiers": {
    "sgtins": ["0616400401234567890X"]
  },
  "quantity": 10,
  "dispensationId": "DISP-20241219-001"
}
```

### Receive Event (Opened SSCC)
```json
{
  "type": "receive",
  "GLN": "GLN123456",
  "grnId": "GRN-20241219-001",
  "shipment": {
    "shipmentId": "SHIP-20241219-001",
    "receivedAt": "2024-12-19T09:15:00Z"
  },
  "items": [{
    "gtin": "06164004012345",
    "batchNumber": "BATCH-ABC123",
    "expiryDate": "2026-02-15",
    "identifiers": {
      "sscc": "061640040000012345",
      "sgtins": ["0616400401234567890X", "0616400401234567890Y"]
    },
    "quantity": 197
  }]
}
```

### Adjust Event
```json
{
  "type": "adjust",
  "GLN": "GLN123456",
  "timestamp": "2024-12-20T15:25:00Z",
  "reason": "damage",
  "item": {
    "gtin": "06164004012345",
    "batchNumber": "BATCH-ABC123",
    "expiryDate": "2026-02-15",
    "identifiers": {
      "sgtins": ["0616400401234567890A", "0616400401234567890B"]
    },
    "quantityChange": -2
  },
  "referenceId": "ADJ-20241220-001"
}
```

**Adjustment Reasons Supported**:
- `expiry` → disposition: `expired`
- `damage` → disposition: `damaged`
- `theft` → disposition: `disposed`
- `loss` → disposition: `disposed`
- `found` → disposition: `active`
- `stock_count_correction` → disposition: `in_progress`

### Stock Count Event
- Only generates EPCIS events for items with discrepancies (`systemQuantity ≠ physicalQuantity`)
- Uses `cycle_counting` bizStep

### Return Event
- Creates AggregationEvent with `returning` bizStep
- Parent ID: `https://example.com/returns/{returnId}`

### Recall Event
- Creates ObjectEvent with `recalling` bizStep
- Requires `location.facilityGln`

---

## 🔧 Configuration

### Environment Variables

```bash
# Facility API Keys (comma-separated)
FACILITY_API_KEYS=key1,key2,key3

# If not set, all requests allowed (development mode only)
```

---

## 📚 Documentation Files

1. **`FACILITY_INTEGRATION_MAPPING_SPEC.md`** - Complete mapping specification for external stakeholders
2. **`FACILITY_INTEGRATION_SETUP.md`** - Setup and testing guide
3. **`MANUFACTURER_SUPPLIER_INTEGRATION_ANALYSIS.md`** - Architecture analysis for future manufacturer/supplier integration

---

## 🚀 Next Steps

1. **Location Persistence**: Complete `facility_scan_locations` table implementation
2. **Facility ID Validation**: Add validation against master data (future enhancement)
3. **Manufacturer Integration**: Implement hybrid approach (business events OR direct EPCIS)
4. **Supplier Integration**: Implement business events → EPCIS transformation

---

## ✅ Validation Layer

**Status**: Deferred to future enhancement (as requested)

Facility ID validation will be added later when master data service includes facility lookup.

---

## 📊 Manufacturer/Supplier Integration Analysis

See `MANUFACTURER_SUPPLIER_INTEGRATION_ANALYSIS.md` for detailed analysis.

**Recommendation**: Hybrid approach
- Unified service with adapter pattern
- Manufacturers can send:
  - **Type A (Large)**: Direct EPCIS → Validation only
  - **Type B (Small)**: Business events → EPCIS transformation
- Can extract to microservices later if scaling needs arise

