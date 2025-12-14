# Test Data Files - Use ONLY These

## CURRENT Test Files (Use These)

### 1. **TEST_QUICK_DEMO.json** ✅ PRIMARY
- **Purpose**: Quick consignment import test (1 batch, 100 serials)
- **Status**: CURRENT - Use this for testing
- **Product**: AMOXICILLIN 875MG+CLAVULANIC ACID 125MG
- **Last Updated**: Dec 9, 2025

### 2. **DEMO_AMOX_FINAL.json**
- **Purpose**: Single AMOX batch demo
- **Status**: Active
- **Use For**: Simple single-batch tests

### 3. **DEMO_5_AMOX_CONSIGNMENTS.json**
- **Purpose**: Multiple consignments (5 batches)
- **Status**: Active
- **Use For**: Bulk import testing

---

## DEPRECATED Test Files (In archive/)

All other DEMO_*.json files are outdated. Do NOT use.

---

## Test Data Naming Convention

**Format**: `{PURPOSE}_{PRODUCT}_{VERSION}.json`

Examples:
- TEST_QUICK_DEMO.json (quick test, demo data)
- TEST_FULL_HIERARCHY.json (complete hierarchy test)
- PROD_SAMPLE_BATCH_001.json (production sample)

**DO NOT CREATE**:
- DEMO_SIMPLE_*, DEMO_PROPER_*, DEMO_OLD_*, etc. (confusing versions)

---

## When to Create New Test Files

**Create New File When:**
1. Testing new feature (e.g., TEST_ILMD_VALIDATION.json)
2. Different product type (e.g., TEST_VACCINE_BATCH.json)
3. Edge case (e.g., TEST_PARTIAL_APPROVAL.json)

**DO NOT Create:**
- Multiple versions of same test (DEMO_V1, DEMO_V2, DEMO_FINAL, DEMO_PROPER)
- Use git for versioning, not filenames!

---

## Current Primary Test File

**USE THIS**: `TEST_QUICK_DEMO.json`

```bash
# Import test consignment
curl -X POST http://localhost:4000/api/regulator/ppb-batches/consignment/import \
  -H "Content-Type: application/json" \
  -d @test-data/TEST_QUICK_DEMO.json
```

**Contains:**
- Complete parties object (6 parties)
- Full hierarchy (shipment → package → case → batch)
- 100 serial numbers
- All PPB metadata (permits, approval, logistics)

---

**Maintained By**: Development Team  
**Last Review**: Dec 11, 2025
