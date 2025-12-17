# Facility Integration Service - Setup & Testing Guide

## Overview

The Facility Integration Service allows external Facility LMIS (Logistics Management Information System) applications to send business events that are automatically transformed to EPCIS format and sent to OpenEPCIS.

## Features

✅ **Logging**: Request/response logging with request IDs and facility tracking  
✅ **Authentication**: API key-based authentication via `X-API-Key` header  
✅ **Metrics**: In-memory metrics tracking (requests, EPCIS events, response times)  
✅ **Retries**: Exponential backoff retry logic (3 retries: 1s, 2s, 4s delays)  
✅ **Validation**: GTIN validation against product catalog  
✅ **EPCIS Transformation**: Automatic conversion from business events to EPCIS 2.0 format  
✅ **Swagger Documentation**: Full API documentation with examples

## Endpoints

### 1. POST `/api/integration/facility/events/received`
Receive product received event from FLMIS.

**Headers:**
- `X-API-Key`: API key for authentication (required)
- `X-Facility-ID`: Facility identifier (optional, for logging)

**Request Body Example:**
```json
{
  "eventId": "FAC-2025-001",
  "eventTimestamp": "2025-01-15T10:30:00Z",
  "facilityGLN": "61640056789012",
  "facilityId": "FACILITY-001",
  "products": [
    {
      "gtin": "61640056789012",
      "batchNo": "5343545",
      "serialNumbers": ["KE0010001", "KE0010002"],
      "sscc": "123456789012345681"
    }
  ],
  "shipmentSSCC": "123456789012345679",
  "readPoint": "Receiving dock A",
  "bizLocation": "Warehouse A"
}
```

### 2. POST `/api/integration/facility/events/consumed`
Receive product consumed/dispensed event from FLMIS.

**Headers:**
- `X-API-Key`: API key for authentication (required)
- `X-Facility-ID`: Facility identifier (optional, for logging)

**Request Body Example:**
```json
{
  "eventId": "FAC-2025-002",
  "eventTimestamp": "2025-01-15T14:30:00Z",
  "facilityGLN": "61640056789012",
  "facilityId": "FACILITY-001",
  "products": [
    {
      "gtin": "61640056789012",
      "batchNo": "5343545",
      "serialNumbers": ["KE0010001"]
    }
  ],
  "readPoint": "Dispensing counter 1",
  "bizLocation": "Pharmacy",
  "patientId": "PATIENT-12345"
}
```

### 3. GET `/api/integration/facility/metrics`
Get integration metrics.

**Response Example:**
```json
{
  "requestsTotal": 150,
  "requestsSuccess": 145,
  "requestsError": 5,
  "epcisEventsCaptured": 140,
  "epcisEventsFailed": 5,
  "averageResponseTime": 234.5,
  "receivedEvents": 80,
  "consumedEvents": 60
}
```

### 4. GET `/api/integration/facility/health`
Health check endpoint.

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Facility Integration API Keys (comma-separated)
FACILITY_API_KEYS=key1,key2,key3

# If not set, all requests are allowed (development mode only)
```

### Swagger Documentation

Access Swagger UI at: `http://localhost:4000/api/docs`

The Facility Integration endpoints are under the **"Facility Integration"** tag.

To test in Swagger:
1. Click "Authorize" button
2. Select "api-key" scheme
3. Enter your API key
4. Test the endpoints

## Testing

### Using cURL

#### Test Received Event:
```bash
curl -X POST http://localhost:4000/api/integration/facility/events/received \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -H "X-Facility-ID: FACILITY-001" \
  -d '{
    "eventId": "FAC-2025-001",
    "eventTimestamp": "2025-01-15T10:30:00Z",
    "facilityGLN": "61640056789012",
    "products": [
      {
        "gtin": "61640056789012",
        "batchNo": "5343545"
      }
    ],
    "shipmentSSCC": "123456789012345679"
  }'
```

#### Test Consumed Event:
```bash
curl -X POST http://localhost:4000/api/integration/facility/events/consumed \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -H "X-Facility-ID: FACILITY-001" \
  -d '{
    "eventId": "FAC-2025-002",
    "eventTimestamp": "2025-01-15T14:30:00Z",
    "facilityGLN": "61640056789012",
    "products": [
      {
        "gtin": "61640056789012",
        "batchNo": "5343545",
        "serialNumbers": ["KE0010001"]
      }
    ]
  }'
```

#### Get Metrics:
```bash
curl -X GET http://localhost:4000/api/integration/facility/metrics \
  -H "X-API-Key: your-api-key"
```

## Architecture

### Module Structure
```
src/modules/integration/facility/
├── dto/
│   └── facility-event.dto.ts          # Business event DTOs
├── guards/
│   └── api-key.guard.ts                # API key authentication
├── interceptors/
│   ├── logging.interceptor.ts          # Request/response logging
│   └── metrics.interceptor.ts          # Metrics collection
├── facility-integration.controller.ts  # API endpoints
├── facility-integration.service.ts     # Business logic & EPCIS transformation
└── facility-integration.module.ts      # Module definition
```

### Flow

1. **FLMIS sends business event** → Facility Integration Controller
2. **API Key Guard** validates authentication
3. **Logging Interceptor** logs request
4. **Facility Integration Service**:
   - Validates GTIN against product catalog
   - Transforms business event to EPCIS format
   - Sends to OpenEPCIS with retry logic
5. **Metrics Interceptor** records metrics
6. **Response** returned to FLMIS

### EPCIS Event Types Generated

- **Received Events** → `AggregationEvent` with `bizStep='receiving'`
- **Consumed Events** → `ObjectEvent` with `bizStep='consuming'`

## Error Handling

- **400 Bad Request**: Invalid request body, missing required fields, or product not found in catalog
- **401 Unauthorized**: Missing or invalid API key
- **500 Internal Server Error**: EPCIS event capture failed (after retries)

All errors are logged with request IDs for traceability.

## Next Steps

1. **Database Integration**: Store event audit trail in PostgreSQL
2. **Prometheus Metrics**: Replace in-memory metrics with Prometheus
3. **Rate Limiting**: Add rate limiting per facility
4. **Webhook Support**: Add webhook notifications for event processing status
5. **Batch Processing**: Support bulk event submission

