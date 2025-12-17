# Consignment Import Performance Analysis

## Current Performance Bottlenecks

### 1. **N+1 Query Problem - Product Lookups** (CRITICAL)
**Location**: Line 356 in `importFromPPB`
```typescript
for (const item of itemsByType.batch) {
  const product = await this.masterDataService.findByGTIN(item.GTIN); // ❌ Query per batch
}
```
**Impact**: For 100 batches = 100 database queries
**Fix**: Batch all GTINs first, then lookup in memory
```typescript
// Collect all GTINs first
const allGTINs = itemsByType.batch.map(item => item.GTIN);
const productsByGTIN = await this.masterDataService.findByGTINs(allGTINs); // ✅ Single query
```

### 2. **Serial Number Inserts - One by One** (CRITICAL)
**Location**: Lines 429-443
```typescript
for (const serial of item.serialNumbers) {
  const existingSerial = await this.serialNumberRepo.findOne({...}); // ❌ Query per serial
  if (!existingSerial) {
    await queryRunner.manager.save(serialNumber); // ❌ Insert per serial
  }
}
```
**Impact**: For 1000 serial numbers = 1000+ queries + 1000 inserts
**Fix**: Bulk insert with conflict handling
```typescript
// Collect all serial numbers first
const allSerialNumbers = itemsByType.batch.flatMap(item => 
  item.serialNumbers?.map(serial => ({
    batchId: batch.id,
    consignmentId: savedConsignment.id,
    serialNumber: serial,
  })) || []
);
// Bulk insert with ON CONFLICT DO NOTHING
await queryRunner.manager
  .createQueryBuilder()
  .insert()
  .into(SerialNumber)
  .values(allSerialNumbers)
  .orIgnore() // Skip duplicates
  .execute(); // ✅ Single bulk operation
```

### 3. **EPCIS Event Creation - Sequential** (HIGH)
**Location**: Lines 504, 585, 671
```typescript
for (const caseId of createdCaseIds) {
  const eventId = await this.gs1Service.createAggregationEvent(...); // ❌ Sequential
}
```
**Impact**: Network latency × number of cases/packages/shipments
**Fix**: Parallelize with Promise.all
```typescript
const caseEvents = await Promise.all(
  createdCaseIds.map(caseId => 
    this.createCaseAggregationEvent(caseId, ...)
  )
); // ✅ Parallel execution
```

### 4. **Product Lookups in EPCIS Events** (MEDIUM)
**Location**: Lines 494, 570, 656
```typescript
for (const cp of caseProducts) {
  const product = await queryRunner.manager.findOne(PPBProduct, {...}); // ❌ Query per product
}
```
**Impact**: Multiple queries per case/package/shipment
**Fix**: Batch product lookups before EPCIS creation
```typescript
const productIds = [...new Set(caseProducts.map(cp => cp.productId))];
const products = await queryRunner.manager.find(PPBProduct, {
  where: { id: In(productIds) }
}); // ✅ Single query
const productsMap = new Map(products.map(p => [p.id, p]));
```

### 5. **Case Label Uniqueness Check** (LOW)
**Location**: Line 284
```typescript
while (attempts < maxAttempts) {
  const existingCaseWithLabel = await queryRunner.manager.findOne(Case, {...}); // ❌ Query in loop
}
```
**Impact**: Up to 10 queries per case if conflicts exist
**Fix**: Check all labels in one query
```typescript
const labelsToCheck = itemsByType.case.map(item => generateLabel(item));
const existingLabels = await queryRunner.manager.find(Case, {
  where: { userId, label: In(labelsToCheck) },
  select: ['label']
}); // ✅ Single query
const existingLabelsSet = new Set(existingLabels.map(c => c.label));
```

## Performance Impact Estimates

### Current Performance (100 batches, 1000 serials):
- Product lookups: 100 queries × ~5ms = **500ms**
- Serial number inserts: 1000 queries + 1000 inserts × ~3ms = **6 seconds**
- EPCIS events (sequential): 50 events × ~100ms = **5 seconds**
- **Total: ~12 seconds**

### Optimized Performance:
- Product lookups: 1 query × ~5ms = **5ms** (100x faster)
- Serial number inserts: 1 bulk insert × ~50ms = **50ms** (120x faster)
- EPCIS events (parallel): 50 events ÷ 10 parallel × ~100ms = **500ms** (10x faster)
- **Total: ~600ms** (20x faster)

## Refactoring Strategy

### Option 1: Optimize Current File (Recommended for Quick Wins)
- Add batch operations for products and serial numbers
- Parallelize EPCIS event creation
- **Estimated improvement: 10-20x faster**
- **Risk: Low** (same file, same logic)

### Option 2: Refactor into Multiple Services (Recommended for Large JSONs)
Split into:
- `ConsignmentImportService` - Core import logic
- `ConsignmentHierarchyBuilder` - SSCC hierarchy building
- `ConsignmentEPCISService` - EPCIS event creation (parallelized)
- `ConsignmentBatchService` - Batch operations (products, serials)

**Benefits**:
- Easier to optimize each service independently
- Better testability
- Clearer separation of concerns
- **Estimated improvement: 15-25x faster**
- **Risk: Medium** (requires careful refactoring)

## Recommendations

1. **Immediate (Before Large JSONs)**:
   - ✅ Batch product lookups (1 hour)
   - ✅ Bulk serial number inserts (1 hour)
   - ✅ Parallelize EPCIS events (2 hours)
   - **Total time: 4 hours, 10-15x improvement**

2. **Short-term (For Production)**:
   - Refactor into services (1-2 days)
   - Add database indexes on frequently queried fields
   - Add progress tracking for large imports
   - **Total time: 2-3 days, 20x improvement**

3. **Long-term (For Scale)**:
   - Consider background job processing for very large imports
   - Add streaming/chunked processing for massive JSONs
   - Implement caching for product lookups

## Database Indexes Needed

```sql
-- For product lookups
CREATE INDEX IF NOT EXISTS idx_ppb_products_gtin ON ppb_products(gtin);

-- For serial number lookups
CREATE INDEX IF NOT EXISTS idx_serial_numbers_batch_serial ON serial_numbers(batch_id, serial_number);

-- For case label lookups
CREATE INDEX IF NOT EXISTS idx_cases_user_label ON "case"(user_id, label);
```

## Conclusion

**Refactoring alone won't improve performance** - the code structure is fine. The bottlenecks are:
1. **N+1 queries** (product lookups, serial number checks)
2. **Sequential operations** (EPCIS events, serial inserts)
3. **Missing bulk operations** (serial numbers)

**Quick wins (4 hours) can give 10-15x improvement** without refactoring. Refactoring into services would make future optimizations easier but isn't required for performance gains.

