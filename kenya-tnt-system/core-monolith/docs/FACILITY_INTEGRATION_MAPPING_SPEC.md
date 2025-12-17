# Facility Integration - LMIS Business Event to EPCIS Mapping Specification

**Version**: 1.0  
**Last Updated**: 2025-01-15  
**Purpose**: This document defines the mapping between Facility LMIS business events and EPCIS 2.0 events for external stakeholders.

---

## Overview

The Facility Integration Service accepts business events from external Facility LMIS (Logistics Management Information System) applications and automatically transforms them to EPCIS 2.0 format for submission to OpenEPCIS.

**API Endpoint**: `POST /api/integration/facility/events`  
**Authentication**: API Key via `X-API-Key` header  
**Content-Type**: `application/json`

---

## Supported Event Types

| LMIS Event Type | Description | When Triggered |
|----------------|-------------|----------------|
| `dispense` | Product dispensed/issued to patient | At dispensation finish |
| `receive` | Product received at facility | At GRN sign off |
| `adjust` | Inventory adjustment (damage, expiry, theft, etc.) | At adjustment business event |
| `stock_count` | Physical stock count | At stock count closure |
| `return` | Product returned to supplier | At return closure |
| `recall` | Product recalled | At recall action |

---

## Event Type → EPCIS Mapping

### 1. Dispense Event (`dispense`)

**Input (LMIS)**:
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

**Output (EPCIS)**:
- **Event Type**: `ObjectEvent`
- **bizStep**: `dispensing`
- **disposition**: `dispensed`
- **action**: `OBSERVE`
- **epcList**: `["urn:epc:id:sgtin:0616400401234567890X"]` (from `identifiers.sgtins`)

**Mapping Rules**:
- If `identifiers.sgtins` provided → Use SGTINs directly (already formatted)
- If no SGTINs → Use `batchNumber` to create batch EPC: `urn:epc:id:lgtin:{companyPrefix}.{itemRef}.{batchNumber}`
- `location.coordinates` → Persisted to `facility_scan_locations` table

---

### 2. Receive Event (`receive`)

**Input (LMIS)** - Opened SSCC (Partial SGTIN Scans):
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

**Input (LMIS)** - Sealed SSCC (Bulk Receive):
```json
{
  "type": "receive",
  "GLN": "GLN123456",
  "grnId": "GRN-20241219-002",
  "shipment": {
    "shipmentId": "SHIP-20241219-002",
    "receivedAt": "2024-12-19T10:05:00Z"
  },
  "items": [{
    "gtin": "06164004054321",
    "batchNumber": "BATCH-XYZ777",
    "expiryDate": "2025-11-30",
    "identifiers": {
      "sscc": "061640040000067890",
      "sgtins": []
    },
    "quantity": 200
  }]
}
```

**Output (EPCIS)**:
- **Event Type**: `AggregationEvent`
- **bizStep**: `receiving`
- **disposition**: `active`
- **action**: `ADD`
- **parentID**: SSCC EPC (from `items[].identifiers.sscc`) OR shipment ID
- **childEPCs**: 
  - If `sgtins` provided → `["urn:epc:id:sgtin:..."]`
  - If `sscc` provided → `["urn:epc:id:sscc:..."]`
  - If `batchNumber` provided → `["urn:epc:id:lgtin:..."]`

**Mapping Rules**:
- Priority: `sgtins` > `sscc` > `batchNumber`
- If `location.coordinates` provided → Persisted to database

---

### 3. Adjust Event (`adjust`)

**Input (LMIS)**:
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

**Output (EPCIS)**:
- **Event Type**: `ObjectEvent`
- **bizStep**: `inventory_adjusting`
- **disposition**: 
  - `expired` (if reason = "expiry")
  - `damaged` (if reason = "damage")
  - `disposed` (if reason = "theft" or "loss")
  - `in_progress` (otherwise)
- **action**: `OBSERVE`
- **epcList**: From `item.identifiers.sgtins` or `item.batchNumber`

**Reason Vocabulary**:
- `expiry` → disposition: `expired`
- `damage` → disposition: `damaged`
- `theft` → disposition: `disposed`
- `loss` → disposition: `disposed`
- `found` → disposition: `active`
- `stock_count_correction` → disposition: `in_progress`

---

### 4. Stock Count Event (`stock_count`)

**Input (LMIS)**:
```json
{
  "type": "stock_count",
  "timestamp": "2024-12-21T10:45:00Z",
  "location": {
    "facilityGln": "GLN123456"
  },
  "countSessionId": "SC-20241221-001",
  "items": [{
    "gtin": "06164004012345",
    "batchNumber": "BATCH-ABC123",
    "expiryDate": "2026-02-15",
    "systemQuantity": 200,
    "physicalQuantity": 197,
    "identifiers": {
      "sgtins": ["0616400401234567890X", "0616400401234567890Y", "0616400401234567890Z"]
    }
  }]
}
```

**Output (EPCIS)**:
- **Event Type**: `ObjectEvent` (only for items with discrepancies)
- **bizStep**: `cycle_counting`
- **disposition**: `in_progress`
- **action**: `OBSERVE`
- **epcList**: From `items[].identifiers.sgtins` or `items[].batchNumber`

**Mapping Rules**:
- Only generates EPCIS events for items where `systemQuantity ≠ physicalQuantity`
- If `systemQuantity === physicalQuantity` → No EPCIS event generated

---

### 5. Return Event (`return`)

**Input (LMIS)**:
```json
{
  "type": "return",
  "GLN": "GLN123456",
  "timestamp": "2024-12-22T09:20:00Z",
  "returnId": "RET-20241222-001",
  "reason": "supplier_return",
  "items": [{
    "gtin": "06164004098765",
    "batchNumber": "BATCH-RETURN-22",
    "expiryDate": "2025-06-30",
    "identifiers": {
      "sgtins": []
    },
    "quantity": 50
  }]
}
```

**Output (EPCIS)**:
- **Event Type**: `AggregationEvent`
- **bizStep**: `returning`
- **disposition**: `returned`
- **action**: `ADD`
- **parentID**: `https://example.com/returns/{returnId}`
- **childEPCs**: From `items[].identifiers.sgtins`, `items[].identifiers.sscc`, or `items[].batchNumber`

---

### 6. Recall Event (`recall`)

**Input (LMIS)**:
```json
{
  "type": "recall",
  "timestamp": "2024-12-23T12:10:00Z",
  "location": {
    "facilityGln": "GLN123456"
  },
  "recallNoticeId": "RECALL-PPB-20241223-001",
  "recallClass": "Class I",
  "reason": "regulatory_recall",
  "items": [{
    "gtin": "06164004012345",
    "batchNumber": "BATCH-RECALL-123",
    "expiryDate": "2026-02-15",
    "identifiers": {
      "sgtins": []
    },
    "quantity": 31
  }]
}
```

**Output (EPCIS)**:
- **Event Type**: `ObjectEvent`
- **bizStep**: `recalling`
- **disposition**: `recalled`
- **action**: `OBSERVE`
- **epcList**: From `items[].identifiers.sgtins` or `items[].batchNumber`

---

## GS1 Identifier Mapping

### SGTIN Format
- **Input**: `identifiers.sgtins` array contains already-formatted SGTINs (e.g., `"0616400401234567890X"`)
- **Output**: `urn:epc:id:sgtin:{sgtin}` (e.g., `urn:epc:id:sgtin:0616400401234567890X`)

### SSCC Format
- **Input**: `identifiers.sscc` (18 digits)
- **Output**: `urn:epc:id:sscc:{companyPrefix}.{serialReference}`

### Batch/LGTIN Format
- **Input**: `batchNumber` (string)
- **Output**: `urn:epc:id:lgtin:{companyPrefix}.{itemRef}.{batchNumber}`

---

## Location Data Persistence

When `location.coordinates` is provided, location data is persisted to the `facility_scan_locations` table:

**Fields Stored**:
- `facility_gln` (from `GLN` or `location.facilityGln`)
- `epc_uri` (for each EPC in the event)
- `latitude`, `longitude`, `accuracy_meters`
- `captured_at` (from `location.capturedAt`)
- `event_type` (dispense, receive, etc.)
- `event_timestamp`

**Purpose**: Enable location-based analytics and traceability queries.

---

## Validation Rules

1. **GTIN Validation**: All events must include a valid GTIN that exists in the product catalog
2. **GLN Validation**: `GLN` must be 13 digits (future: validate against master data)
3. **EPC Requirements**: Each item must have at least one of:
   - `identifiers.sgtins` (for unit-level tracking)
   - `identifiers.sscc` (for container-level tracking)
   - `batchNumber` (for batch-level tracking)
4. **Location**: `location.facilityGln` required for `stock_count` and `recall` events

---

## Error Handling

- **400 Bad Request**: Invalid request body, missing required fields, or product not found
- **401 Unauthorized**: Missing or invalid API key
- **500 Internal Server Error**: EPCIS event capture failed (after 8 retry attempts)

All errors are logged with request IDs for traceability.

---

## Retry Logic

- **Max Retries**: 8 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s)
- **Retryable Errors**: Network errors, 5xx server errors, timeouts

---

## API Documentation

Full interactive API documentation available at:
- **Swagger UI**: `http://localhost:4000/api/docs`
- **Tag**: "Facility Integration"

---

## Examples

See `FACILITY_INTEGRATION_SETUP.md` for complete cURL examples for each event type.

---

## Future Enhancements

1. **Facility ID Validation**: Validate `facilityId` against master data (future enhancement)
2. **Location Persistence**: Complete implementation of `facility_scan_locations` table
3. **Batch Processing**: Support bulk event submission
4. **Webhook Notifications**: Notify FLMIS of event processing status

