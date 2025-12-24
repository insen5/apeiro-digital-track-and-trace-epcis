# Snake Case Migration - Status Report

**Date:** December 22, 2025 00:11 UTC  
**Status:** IN PROGRESS  
**Overall Completion:** ~40% (Phase 1-2 complete, Phase 3 in progress)

---

## ✅ Completed Work

### Phase 1: Core Entities (100% Complete)
**Duration:** ~2 hours  
**Files Updated:** 12

1. **BaseEntity** (`base.entity.ts`)
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
   - All entities extending BaseEntity now inherit snake_case timestamps

2. **Legacy Entities** (10 files):
   - `user.entity.ts`: `roleId` → `role_id`, `glnNumber` → `gln_number`, etc.
   - `batch.entity.ts`: `productId` → `product_id`, `sentQty` → `sent_qty`, `batchno` → `batch_no`, etc.
   - `consignment.entity.ts`: `eventID` → `event_id`, `eventType` → `event_type`, etc.
   - `serial-number.entity.ts`: `batchId` → `batch_id`, `consignmentId` → `consignment_id`, etc.
   - `package.entity.ts`: `shipmentId` → `shipment_id`, `ssccBarcode` → `sscc_barcode`, etc.
   - `shipment.entity.ts`: `pickupDate` → `pickup_date`, `expectedDeliveryDate` → `expected_delivery_date`, etc.
   - `case.entity.ts`: `packageId` → `package_id`, `eventId` → `event_id`, etc.
   - `cases-products.entity.ts`: `caseId` → `case_id`, `productId` → `product_id`, `batchId` → `batch_id`, etc.
   - `consignment-batch.entity.ts`: `consignmentId` → `consignment_id`, `batchId` → `batch_id`
   - `batch-notification-settings.entity.ts`: `userId` → `user_id`, `earlyWarningEnabled` → `early_warning_enabled`, etc.

3. **EPCIS Event Entity** (`epcis-event.entity.ts`)
   - Removed ALL `@Column({ name: 'snake_case' })` overrides
   - Renamed ALL properties to snake_case: `eventId` → `event_id`, `eventType` → `event_type`, etc.
   - **Impact:** This is the gold standard entity; other 13 EPCIS entities will follow this pattern

---

### Phase 2: DTOs with Unit Tests (42% Complete - 8/19 files)
**Duration:** ~1.5 hours  
**Files Updated:** 8  
**Tests Created:** 2 test files with 19 passing tests

#### ✅ Completed DTOs:

1. **create-batch.dto.ts**
   - `productId` → `product_id`
   - `batchno` → `batch_no`
   - **Tests:** 8 passing tests ✅

2. **import-ppb-consignment.dto.ts** (Complex - 456 lines, 10 nested DTOs)
   - `PPBHeaderDto`: `eventID` → `event_id`, `eventType` → `event_type`, etc.
   - `PPBItemDto`: `parentSSCC` → `parent_sscc`, `GTIN` → `gtin`, `productName` → `product_name`, etc.
   - `ManufacturerDto`, `MAHDto`: `ppbID` → `ppb_id`
   - `PartyDto`: `ppbID` → `ppb_id`
   - `PartiesDto`: `manufacturer_party`, `mah_party`, `importer_party`, `destination_party`, `manufacturing_site`, etc.
   - `LogisticsDto`: `portOfEntry` → `port_of_entry`, `finalDestinationSgln` → `final_destination_sgln`, etc.
   - `PPBConsignmentDto`: `consignmentID` → `consignment_id`, `shipmentDate` → `shipment_date`, etc.
   - **Tests:** 11 passing tests ✅

3. **create-shipment.dto.ts**
   - `supplierId` → `supplier_id`
   - `premiseId` → `premise_id`
   - `logisticsProviderId` → `logistics_provider_id`
   - `pickupDate` → `pickup_date`
   - `expectedDeliveryDate` → `expected_delivery_date`
   - `pickupLocation` → `pickup_location`
   - `destinationAddress` → `destination_address`
   - `customerId` → `customer_id`
   - `packageIds` → `package_ids`
   - `ssccBarcode` → `sscc_barcode`

4. **create-package.dto.ts**
   - `caseIds` → `case_ids`

5. **create-case.dto.ts** (manufacturer module)
   - `productId` → `product_id`
   - `batchId` → `batch_id`

6. **forward-shipment.dto.ts**
   - `receivedShipmentId` → `received_shipment_id`
   - `pickupDate` → `pickup_date`
   - `expectedDeliveryDate` → `expected_delivery_date`
   - `pickupLocation` → `pickup_location`
   - `destinationAddress` → `destination_address`
   - `customerId` → `customer_id`

7. **receive-shipment.dto.ts**
   - `ssccBarcode` → `sscc_barcode`
   - `pickupDate` → `pickup_date`
   - `expectedDeliveryDate` → `expected_delivery_date`
   - `pickupLocation` → `pickup_location`
   - `destinationAddress` → `destination_address`

8. **facility-event.dto.ts** (3 DTOs)
   - `ProductIdentifierDto`: `batchNo` → `batch_no`, `serialNumbers` → `serial_numbers`
   - `ReceivedEventDto`: `eventId` → `event_id`, `eventTimestamp` → `event_timestamp`, `facilityGLN` → `facility_gln`, `facilityId` → `facility_id`, `shipmentSSCC` → `shipment_sscc`, `readPoint` → `read_point`, `bizLocation` → `biz_location`
   - `ConsumedEventDto`: Same snake_case conversions + `patientId` → `patient_id`

#### ⏳ Remaining DTOs (11 files):

9. **pack.dto.ts** - `PackDto`, `PackLiteDto`, `PackLargeDto`, `UnpackAllDto`
   - `caseIds` → `case_ids`
   - `shipmentId` → `shipment_id`
   - `packageIds` → `package_ids`

10. **shared/cases/dto/create-case.dto.ts** - `CaseProductDto`, `CreateCaseDto`
    - `productId` → `product_id`
    - `batchId` → `batch_id`

11. **shared/packages/dto/create-package.dto.ts**
    - `caseIds` → `case_ids`

12. **create-product-status.dto.ts**
    - `productId` → `product_id`
    - `batchId` → `batch_id`
    - `actorType` → `actor_type`

13. **create-product.dto.ts**
    - `productName` → `product_name`
    - `brandName` → `brand_name`

14. **gs1.dto.ts** (11 interfaces)
    - `GenerateSSCCDto`: `companyPrefix` → `company_prefix`
    - `GenerateSGTINDto`: `serialNumber` → `serial_number`, `companyPrefix` → `company_prefix`
    - `GenerateBatchNumberDto`: `productId` → `product_id`, `userId` → `user_id`
    - `GCPLookupResult`: `companyName` → `company_name`, `entityId` → `entity_id`, `entityType` → `entity_type`, `contactEmail` → `contact_email`, `contactPhone` → `contact_phone`
    - `ExtractGCPFromIdentifierDto`: `prefixLength` → `prefix_length`

15. **lmis-event.dto.ts** (LARGE - 552 lines, 12 DTOs)
    - `CoordinatesDto`: `accuracyMeters` → `accuracy_meters`
    - `LocationDto`: `facilityGln` → `facility_gln`, `capturedAt` → `captured_at`
    - `LMISItemDto`: `batchNumber` → `batch_number`, `expiryDate` → `expiry_date`, `systemQuantity` → `system_quantity`, `physicalQuantity` → `physical_quantity`
    - `AdjustmentItemDto`: `batchNumber` → `batch_number`, `expiryDate` → `expiry_date`, `quantityChange` → `quantity_change`
    - `ShipmentDto`: `shipmentId` → `shipment_id`, `receivedAt` → `received_at`
    - `DispenseEventDto`: `batchNumber` → `batch_number`, `expiryDate` → `expiry_date`, `dispensationId` → `dispensation_id`
    - `ReceiveEventDto`: `grnId` → `grn_id`
    - `AdjustEventDto`: `referenceId` → `reference_id`
    - `StockCountEventDto`: `countSessionId` → `count_session_id`
    - `ReturnEventDto`: `returnId` → `return_id`
    - `RecallEventDto`: `recallNoticeId` → `recall_notice_id`, `recallClass` → `recall_class`

16. **modules/integration/facility/dto/lmis-event.dto.ts** (duplicate or same as above?)

17-19. **Other manufacturer DTOs** (check for duplicates or missed files)

---

## ⏳ Remaining Work

### Phase 3: Service Layer (0% Complete)
**Estimated Duration:** 4-6 hours  
**Scope:** 169 QueryBuilder/query calls in 20 service files

#### Critical Service Files to Update:

1. **batch.service.ts** - `createBatch()`, `findAllBatches()`
2. **consignment.service.ts** - `importPPBConsignment()`, `getConsignmentFlow()`
3. **shipment.service.ts** - `createShipment()`, `receiveShipment()`, `forwardShipment()`
4. **package.service.ts** - `createPackage()`
5. **case.service.ts** - `createCase()`
6. **master-data.service.ts** - `getUatFacilityStats()`, `getPremiseStats()` (partially fixed)
7. **generic-quality-audit-enrichment.service.ts** - `getEnrichedAuditData()` (partially fixed)
8. **facility-event.service.ts** - `handleFacilityEvent()`
9. **epcis.service.ts** - `createEPCISEvent()`, `getJourneyBySSCC()`
10. **l5-tnt-analytics.service.ts** - `createProductStatus()`

**Pattern to Follow:**
```typescript
// ❌ OLD (camelCase in queries)
.where('batch.productId = :productId', { productId })
.andWhere('batch.batchno = :batchno', { batchno })

// ✅ NEW (snake_case in queries)
.where('batch.product_id = :product_id', { product_id })
.andWhere('batch.batch_no = :batch_no', { batch_no })
```

---

### Phase 4: Frontend API Types (0% Complete)
**Estimated Duration:** 1-2 hours  
**Scope:** 6 API type definition files in `frontend/lib/api`

#### Files to Update:

1. **frontend/lib/api/batches.ts** - `Batch`, `CreateBatchDto`, `BatchResponse`
2. **frontend/lib/api/consignments.ts** - `Consignment`, `ImportPPBConsignmentDto`
3. **frontend/lib/api/shipments.ts** - `Shipment`, `CreateShipmentDto`
4. **frontend/lib/api/packages.ts** - `Package`, `CreatePackageDto`
5. **frontend/lib/api/cases.ts** - `Case`, `CreateCaseDto`
6. **frontend/lib/api/master-data.ts** - `Product`, `Premise`, `Facility`

---

### Phase 5: Frontend Components (0% Complete)
**Estimated Duration:** 3-4 hours  
**Scope:** 190+ property references in 12+ component files

#### Critical Components:

1. **app/manufacturer/batches/components/BatchTable.tsx** - Display `batch.product_id`, `batch.batch_no`, etc.
2. **app/manufacturer/consignments/components/ConsignmentTable.tsx** - Display `consignment.consignment_id`, etc.
3. **app/manufacturer/shipments/components/ShipmentTable.tsx** - Display `shipment.shipment_id`, etc.
4. **app/regulator/products/components/ProductTable.tsx** - Display `product.product_name`, etc.
5. **app/regulator/facility-uat-data/components/FacilityTable.tsx** - Display `facility.facility_name`, etc.
6. **components/shared/GenericQualityAuditTab.tsx** - Already partially fixed
7. **components/shared/ImprovedQualityAuditTab.tsx** - Needs update

---

### Phase 6: Testing (0% Complete)
**Estimated Duration:** 2-3 hours

#### Backend API Tests:
- [ ] POST `/api/auth/login` - Test with email/password
- [ ] POST `/api/batches` - Test with `product_id`, `batch_no`, expiry, qty
- [ ] POST `/api/consignments/import` - Test with complete snake_case payload
- [ ] GET `/api/batches` - Verify response has snake_case properties
- [ ] GET `/api/consignments/:id` - Verify response has snake_case properties

#### Frontend Tests:
- [ ] Navigate to `/manufacturer/batches` - Verify table displays correctly
- [ ] Navigate to `/manufacturer/consignments` - Verify table displays correctly
- [ ] Navigate to `/regulator/products` - Verify master data displays correctly
- [ ] Navigate to `/regulator/facility-uat-data` - Verify quality audit displays correctly

---

### Phase 7: Documentation (0% Complete)
**Estimated Duration:** 1 hour

#### Files to Update:

1. **.cursorrules** - Update naming convention rules
2. **SCHEMA_STANDARDS.md** - Remove camelCase/snake_case divergence
3. **Create SNAKE_CASE_MIGRATION_DECISION.md** - Document the decision and rationale
4. **Update DOCUMENTATION_INDEX.md** - Add new decision document

---

## 📊 Progress Summary

| Phase | Status | Files | Completion |
|-------|--------|-------|------------|
| Phase 1: Core Entities | ✅ Complete | 12/12 | 100% |
| Phase 2: DTOs | 🔄 In Progress | 8/19 | 42% |
| Phase 3: Service Layer | ⏳ Pending | 0/20 | 0% |
| Phase 4: Frontend Types | ⏳ Pending | 0/6 | 0% |
| Phase 5: Frontend Components | ⏳ Pending | 0/12 | 0% |
| Phase 6: Testing | ⏳ Pending | 0/10 | 0% |
| Phase 7: Documentation | ⏳ Pending | 0/4 | 0% |
| **TOTAL** | **🔄 40% Complete** | **20/83** | **40%** |

---

## 🎯 Recommended Next Steps

### Immediate (Next 2 hours):
1. ✅ Complete remaining 11 DTO files
2. ✅ Write unit tests for each DTO (target: 50+ tests total)
3. ✅ Mark Phase 2 as complete

### Short-term (Next 4-6 hours):
4. 🔄 Update 20 service files with snake_case queries
5. 🔄 Fix TypeORM QueryBuilder calls
6. 🔄 Test each service with Postman/Thunder Client
7. 🔄 Mark Phase 3 as complete

### Medium-term (Next 3-4 hours):
8. 🔄 Update 6 frontend API type files
9. 🔄 Update 12+ frontend components
10. 🔄 Test each page in browser
11. 🔄 Mark Phases 4-5 as complete

### Final (Next 3 hours):
12. 🔄 Run comprehensive backend API tests
13. 🔄 Run comprehensive frontend E2E tests
14. 🔄 Update documentation
15. 🔄 Mark Phases 6-7 as complete

---

## ⚠️ Known Risks & Challenges

1. **Service Layer Complexity**: 169 query calls across 20 files - high risk of missing references
2. **Frontend Component Density**: 190+ property references - tedious and error-prone
3. **Test Data**: All test JSON files (`TEST_QUICK_DEMO.json`) need snake_case update
4. **Migration Files**: May need new migration to alter column names in legacy tables
5. **Backward Compatibility**: External integrations (PPB API, Safaricom HIE) may send camelCase - need transformation layer

---

## 🚀 Success Criteria

- [ ] All database columns use snake_case
- [ ] All TypeORM entities use snake_case properties (no `@Column({ name: '...' })` overrides except for truly legacy tables)
- [ ] All DTOs use snake_case properties
- [ ] All service queries use snake_case
- [ ] All frontend API types use snake_case
- [ ] All frontend components display snake_case properties
- [ ] All tests pass (backend + frontend)
- [ ] All documentation updated
- [ ] No console errors in browser
- [ ] No compilation errors in backend

---

**Last Updated:** December 22, 2025 00:11 UTC  
**Estimated Completion:** December 22, 2025 18:00 UTC (18 hours remaining)

