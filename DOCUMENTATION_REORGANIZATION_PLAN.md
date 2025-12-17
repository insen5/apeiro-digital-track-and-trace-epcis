# Documentation Reorganization Plan

**Date:** December 17, 2025  
**Status:** 📋 Proposed  
**Purpose:** Move module-specific documentation closer to the code it documents

---

## 🎯 Problem Statement

Currently we have **100+ markdown files** scattered across:
- Repository root (60+ files)
- kenya-tnt-system root (67 files)
- Very few at module level where they belong

**Issues:**
1. ❌ Hard to find relevant documentation when working in a module
2. ❌ Documentation gets out of sync with code
3. ❌ Cluttered root directories
4. ❌ No clear ownership of documentation
5. ❌ Violates "documentation lives near code" principle

---

## 📁 Proposed New Structure

### Core Principle
**Documentation should live as close as possible to the code it documents**

```
kenya-tnt-system/
├── core-monolith/
│   ├── src/modules/
│   │   ├── shared/
│   │   │   ├── master-data/
│   │   │   │   ├── README.md                          ← Overview of master data system
│   │   │   │   ├── docs/
│   │   │   │   │   ├── ARCHITECTURE.md               ← Quality audit system architecture
│   │   │   │   │   ├── SYNC_SYSTEM.md                ← Sync logging standardization
│   │   │   │   │   ├── QUALITY_PARAMETERS.md         ← Calculation logic & dimensions
│   │   │   │   │   ├── ENRICHMENT_GUIDE.md           ← Visual comparison & enrichment
│   │   │   │   │   ├── ALERT_SYSTEM.md               ← Quality alert configuration
│   │   │   │   │   ├── SCHEDULING.md                 ← Automated scheduling
│   │   │   │   │   └── MIGRATION_GUIDE.md            ← How to add new entity types
│   │   │   │   ├── entities/
│   │   │   │   │   ├── products/
│   │   │   │   │   │   └── QUALITY_REPORT.md         ← Product-specific quality analysis
│   │   │   │   │   ├── premises/
│   │   │   │   │   │   └── QUALITY_REPORT.md         ← Premise-specific quality analysis
│   │   │   │   │   ├── facilities/
│   │   │   │   │   │   ├── QUALITY_REPORT_UAT.md     ← UAT facility quality
│   │   │   │   │   │   └── QUALITY_REPORT_PROD.md    ← Prod facility quality
│   │   │   │   │   └── practitioners/
│   │   │   │   │       └── QUALITY_REPORT.md         ← Practitioner quality analysis
│   │   │   │   └── __tests__/
│   │   │   │       └── README.md                     ← Testing guide for quality system
│   │   │   │
│   │   │   ├── hierarchy/
│   │   │   │   └── README.md                         ← Hierarchy service docs
│   │   │   │
│   │   │   ├── epcis-backfill/
│   │   │   │   ├── README.md                         ← EPCIS backfill overview
│   │   │   │   └── STATUS.md                         ← Current backfill status
│   │   │   │
│   │   │   └── barcode-scanner/
│   │   │       ├── README.md                         ← Scanner overview
│   │   │       └── DEBUGGING.md                      ← Scanner troubleshooting
│   │   │
│   │   ├── manufacturer/
│   │   │   ├── README.md                             ← Manufacturer module overview
│   │   │   ├── consignments/
│   │   │   │   ├── PERFORMANCE_ANALYSIS.md           ← Already exists ✓
│   │   │   │   └── README.md                         ← Consignment import guide
│   │   │   └── batches/
│   │   │       └── README.md                         ← Batch management docs
│   │   │
│   │   ├── regulator/
│   │   │   ├── README.md                             ← Regulator module overview
│   │   │   └── ppb-batches/
│   │   │       ├── VALIDATION.md                     ← Already exists ✓
│   │   │       ├── README.md                         ← PPB batch overview
│   │   │       └── SYNC.md                           ← PPB sync guide
│   │   │
│   │   ├── integration/
│   │   │   └── facility/
│   │   │       ├── README.md                         ← FLMIS integration overview
│   │   │       └── EVENT_VERIFICATION.md             ← Event verification report
│   │   │
│   │   └── auth/
│   │       └── README.md                             ← Auth setup & usage
│   │
│   ├── docs/                                         ← Core monolith-level docs
│   │   ├── deployment/
│   │   │   ├── ORACLE_CLOUD.md                       ← Oracle-specific deployment
│   │   │   ├── DOCKER_WORKFLOW.md                    ← Docker workflow guide
│   │   │   ├── QUICK_DEPLOY.md                       ← Quick deploy scripts
│   │   │   └── DEPLOYMENT_STATUS.md                  ← Current deployment status
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   └── README.md                         ← Migration history & guide
│   │   │   └── POSTGIS_LOCATION.md                   ← PostGIS analysis
│   │   └── testing/
│   │       ├── IMPLEMENTATION_PHASES.md              ← Testing phase documentation
│   │       └── COMPLETE_SUMMARY.md                   ← Testing completion status
│   │
│   └── README.md                                     ← Core monolith overview
│
├── frontend/
│   ├── README.md                                     ← Frontend overview
│   └── docs/
│       ├── QUALITY_UI.md                             ← Quality UI components
│       └── FIXES.md                                  ← Frontend fixes history
│
├── scripts/
│   └── README.md                                     ← Scripts usage guide
│
└── README.md                                         ← Kenya TNT system overview
```

### Repository Root (Keep Minimal)

```
/
├── README.md                                         ← Main project overview
├── ARCHITECTURE.md                                   ← High-level system architecture
├── DOCUMENTATION_INDEX.md                            ← Navigation to all docs (updated)
├── CODING_STANDARDS_README.md                        ← Coding standards
├── FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md            ← Database naming standards
├── .cursorrules                                      ← AI agent rules
│
├── docs/
│   ├── planning/                                     ← Architecture & planning
│   │   ├── full-rearch-plan.md
│   │   ├── IMPLEMENTATION_STATUS_CONSOLIDATED.md
│   │   ├── FEATURE_GAP_ANALYSIS.md
│   │   └── EXECUTION_SUMMARY.md
│   ├── data-model/
│   │   ├── DATABASE_SCHEMA_LATEST.md
│   │   ├── DATA_PERSISTENCE_ANALYSIS.md
│   │   ├── PARTIES_OBJECT_PERSISTENCE_AUDIT.md
│   │   └── DATABASE_NAMING_AUDIT.md
│   ├── implementation/
│   │   ├── MIGRATION_STATUS.md
│   │   ├── README_IMPLEMENTATION_STATUS.md
│   │   └── IMPLEMENTATION_COMPLETE_SUMMARY.md
│   ├── testing/
│   │   └── TEST_ILMD_IMPLEMENTATION.md
│   └── archive/                                      ← Historical documents
│
├── test-data/
│   ├── README_TEST_DATA.md
│   └── *.json files
│
└── kenya-tnt-system/                                 ← See structure above
```

---

## 📦 Specific File Movements

### Master Data & Quality System → `shared/master-data/docs/`

**Architecture & System Design:**
- `QUALITY_AUDIT_SYSTEM_ARCHITECTURE.md` → `ARCHITECTURE.md`
- `STANDARDIZED_SYNC_AND_AUDIT_SYSTEM.md` → `SYNC_SYSTEM.md`
- `QUALITY_AUDIT_ENRICHMENT_VISUAL_COMPARISON.md` → `ENRICHMENT_GUIDE.md`

**Quality Parameters & Calculations:**
- `DATA_QUALITY_PARAMETERS_CALCULATION_LOGIC.md` → `QUALITY_PARAMETERS.md`
- `STANDARDIZED_DATA_QUALITY_DIMENSIONS.md` → `QUALITY_PARAMETERS.md` (merge)
- `MASTER_DATA_QUALITY_TABLES_ANALYSIS.md` → `QUALITY_PARAMETERS.md` (merge)

**Configuration & Alerts:**
- `kenya-tnt-system/QUALITY_ALERT_SYSTEM.md` → `ALERT_SYSTEM.md`
- `kenya-tnt-system/QUALITY_ALERT_QUICK_REF.md` → `ALERT_SYSTEM.md` (merge)
- `CONFIG_DRIVEN_QUALITY_SYSTEM_SUMMARY.md` → `MIGRATION_GUIDE.md`

**Scheduling & Automation:**
- `MASTER_DATA_AUTOMATED_SCHEDULING.md` → `SCHEDULING.md`
- `kenya-tnt-system/AUTOMATED_SYNC_SETUP_GUIDE.md` → `SCHEDULING.md` (merge)

**Implementation & Fixes:**
- `SYNC_AND_AUDIT_IMPLEMENTATION_SUMMARY.md` → `docs/IMPLEMENTATION.md`
- `STRICT_COMPLETENESS_IMPLEMENTATION.md` → `docs/COMPLETENESS.md`

**Entity-Specific Quality Reports:**
- `DATA_QUALITY_REPORT_PRODUCT_MASTER_DATA.md` → `entities/products/QUALITY_REPORT.md`
- `DATA_QUALITY_REPORT_PREMISE_MASTER_DATA.md` → `entities/premises/QUALITY_REPORT.md`
- `DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md` → `entities/facilities/QUALITY_REPORT_UAT.md`
- `DATA_QUALITY_EXECUTIVE_SUMMARY.md` → `docs/EXECUTIVE_SUMMARY.md`
- `DATA_QUALITY_README.md` → `README.md` (module root)

**Refactoring & Fixes:**
- `PREMISE_QUALITY_REFACTORING_COMPLETE.md` → `entities/premises/docs/REFACTORING_2025.md`
- `PRODUCT_QUALITY_REFACTORING_COMPLETE.md` → `entities/products/docs/REFACTORING_2025.md`
- `FACILITY_QUALITY_UI_UPDATE.md` → `entities/facilities/docs/UI_UPDATES.md`
- `PRACTITIONERS_QUALITY_AUDIT_ADDED.md` → `entities/practitioners/docs/IMPLEMENTATION.md`
- Multiple `*_FIXES_*.md` files → Archive or merge into relevant entity docs

**Sync Logs:**
- `kenya-tnt-system/MASTER_DATA_SYNC_LOGGING_TESTS.md` → `__tests__/SYNC_LOGGING.md`
- `kenya-tnt-system/SYNC_LOGGING_QUICK_REF.md` → `docs/SYNC_SYSTEM.md` (merge)

### Practitioners Module → `shared/master-data/entities/practitioners/`

- `PRACTITIONERS_QUICK_START.md` → `README.md`
- `PRACTITIONERS_IMPLEMENTATION_SUMMARY.md` → `docs/IMPLEMENTATION.md`

### Facilities Module → `shared/master-data/entities/facilities/`

**Sync & Integration:**
- `kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md` → `docs/UAT_SYNC.md`
- `kenya-tnt-system/REAL_TIME_FACILITY_UAT_SYNC.md` → `docs/UAT_SYNC.md` (merge)
- `kenya-tnt-system/FACILITY_DATA_SOURCE_CONFIGURATION.md` → `docs/DATA_SOURCES.md`
- `SPARSE_FACILITY_DATA_HANDLING.md` → `docs/DATA_QUALITY.md`

**Implementation:**
- `kenya-tnt-system/FACILITY_UAT_IMPLEMENTATION_SUMMARY.md` → `docs/UAT_IMPLEMENTATION.md`
- `FACILITY_UAT_ENHANCED_COMPLETE.md` → Archive
- `FACILITY_PROD_IMPLEMENTATION.md` → `docs/PROD_IMPLEMENTATION.md`
- `FACILITY_PROD_COMPLETE.md` → Archive
- `FACILITY_PROD_VERIFICATION.md` → `docs/PROD_VERIFICATION.md`
- `FACILITY_PROD_TABLE_FIX.md` → Archive
- `FACILITY_CATALOG_FIXES.md` → Archive

**Data Quality:**
- `FACILITY_COORDINATES_DATA_QUALITY_UPDATE.md` → `docs/COORDINATE_UPDATES.md`
- `DATA_QUALITY_AND_KEPH_LEVEL_FIXES.md` → `docs/KEPH_LEVEL_FIXES.md`
- `KEPH_LEVEL_SYNC_SUCCESS.md` → Archive

### Premises Module → `shared/master-data/entities/premises/`

- `kenya-tnt-system/PREMISE_MASTER_DATA.md` → `README.md`
- `kenya-tnt-system/REAL_TIME_PREMISE_SYNC.md` → `docs/SYNC.md`
- `PREMISE_REFACTORING_SUMMARY.md` → `docs/REFACTORING.md`
- `PREMISE_AND_FACILITY_QUALITY_REFACTORING_PLAN.md` → Move to parent `master-data/docs/`
- Various `PREMISE_QUALITY_*.md` files → Merge into `docs/QUALITY.md`

### Database & Migrations → `core-monolith/docs/database/`

- `POSTGIS_LOCATION_ANALYSIS.md`
- `V08_ADDRESS_NORMALIZATION_COMPLETE.md` → `migrations/V08_SUMMARY.md`
- `V09_ADDRESS_CORRECTION_COMPLETE.md` → `migrations/V09_SUMMARY.md`
- `V10_COMPLETE_SUMMARY.md` → `migrations/V10_SUMMARY.md`
- `V10_TEST_DATA_SUMMARY.md` → Archive
- Various address normalization docs → `migrations/ADDRESS_NORMALIZATION.md`

### EPCIS & Backfill → `shared/epcis-backfill/`

- `EPCIS_EVENT_BACKFILL_STATUS.md` → `STATUS.md`
- `SERIAL_NUMBER_BACKFILL_SOLUTION.md` → `docs/SERIAL_NUMBERS.md`
- `EPC_LINKING_FIX_SUMMARY.md` → Archive

### PPB / Regulator → `regulator/ppb-batches/`

- `PPB_SYNC_READY.md` → `SYNC.md`
- `kenya-tnt-system/PPB_BATCH_RATIONALIZATION_COMPLETE.md` → `docs/RATIONALIZATION.md`
- `kenya-tnt-system/PPB_DATA_RATIONALIZATION.md` → `docs/DATA_RATIONALIZATION.md`
- `kenya-tnt-system/PPB_CONSIGNMENT_IMPORT.md` → `docs/IMPORT.md`
- `kenya-tnt-system/PPB_PRODUCT_CATALOG_SYNC_BACKLOG.md` → Archive
- `kenya-tnt-system/PPB_PRODUCT_SYNC.md` → `docs/PRODUCT_SYNC.md`

### Integration/Facility → `integration/facility/`

- `FLMIS_EVENT_VERIFICATION_REPORT.md` → `EVENT_VERIFICATION.md`
- `CLARIFICATIONS_USER_FACILITY_MESSAGE_LOG_GS1.md` → `docs/MESSAGE_LOG.md`

### Barcode Scanner → `shared/barcode-scanner/`

- `kenya-tnt-system/BARCODE_SCANNER_README.md` → `README.md`
- `kenya-tnt-system/SCANNER_DEBUGGING.md` → `DEBUGGING.md`
- `kenya-tnt-system/SCANNER_QUICK_START.md` → `QUICK_START.md`

### Deployment → `core-monolith/docs/deployment/`

- `kenya-tnt-system/ORACLE_CLOUD_DEPLOYMENT.md`
- `kenya-tnt-system/DEPLOYMENT_README.md`
- `kenya-tnt-system/DEPLOYMENT_STATUS.md`
- `kenya-tnt-system/DOCKER_WORKFLOW_README.md`
- `kenya-tnt-system/DOCKER_DEPLOYMENT_SUMMARY.md`
- `kenya-tnt-system/QUICK_DEPLOY.md`
- `DEPLOYMENT_COMPLETE.md` → Archive

### Testing → `core-monolith/docs/testing/`

- `TESTING_IMPLEMENTATION_PHASE_1.md`
- `TESTING_PHASE_1_COMPLETE.md`
- `TESTING_PHASE_2_PROGRESS.md`
- `TESTING_COMPLETE.md` → Merge into summary
- `QUICK_START_VERIFICATION.md`
- `kenya-tnt-system/PPB_TEST_INSTRUCTIONS.md`

### Level 5 Features → `docs/features/`

- `LEVEL_5_IMPLEMENTATION_COMPLETE.md`
- `kenya-tnt-system/LEVEL_5_FEATURES_GUIDE.md`
- `kenya-tnt-system/LEVEL_5_QUICK_REF.md`

### UI/Frontend → `frontend/docs/`

- `FRONTEND_QUALITY_REPORT_FIX.md`
- `CONSIGNMENT_TABLE_UI_UPDATES.md`
- `SYNC_STATUS_DISPLAY_COMPONENT.md`
- `AUDIT_REPORTS_RICH_UI_FIXED.md`
- `kenya-tnt-system/FRONTEND_FIX.md`

### Archive (Historical/Completed)

Move to `docs/archive/` with date suffix:
- All `*_COMPLETE.md` files (retain summary info elsewhere)
- All `*_FIXED.md` files
- All `*_SUCCESS.md` files
- All dated fix files (`DATA_QUALITY_FIXES_DEC_17_2025.md`, etc.)
- All implementation summaries for completed features
- `BACKEND_RUNNING.md`, `BACKEND_FIXED_COMPLETE.md`
- Various status/progress files that are now outdated

### Keep at Root (Project-Level)

- `README.md` - Main project overview
- `ARCHITECTURE.md` - High-level system architecture
- `DOCUMENTATION_INDEX.md` - Updated navigation (most important!)
- `CODING_STANDARDS_README.md`
- `FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md`
- `LOGGING_EXAMPLES.md`

---

## 🎯 Benefits

1. ✅ **Developer Experience**: Documentation is right where you're working
2. ✅ **Maintainability**: Easier to keep docs in sync with code changes
3. ✅ **Discoverability**: Natural place to look for module docs
4. ✅ **Ownership**: Clear responsibility for documentation
5. ✅ **Reduced Clutter**: Root directories become navigable again
6. ✅ **Better Context**: Related docs grouped together
7. ✅ **Onboarding**: New developers can understand modules independently

---

## 📋 Implementation Steps

### Phase 1: Create Module READMEs (Quick Wins)
1. Create `README.md` in key modules without one:
   - `shared/master-data/README.md` (most important!)
   - `shared/hierarchy/README.md`
   - `shared/epcis-backfill/README.md`
   - `shared/barcode-scanner/README.md`
   - `manufacturer/README.md`
   - `regulator/README.md`
   - `integration/facility/README.md`

### Phase 2: Master Data Module (Highest Priority)
2. Create `shared/master-data/docs/` directory structure
3. Move quality audit, sync, and data quality documentation
4. Create entity-specific subdirectories
5. Consolidate and merge related documents
6. Update DOCUMENTATION_INDEX.md

### Phase 3: Other Shared Modules
7. Organize barcode scanner docs
8. Organize EPCIS backfill docs
9. Organize hierarchy docs

### Phase 4: Feature Modules
10. Organize PPB/regulator docs
11. Organize manufacturer docs
12. Organize integration docs

### Phase 5: Core Monolith Docs
13. Create `core-monolith/docs/` structure
14. Move deployment documentation
15. Move database documentation
16. Move testing documentation

### Phase 6: Frontend Documentation
17. Create `frontend/docs/`
18. Move UI-related documentation

### Phase 7: Cleanup
19. Archive completed/outdated documentation
20. Update all internal documentation links
21. Final update to DOCUMENTATION_INDEX.md
22. Verify no broken links

---

## ⚠️ Important Considerations

### Don't Break Existing References
- Update DOCUMENTATION_INDEX.md first
- Add redirect notes in old locations
- Use git mv to preserve history
- Batch related moves together in single commits

### Merge Similar Documents
Rather than moving 5 similar docs, merge them into one comprehensive doc:
- Example: All `DATA_QUALITY_FIXES_*.md` → Single `entities/*/docs/FIXES.md`
- Keep archive of originals if needed

### Create New Master Documents
Some scattered docs should become sections of new master docs:
- `master-data/docs/QUALITY_PARAMETERS.md` ← Combines 3-4 separate files
- `master-data/docs/SYNC_SYSTEM.md` ← Combines sync-related docs

### Testing
Before finalizing:
1. Search codebase for documentation links
2. Update links in code comments
3. Update links in other documentation
4. Verify DOCUMENTATION_INDEX.md works as navigation

---

## 🔄 Migration Commands

```bash
# Example for master data module
cd kenya-tnt-system/core-monolith/src/modules/shared/master-data

# Create structure
mkdir -p docs/{entities/{products,premises,facilities,practitioners},archive}

# Move and rename (examples)
git mv ~/path/to/QUALITY_AUDIT_SYSTEM_ARCHITECTURE.md docs/ARCHITECTURE.md
git mv ~/path/to/DATA_QUALITY_REPORT_PRODUCT_MASTER_DATA.md docs/entities/products/QUALITY_REPORT.md

# Commit in logical chunks
git commit -m "docs(master-data): organize quality audit documentation"
```

---

## 📊 Success Metrics

- [ ] Root directory has < 15 markdown files
- [ ] kenya-tnt-system root has < 20 markdown files  
- [ ] Every module with >500 lines of code has a README.md
- [ ] All quality/sync documentation is in master-data/docs/
- [ ] All deployment documentation is in core-monolith/docs/deployment/
- [ ] DOCUMENTATION_INDEX.md successfully navigates to all current docs
- [ ] No broken documentation links in codebase

---

## 🚀 Next Steps

**Decision Point**: Should we:
1. **Option A - Big Bang**: Do all moves in phases over 1-2 sessions
2. **Option B - Incremental**: Start with Phase 1 (READMEs), then Phase 2 (master-data), iterate
3. **Option C - Hybrid**: Do Phases 1-2 now, defer phases 3-7 for later

**Recommendation**: **Option B - Incremental**
- Lower risk
- Easier to validate
- Can course-correct based on feedback
- Start with highest-value area (master-data module)

---

**Last Updated**: December 17, 2025  
**Status**: Awaiting approval to proceed
