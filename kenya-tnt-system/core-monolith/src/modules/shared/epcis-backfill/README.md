# EPCIS Backfill Module

**Last Updated:** December 17, 2025  
**Purpose:** Backfill EPCIS events for existing consignments, batches, and serial numbers

---

## 📋 Overview

This module handles the retrospective creation of EPCIS events for data that was imported before the EPCIS event system was fully implemented. It ensures complete traceability by generating proper ObjectEvent, AggregationEvent, and TransformationEvent records.

---

## 🚀 Quick Start

### Trigger Backfill

```typescript
POST /api/epcis-backfill/run
{
  "entityType": "consignments",  // or "batches", "serial-numbers"
  "force": false                  // skip already backfilled items
}
```

### Check Status

```typescript
GET /api/epcis-backfill/status
```

---

## 📚 Documentation

- **[STATUS.md](./STATUS.md)** - Current backfill status and progress
- **[docs/SERIAL_NUMBERS.md](./docs/SERIAL_NUMBERS.md)** - Serial number backfill solution

---

## 🔄 Backfill Process

1. **Identify Missing Events** - Query for entities without corresponding EPCIS events
2. **Generate Events** - Create proper EPCIS event structure
3. **Validate** - Ensure event structure meets EPCIS standards
4. **Persist** - Save events to database
5. **Link** - Associate events with entities
6. **Audit** - Log backfill progress

---

## 🎯 Entity Types

### Consignments
- ObjectEvent for consignment receipt
- Links to batches, cases, packages

### Batches
- ObjectEvent for batch creation
- TransformationEvent for manufacturing
- Links to serial numbers

### Serial Numbers
- ObjectEvent for each serialized item
- AggregationEvent for packaging hierarchy

---

## ⚠️ Important Notes

- Backfill is idempotent - safe to run multiple times
- Use `force=false` to skip already processed items
- Large backfills may take several minutes
- Monitor logs for errors

---

**Maintained By**: Backend Team  
**Related**: EPCIS Service, Hierarchy Module
