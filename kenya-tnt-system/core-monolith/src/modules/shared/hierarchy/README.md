# Hierarchy Module

**Last Updated:** December 17, 2025  
**Purpose:** Manage packaging hierarchy relationships (pallet → case → package → serial number)

---

## 📋 Overview

This module handles the hierarchical relationships between packaging levels in the supply chain:
- **Pallets** (SSCC)
- **Cases** (SSCC)  
- **Packages** (GTIN)
- **Serial Numbers** (SGTIN)

---

## 🚀 Quick Start

### Pack Items

```typescript
POST /api/hierarchy/pack
{
  "parentId": "parent-sscc",
  "childIds": ["child-1", "child-2"],
  "packType": "case-to-pallet"  // or "package-to-case"
}
```

### Unpack Items

```typescript
POST /api/hierarchy/unpack
{
  "parentId": "parent-sscc",
  "childIds": ["child-1"]  // optional - unpack specific children
}
```

### Get Hierarchy

```typescript
GET /api/hierarchy/:sscc
// Returns complete hierarchy tree
```

---

## 🌳 Hierarchy Structure

```
Pallet (SSCC)
├── Case 1 (SSCC)
│   ├── Package 1 (GTIN + Serial)
│   └── Package 2 (GTIN + Serial)
└── Case 2 (SSCC)
    ├── Package 3 (GTIN + Serial)
    └── Package 4 (GTIN + Serial)
```

---

## 🔄 EPCIS Integration

Each pack/unpack operation generates:
- **AggregationEvent** - Records parent-child relationships
- **ObjectEvent** - Updates item status and location

---

## ⚠️ Validation Rules

1. Cannot pack already packed items
2. Cannot pack into full containers
3. Must match expected package counts
4. SSCC/GTIN must exist in system
5. Parent must be correct level (case/pallet)

---

## 🧪 Testing

```bash
npm test hierarchy.service
```

See `__tests__/hierarchy.service.spec.ts` for test coverage.

---

**Maintained By**: Backend Team  
**Related**: EPCIS Service, Manufacturer Module
