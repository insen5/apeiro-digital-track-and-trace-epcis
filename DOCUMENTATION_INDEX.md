# 📚 Documentation Index - Single Source of Truth

**Last Updated**: December 17, 2025  
**Purpose**: Navigate to the LATEST and CURRENT documentation only

---

## 🎯 START HERE - Current Documentation

### 📖 Quick Reference Indices (Search These First!)

1. **[DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md)** - 🔍 **SEARCH HERE** for all quality/sync documentation
2. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - This file (complete navigation)

### Architecture & Design

3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (CURRENT)
4. **[docs/data-model/DATABASE_SCHEMA_LATEST.md](./docs/data-model/DATABASE_SCHEMA_LATEST.md)** - Complete database schema after V02-V05

### Implementation Status

5. **[IMPLEMENTATION_STATUS_CONSOLIDATED.md](./IMPLEMENTATION_STATUS_CONSOLIDATED.md)** - ⭐ **START HERE** - Complete status of architecture + Tatmeen gaps
6. **[README_IMPLEMENTATION_STATUS.md](./README_IMPLEMENTATION_STATUS.md)** - What's implemented NOW
7. **[docs/implementation/MIGRATION_STATUS.md](./docs/implementation/MIGRATION_STATUS.md)** - Applied migrations

### Data Persistence

8. **[DATA_PERSISTENCE_ANALYSIS.md](./DATA_PERSISTENCE_ANALYSIS.md)** - Complete analysis (CONSOLIDATED)
9. **[PARTIES_OBJECT_PERSISTENCE_AUDIT.md](./PARTIES_OBJECT_PERSISTENCE_AUDIT.md)** - Parties JSON → Database mapping

### Testing

10. **[test-data/README_TEST_DATA.md](./test-data/README_TEST_DATA.md)** - Which test files to use
11. **[docs/testing/TEST_ILMD_IMPLEMENTATION.md](./docs/testing/TEST_ILMD_IMPLEMENTATION.md)** - ILMD testing guide

### Master Data & Data Quality

**⚡ Quick Access**: See [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) for complete quality documentation navigation

12. **[DATA_QUALITY_README.md](./DATA_QUALITY_README.md)** - **START HERE** - Quick start guide for data quality
13. **[DATA_QUALITY_EXECUTIVE_SUMMARY.md](./DATA_QUALITY_EXECUTIVE_SUMMARY.md)** - Executive overview comparing premise vs product quality
14. **[kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md)** - 📦 **MASTER DATA MODULE** - Complete technical documentation

---

## 📦 Module Documentation (Documentation Lives Near Code!)

### Core Modules

| Module | README | Purpose |
|--------|--------|---------|
| **Master Data** | [master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md) | Quality auditing, sync orchestration |
| **Hierarchy** | [hierarchy/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/hierarchy/README.md) | Packaging hierarchy (pallet/case/package) |
| **EPCIS Backfill** | [epcis-backfill/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/epcis-backfill/README.md) | Retrospective EPCIS event generation |
| **Barcode Scanner** | [barcode-scanner/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/barcode-scanner/README.md) | Scanner integration & debugging |

### Feature Modules

| Module | README | Purpose |
|--------|--------|---------|
| **Manufacturer** | [manufacturer/README.md](./kenya-tnt-system/core-monolith/src/modules/manufacturer/README.md) | Batch creation, consignment imports |
| **Regulator (PPB)** | [regulator/README.md](./kenya-tnt-system/core-monolith/src/modules/regulator/README.md) | Regulatory oversight, analytics |
| **Facility Integration** | [integration/facility/README.md](./kenya-tnt-system/core-monolith/src/modules/integration/facility/README.md) | FLMIS/LMIS integration |

---

## ⚠️ DEPRECATED - Do NOT Use

All files in `docs/archive/` are outdated and kept for historical reference only.

**Recently Archived** (December 2025): Implementation summaries, completion docs, fix logs moved to `docs/archive/2025-12/`

---

## 🗂️ New Documentation Structure (Post-Reorganization)

```
/
├── README.md                                    ← Main project README
├── ARCHITECTURE.md                              ← System architecture (LATEST)
├── DOCUMENTATION_INDEX.md                       ← THIS FILE (Navigation hub)
├── DATA_QUALITY_INDEX.md                        ← Quality documentation index (SEARCH HERE!)
├── DATA_PERSISTENCE_ANALYSIS.md                 ← Data flow analysis
├── README_IMPLEMENTATION_STATUS.md              ← Current implementation status
├── CODING_STANDARDS_README.md                   ← Coding standards
├── FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md       ← Database naming standards
│
├── docs/
│   ├── planning/                                ← Architecture & planning
│   ├── data-model/                              ← Database schema documentation
│   ├── implementation/                          ← Implementation guides
│   ├── testing/                                 ← Test guides
│   └── archive/
│       └── 2025-12/                             ← December 2025 archived docs
│
├── test-data/                                   ← Test JSON files
│   ├── README_TEST_DATA.md                     ← Which files to use
│   └── TEST_QUICK_DEMO.json                    ← CURRENT test file
│
└── kenya-tnt-system/
    ├── core-monolith/
    │   ├── docs/
    │   │   ├── deployment/                      ← Deployment guides
    │   │   ├── database/                        ← Database documentation
    │   │   ├── testing/                         ← Testing documentation
    │   │   ├── LEVEL_5_FEATURES_GUIDE.md       ← Level 5 T&T features
    │   │   └── AUTOMATED_SYNC_SETUP_GUIDE.md   ← Sync scheduling
    │   │
    │   └── src/modules/
    │       ├── shared/
    │       │   ├── master-data/                 ← 📦 See DATA_QUALITY_INDEX.md
    │       │   │   ├── README.md
    │       │   │   └── docs/                    ← Quality, sync, alerts
    │       │   ├── hierarchy/README.md
    │       │   ├── epcis-backfill/README.md
    │       │   └── barcode-scanner/README.md
    │       │
    │       ├── manufacturer/
    │       │   ├── README.md
    │       │   └── consignments/PERFORMANCE_ANALYSIS.md
    │       │
    │       ├── regulator/
    │       │   ├── README.md
    │       │   └── ppb-batches/
    │       │       ├── VALIDATION.md
    │       │       └── docs/                    ← PPB documentation
    │       │
    │       └── integration/
    │           └── facility/
    │               ├── README.md
    │               ├── EVENT_VERIFICATION.md
    │               └── docs/
    │
    └── frontend/
        └── docs/                                ← Frontend documentation
```

---

## 📋 Quick Reference

**Need data quality documentation?** → [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) 🔍  
**Need to understand master data system?** → [master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md)  
**Need quality reports for specific entity?** → [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) (see entity-specific section)  
**Need deployment guides?** → [core-monolith/docs/deployment/](./kenya-tnt-system/core-monolith/docs/deployment/)  
**Need data persistence details?** → [DATA_PERSISTENCE_ANALYSIS.md](./DATA_PERSISTENCE_ANALYSIS.md)  
**Need database schema?** → [docs/data-model/DATABASE_SCHEMA_LATEST.md](./docs/data-model/DATABASE_SCHEMA_LATEST.md)  
**Need migration history?** → [docs/implementation/MIGRATION_STATUS.md](./docs/implementation/MIGRATION_STATUS.md)  
**Need to test ILMD?** → [docs/testing/TEST_ILMD_IMPLEMENTATION.md](./docs/testing/TEST_ILMD_IMPLEMENTATION.md)  
**Need module documentation?** → See "Module Documentation" section above  
**Confused by old docs?** → Check docs/archive/2025-12/ (don't use them!)

---

## 🔄 Documentation Lifecycle

### When Creating New Documentation
1. Add to appropriate `docs/` subdirectory
2. Update this DOCUMENTATION_INDEX.md
3. Archive old versions to `docs/archive/`

### When Updating Documentation
1. Update the file in-place
2. Add "Last Updated" date in file header
3. Move superseded version to `docs/archive/` with date suffix

### When Archiving
```bash
mv OLD_DOC.md docs/archive/OLD_DOC_2025-12-11.md
```

---

## ✅ Latest Files (Use These ONLY)

**Data & Schema:**
- DATA_PERSISTENCE_ANALYSIS.md (Dec 11, 2025)
- PARTIES_OBJECT_PERSISTENCE_AUDIT.md (Dec 11, 2025)
- docs/data-model/DATABASE_SCHEMA_LATEST.md

**Planning & Architecture:**
- full-rearch-plan.md (Dec 2025) - Original architecture plan
- FEATURE_GAP_ANALYSIS.md (Dec 2025) - Tatmeen Level 5 comparison
- **IMPLEMENTATION_STATUS_CONSOLIDATED.md (Dec 14, 2025) ← CURRENT STATUS**
- **core-monolith/docs/LEVEL_5_FEATURES_GUIDE.md (Dec 17, 2025) ← LEVEL 5 FEATURES**

**Implementation:**
- README_IMPLEMENTATION_STATUS.md (Dec 11, 2025)

**Master Data & Data Quality (Dec 17, 2025 - REORGANIZED):**
- **[DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) (Dec 17, 2025) ← 🔍 SEARCH HERE FOR ALL QUALITY DOCS**
- **DATA_QUALITY_EXECUTIVE_SUMMARY.md (Dec 14, 2025) ← START HERE FOR EXECUTIVES**
- DATA_QUALITY_README.md (Dec 14, 2025) ← Quick start
- **[master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md) (Dec 17, 2025) ← COMPLETE TECHNICAL DOCS**
- master-data/docs/ARCHITECTURE.md - System architecture
- master-data/docs/SYNC_SYSTEM.md - Sync logging
- master-data/docs/QUALITY_PARAMETERS.md - Calculation logic
- master-data/docs/ENRICHMENT_GUIDE.md - Visual comparison
- master-data/docs/ALERT_SYSTEM.md - Automated alerts
- master-data/docs/SCHEDULING.md - Cron setup
- master-data/docs/entities/products/QUALITY_REPORT.md - Product quality
- master-data/docs/entities/premises/QUALITY_REPORT.md - Premise quality
- master-data/docs/entities/facilities/QUALITY_REPORT_UAT.md - Facility quality

**Module Documentation (Dec 17, 2025 - NEW):**
- manufacturer/README.md - Manufacturer module
- regulator/README.md - PPB regulator module
- integration/facility/README.md - FLMIS integration
- hierarchy/README.md - Packaging hierarchy
- epcis-backfill/README.md - EPCIS backfill
- barcode-scanner/README.md - Scanner integration

**Deployment (Dec 17, 2025 - REORGANIZED):**
- core-monolith/docs/deployment/ORACLE_CLOUD_DEPLOYMENT.md
- core-monolith/docs/deployment/DOCKER_WORKFLOW_README.md
- core-monolith/docs/deployment/QUICK_DEPLOY.md

**Testing:**
- test-data/TEST_QUICK_DEMO.json (CURRENT)
- core-monolith/docs/testing/ - Testing documentation

**Everything Else**: Check docs/archive/2025-12/ (outdated)

---

## 🔄 Recent Changes

### December 17, 2025 - Major Documentation Reorganization
- ✅ Moved 60+ documentation files closer to the code they document
- ✅ Created module READMEs for all major modules
- ✅ Master data documentation now in `master-data/docs/`
- ✅ Entity-specific docs in `master-data/docs/entities/`
- ✅ Deployment docs in `core-monolith/docs/deployment/`
- ✅ Archived 40+ completed/outdated docs to `docs/archive/2025-12/`
- ✅ Created [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) for easy searching
- ✅ Updated all internal links and references

**Benefit**: Documentation is now easier to find, maintain, and keep in sync with code changes!

---

**Maintained By**: Development Team  
**Review Frequency**: After each major change  
**Last Major Reorganization**: December 17, 2025
