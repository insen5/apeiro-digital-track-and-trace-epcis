# Facility Integration Module (FLMIS/LMIS)

**Last Updated:** December 17, 2025  
**Purpose:** Integration with facility-level Logistics Management Information Systems (LMIS/FLMIS)

---

## 📋 Overview

This module provides integration capabilities for health facilities to report supply chain events to the national Track & Trace system. It handles:
- LMIS event ingestion (receipts, dispensing, stock adjustments)
- API key authentication for facilities
- Event validation and enrichment
- EPCIS event generation from LMIS data
- Logging and metrics

---

## 🚀 Quick Start

### Send LMIS Event

```typescript
POST /api/integration/facility/events
Headers:
  X-API-Key: facility-api-key
  
Body:
{
  "eventType": "receipt",
  "facilityCode": "FAC-001",
  "products": [
    {
      "gtin": "12345678901234",
      "batchNumber": "BATCH-001",
      "quantity": 100,
      "expiryDate": "2026-01-01"
    }
  ],
  "timestamp": "2025-12-17T10:00:00Z"
}
```

### Supported Event Types

- `receipt` - Product received at facility
- `dispense` - Product dispensed to patient
- `adjustment` - Stock count adjustment
- `transfer` - Transfer between facilities
- `disposal` - Product disposal/destruction

---

## 📚 Documentation

- **[EVENT_VERIFICATION.md](./EVENT_VERIFICATION.md)** - FLMIS event verification report
- **[docs/MESSAGE_LOG.md](./docs/MESSAGE_LOG.md)** - Message log clarifications and GS1 terminology

---

## 🔐 Authentication

Facilities authenticate using API keys:
1. Each facility is issued a unique API key
2. API key is passed in `X-API-Key` header
3. System validates key and associates events with facility

---

## 🔄 Event Processing Flow

```
LMIS System → API Gateway → Validation → Enrichment → EPCIS Event → Database
                    ↓            ↓            ↓              ↓
               API Key     Event Schema   Facility      Event Log
               Check       Validation     Metadata      & Metrics
```

---

## ✅ Validation Rules

1. **API Key**: Valid and active facility key
2. **Event Structure**: Matches expected schema
3. **GTIN**: Valid and exists in master data
4. **Batch Number**: Format validation
5. **Quantity**: Positive number
6. **Timestamp**: Valid ISO 8601 format

---

## 📊 Monitoring

The module includes:
- **Logging Interceptor**: Logs all incoming requests
- **Metrics Interceptor**: Tracks processing time and success rates
- **Event Log**: Audit trail of all facility events

Access metrics:
```typescript
GET /api/integration/facility/metrics
?facilityCode=FAC-001
&startDate=2025-01-01
```

---

## 🧪 Testing

```bash
npm test facility-integration
```

Test coverage includes:
- Event validation
- EPCIS event generation
- Error handling
- API key authentication

---

## ⚠️ Error Handling

Common errors:
- `401 Unauthorized` - Invalid or missing API key
- `400 Bad Request` - Invalid event structure
- `404 Not Found` - GTIN or batch not found in master data
- `500 Internal Error` - System error during processing

All errors are logged with full context for troubleshooting.

---

## 🔗 Related Systems

- **Safaricom HIE**: National health information exchange
- **LMIS**: Local facility logistics system
- **Master Data**: Product and facility catalog
- **EPCIS Service**: Event persistence

---

**Maintained By**: Integration Team  
**Contact**: #facility-integration (Slack)
