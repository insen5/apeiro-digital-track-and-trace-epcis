# snake_case Migration Progress

**Started:** December 21, 2025  
**Status:** IN PROGRESS - Phase 2 Complete, Phase 3 Started

## Completed ✅

### Phase 2: Entity Layer (COMPLETE)
- ✅ base.entity.ts - Updated `createdAt`/`updatedAt` to `created_at`/`updated_at`
- ✅ user.entity.ts - 6 properties updated
- ✅ batch.entity.ts - 14 properties updated
- ✅ consignment.entity.ts - 20 properties updated
- ✅ serial-number.entity.ts - 4 properties updated
- ✅ package.entity.ts - 7 properties updated
- ✅ shipment.entity.ts - 8 properties updated
- ✅ case.entity.ts - 5 properties updated
- ✅ cases-products.entity.ts - 4 properties updated
- ✅ consignment-batch.entity.ts - 3 properties updated
- ✅ batch-notification-settings.entity.ts - 3 properties updated

**Total: 11 entity files, ~75 properties converted to snake_case**

### Phase 2: EPCIS Entities (PARTIAL)
- ✅ epcis-event.entity.ts - 22 overrides removed, properties converted to snake_case

**Note:** Remaining 13 EPCIS entities need same treatment (facility-inventory, facility-receiving, etc.)

### Phase 3: DTOs (STARTED)
- ✅ create-batch.dto.ts - `productId` → `product_id`
- 🔄 import-ppb-consignment.dto.ts - PPBHeaderDto partially updated

## In Progress 🔄

### Phase 3: DTOs
**Current:** Updating import-ppb-consignment.dto.ts (456 lines, many nested classes)

**Remaining DTO files (~15):**
- PPBItemDto (in import-ppb-consignment.dto.ts)
- ManufacturerDto, MAHDto, PartyDto, LocationDto, PartiesDto, LogisticsDto
- PPBConsignmentDto, ImportPPBConsignmentDto
- create-shipment.dto.ts
- create-package.dto.ts
- create-case.dto.ts
- assign-sscc.dto.ts
- forward-shipment.dto.ts
- receive-shipment.dto.ts
- And ~9 more...

## Not Started ❌

### Phase 4: Service Layer (169 queries in 20 files)
- master-data.service.ts (21 queries)
- generic-quality-report.service.ts (10 queries)
- consignment.service.ts (2 queries)
- shipment.service.ts (2 queries)
- ppb-batch.service.ts (2 queries)
- epcis-backfill.service.ts (1 query)
- And 14 more service files...

### Phase 7: Frontend Types (6 files, ~44 interfaces)
- lib/api/manufacturer.ts (18 refs)
- lib/api/distributor.ts (11 refs)
- lib/api/regulator.ts (15 refs)
- And 3 more...

### Phase 8: Frontend Components (12+ files, 190+ refs)
- components/UnifiedJourneyViewer.tsx (94 refs - CRITICAL!)
- app/manufacturer/consignments/page.tsx
- app/regulator/ppb-batches/page.tsx
- And 9+ more components...

### Phase 10: Documentation
- Update .cursorrules
- Update SCHEMA_STANDARDS.md
- Archive old decision docs
- Create new decision document

### Phase 11: Testing
- Backend API tests
- Frontend integration tests

## Critical Notes ⚠️

1. **Backend will NOT compile** until all DTOs and services referencing old entity properties are updated
2. **Frontend will break** until API types are updated to match new snake_case responses
3. **This is a blocking migration** - system cannot run in partial state
4. **Estimated remaining time:** 12-14 hours

## Next Steps

1. Complete PPB consignment DTO (large, complex)
2. Update remaining 15 DTO files
3. Update 20 service files (QueryBuilder queries)
4. Update frontend API types
5. Update frontend components
6. Test backend APIs
7. Test frontend
8. Update documentation

## Files Modified So Far

- core-monolith/src/shared/domain/entities/base.entity.ts
- core-monolith/src/shared/domain/entities/user.entity.ts
- core-monolith/src/shared/domain/entities/batch.entity.ts
- core-monolith/src/shared/domain/entities/consignment.entity.ts
- core-monolith/src/shared/domain/entities/serial-number.entity.ts
- core-monolith/src/shared/domain/entities/package.entity.ts
- core-monolith/src/shared/domain/entities/shipment.entity.ts
- core-monolith/src/shared/domain/entities/case.entity.ts
- core-monolith/src/shared/domain/entities/cases-products.entity.ts
- core-monolith/src/shared/domain/entities/consignment-batch.entity.ts
- core-monolith/src/shared/domain/entities/batch-notification-settings.entity.ts
- core-monolith/src/shared/domain/entities/epcis-event.entity.ts
- core-monolith/src/modules/manufacturer/dto/create-batch.dto.ts
- core-monolith/src/modules/shared/consignments/dto/import-ppb-consignment.dto.ts (partial)

**Total: 14 files modified**

## Rollback Instructions

If migration needs to be rolled back:

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
git status
git diff --stat
git checkout -- .  # Revert all changes
```

Or commit current progress:
```bash
git add -A
git commit -m "WIP: snake_case migration - Phase 2 complete (entities), Phase 3 started (DTOs)"
```

