# 📚 Documentation Index - Single Source of Truth

**Last Updated**: December 22, 2025  
**Purpose**: Navigate to the LATEST and CURRENT documentation only

> **✨ Major Reorganization**: Documentation moved closer to code! See [What Changed](#-recent-changes) below.

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
6. **[docs/implementation/MIGRATION_STATUS.md](./docs/implementation/MIGRATION_STATUS.md)** - Applied migrations

### Database & Data Persistence

7. **[core-monolith/docs/database/DATA_PERSISTENCE_ANALYSIS.md](./kenya-tnt-system/core-monolith/docs/database/DATA_PERSISTENCE_ANALYSIS.md)** - Complete data flow analysis
8. **[core-monolith/docs/database/PARTIES_OBJECT_PERSISTENCE_AUDIT.md](./kenya-tnt-system/core-monolith/docs/database/PARTIES_OBJECT_PERSISTENCE_AUDIT.md)** - Parties JSON → Database mapping
9. **[core-monolith/docs/database/DATABASE_NAMING_AUDIT.md](./kenya-tnt-system/core-monolith/docs/database/DATABASE_NAMING_AUDIT.md)** - Naming conventions audit
10. **[core-monolith/docs/database/FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md](./kenya-tnt-system/core-monolith/docs/database/FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md)** - ⭐ Database naming standard

### Testing

11. **[test-data/README_TEST_DATA.md](./test-data/README_TEST_DATA.md)** - Which test files to use
12. **[docs/testing/TEST_ILMD_IMPLEMENTATION.md](./docs/testing/TEST_ILMD_IMPLEMENTATION.md)** - ILMD testing guide

### Master Data & Data Quality

**⚡ Quick Access**: See [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) for complete quality documentation navigation

13. **[DATA_QUALITY_README.md](./DATA_QUALITY_README.md)** - **START HERE** - Quick start guide for data quality
14. **[DATA_QUALITY_EXECUTIVE_SUMMARY.md](./DATA_QUALITY_EXECUTIVE_SUMMARY.md)** - Executive overview comparing premise vs product quality
15. **[master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md)** - 📦 **MASTER DATA MODULE** - Complete technical documentation
16. **[master-data/docs/QUALITY_PARAMETERS.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/QUALITY_PARAMETERS.md)** - Detailed calculation logic

### Planning & Standards

17. **[docs/planning/full-rearch-plan.md](./docs/planning/full-rearch-plan.md)** - Architecture planning
18. **[docs/planning/epcis-hardening-plan.md](./docs/planning/epcis-hardening-plan.md)** - EPCIS hardening roadmap
19. **[core-monolith/docs/CODING_STANDARDS_README.md](./kenya-tnt-system/core-monolith/docs/CODING_STANDARDS_README.md)** - Coding standards
20. **[core-monolith/docs/LOGGING_EXAMPLES.md](./kenya-tnt-system/core-monolith/docs/LOGGING_EXAMPLES.md)** - Logging best practices

### Deployment & Infrastructure

21. **[COMPANY_DEPLOYMENT_GUIDE.md](./COMPANY_DEPLOYMENT_GUIDE.md)** - ⭐ **COMPANY SERVERS** - VPN, PEM keys, staging/production deployment
22. **[TRANSFORM_ANY_PROJECT.md](./TRANSFORM_ANY_PROJECT.md)** - Apply pro workflow to any project
23. **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** - Development workflow guide
24. **[NFR_MATRIX.md](./NFR_MATRIX.md)** - Non-functional requirements by environment

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
├── DATA_QUALITY_INDEX.md                        ← Quality documentation index
├── DATA_QUALITY_README.md                       ← Quick start guide
├── DATA_QUALITY_EXECUTIVE_SUMMARY.md            ← Executive summary
├── DEVELOPMENT_WORKFLOW.md                      ← Development workflow
├── IMPLEMENTATION_STATUS_CONSOLIDATED.md        ← Current implementation status
│
├── docs/
│   ├── planning/                                ← Architecture & planning docs
│   │   ├── full-rearch-plan.md                 ← Architecture planning
│   │   └── epcis-hardening-plan.md             ← EPCIS hardening
│   ├── data-model/                              ← Database schema documentation
│   ├── implementation/                          ← Implementation guides
│   ├── testing/                                 ← Test guides
│   └── archive/                                 ← 43 historical documents
│       ├── 2025-12/                             ← December 2025 (38 files)
│       └── *.md                                 ← Earlier archives (5 files)
│
├── test-data/                                   ← Test JSON files
│   ├── README_TEST_DATA.md                     ← Which files to use
│   └── TEST_QUICK_DEMO.json                    ← CURRENT test file
│
└── kenya-tnt-system/
    ├── core-monolith/
    │   ├── docs/
    │   │   ├── database/                        ← 📁 **NEW** Database docs here!
    │   │   │   ├── DATA_PERSISTENCE_ANALYSIS.md
    │   │   │   ├── PARTIES_OBJECT_PERSISTENCE_AUDIT.md
    │   │   │   ├── DATABASE_NAMING_AUDIT.md
    │   │   │   ├── FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md
    │   │   │   ├── TYPEORM_SNAKE_CASE_MIGRATION_PLAN_COMPREHENSIVE.md
    │   │   │   └── POSTGIS_LOCATION_ANALYSIS.md
    │   │   │
    │   │   ├── deployment/                      ← 📁 Deployment guides
    │   │   │   ├── Docker best practices.md    ← **NEW** Moved here
    │   │   │   ├── ORACLE_CLOUD_DEPLOYMENT.md
    │   │   │   ├── QUICK_DEPLOY.md
    │   │   │   └── ...
    │   │   │
    │   │   ├── testing/                         ← Testing documentation
    │   │   ├── CODING_STANDARDS_README.md       ← **NEW** Moved here
    │   │   ├── LOGGING_EXAMPLES.md              ← **NEW** Moved here
    │   │   ├── LEVEL_5_FEATURES_GUIDE.md
    │   │   └── AUTOMATED_SYNC_SETUP_GUIDE.md
    │   │
    │   └── src/modules/
    │       ├── shared/
    │       │   ├── master-data/                 ← 📦 See DATA_QUALITY_INDEX.md
    │       │   │   ├── README.md
    │       │   │   └── docs/                    ← 📁 **ENHANCED** Quality docs here!
    │       │   │       ├── QUALITY_PARAMETERS.md  ← **NEW** Calculation logic
    │       │   │       ├── ENRICHMENT_GUIDE.md    ← **NEW** Visual comparison
    │       │   │       ├── ARCHITECTURE.md
    │       │   │       ├── SYNC_SYSTEM.md
    │       │   │       ├── ALERT_SYSTEM.md
    │       │   │       ├── entities/
    │       │   │       │   ├── products/QUALITY_REPORT.md
    │       │   │       │   ├── premises/QUALITY_REPORT.md
    │       │   │       │   └── facilities/QUALITY_REPORT_UAT.md
    │       │   │       └── ...
    │       │   │
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
    │       │   └── ppb-batches/docs/
    │       │
    │       └── integration/
    │           └── facility/
    │               ├── README.md
    │               └── docs/
    │
    └── frontend/
        └── docs/                                ← Frontend documentation
```

---

## 📋 Quick Reference

**Need data quality documentation?** → [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) 🔍  
**Need to understand master data system?** → [master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md)  
**Need quality calculation logic?** → [master-data/docs/QUALITY_PARAMETERS.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/QUALITY_PARAMETERS.md)  
**Need database docs?** → [core-monolith/docs/database/](./kenya-tnt-system/core-monolith/docs/database/)  
**Need database naming standards?** → [FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md](./kenya-tnt-system/core-monolith/docs/database/FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md)  
**Need data persistence details?** → [DATA_PERSISTENCE_ANALYSIS.md](./kenya-tnt-system/core-monolith/docs/database/DATA_PERSISTENCE_ANALYSIS.md)  
**Need deployment guides?** → [COMPANY_DEPLOYMENT_GUIDE.md](./COMPANY_DEPLOYMENT_GUIDE.md) ⭐ **START HERE FOR DEPLOYMENT**  
**Need to deploy to company servers?** → [COMPANY_DEPLOYMENT_GUIDE.md](./COMPANY_DEPLOYMENT_GUIDE.md) (VPN + PEM keys)  
**Need to transform another project?** → [TRANSFORM_ANY_PROJECT.md](./TRANSFORM_ANY_PROJECT.md)  
**Need coding standards?** → [CODING_STANDARDS_README.md](./kenya-tnt-system/core-monolith/docs/CODING_STANDARDS_README.md)  
**Need database schema?** → [docs/data-model/DATABASE_SCHEMA_LATEST.md](./docs/data-model/DATABASE_SCHEMA_LATEST.md)  
**Need migration history?** → [docs/implementation/MIGRATION_STATUS.md](./docs/implementation/MIGRATION_STATUS.md)  
**Need module documentation?** → See "Module Documentation" section above  
**Confused by old docs?** → Check docs/archive/ (43 files, historical only)

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

**Implementation Status:**
- **IMPLEMENTATION_STATUS_CONSOLIDATED.md (Dec 14, 2025) ← CURRENT STATUS**
- **core-monolith/docs/LEVEL_5_FEATURES_GUIDE.md (Dec 17, 2025) ← LEVEL 5 FEATURES**

**Database & Data Persistence (Dec 18, 2025 - MOVED TO core-monolith/docs/database/):**
- **core-monolith/docs/database/FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md** ← Database naming standard
- core-monolith/docs/database/DATA_PERSISTENCE_ANALYSIS.md (Dec 11, 2025)
- core-monolith/docs/database/PARTIES_OBJECT_PERSISTENCE_AUDIT.md (Dec 11, 2025)
- core-monolith/docs/database/DATABASE_NAMING_AUDIT.md
- core-monolith/docs/database/TYPEORM_SNAKE_CASE_MIGRATION_PLAN_COMPREHENSIVE.md
- docs/data-model/DATABASE_SCHEMA_LATEST.md

**Master Data & Data Quality (Dec 18, 2025 - ENHANCED):**
- **[DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) (Dec 17, 2025) ← 🔍 SEARCH HERE FOR ALL QUALITY DOCS**
- **DATA_QUALITY_EXECUTIVE_SUMMARY.md (Dec 14, 2025) ← START HERE FOR EXECUTIVES**
- DATA_QUALITY_README.md (Dec 14, 2025) ← Quick start
- **[master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md) (Dec 17, 2025) ← COMPLETE TECHNICAL DOCS**
- **master-data/docs/QUALITY_PARAMETERS.md (Dec 18, 2025) ← CALCULATION LOGIC** ✨ NEW LOCATION
- **master-data/docs/ENRICHMENT_GUIDE.md (Dec 18, 2025) ← VISUAL COMPARISON** ✨ NEW LOCATION
- master-data/docs/ARCHITECTURE.md - System architecture
- master-data/docs/SYNC_SYSTEM.md - Sync logging
- master-data/docs/ALERT_SYSTEM.md - Automated alerts
- master-data/docs/SCHEDULING.md - Cron setup
- master-data/docs/entities/products/QUALITY_REPORT.md - Product quality
- master-data/docs/entities/premises/QUALITY_REPORT.md - Premise quality
- master-data/docs/entities/facilities/QUALITY_REPORT_UAT.md - Facility quality

**Planning & Architecture (Dec 18, 2025 - MOVED TO docs/planning/):**
- docs/planning/full-rearch-plan.md (Dec 2025) - Original architecture plan
- docs/planning/epcis-hardening-plan.md (Dec 2025) - EPCIS hardening
- core-monolith/docs/FEATURE_GAP_ANALYSIS.md (Dec 2025) - Tatmeen Level 5 comparison

**Coding Standards (Dec 18, 2025 - MOVED TO core-monolith/docs/):**
- core-monolith/docs/CODING_STANDARDS_README.md ✨ NEW LOCATION
- core-monolith/docs/LOGGING_EXAMPLES.md ✨ NEW LOCATION

**Module Documentation (Dec 17, 2025 - NEAR CODE):**
- manufacturer/README.md - Manufacturer module
- regulator/README.md - PPB regulator module
- integration/facility/README.md - FLMIS integration
- hierarchy/README.md - Packaging hierarchy
- epcis-backfill/README.md - EPCIS backfill
- barcode-scanner/README.md - Scanner integration

**Deployment (Dec 22, 2025 - COMPANY SERVERS):**
- **COMPANY_DEPLOYMENT_GUIDE.md (Dec 22, 2025) ← 🏢 COMPANY SERVER DEPLOYMENT (VPN + PEM)** ✨ NEW
- **TRANSFORM_ANY_PROJECT.md (Dec 22, 2025) ← UPDATED FOR COMPANY SERVERS** ✨ UPDATED
- DEVELOPMENT_WORKFLOW.md - Development workflow
- NFR_MATRIX.md - Non-functional requirements
- core-monolith/docs/deployment/Docker best practices.md
- core-monolith/docs/deployment/ORACLE_CLOUD_DEPLOYMENT.md
- core-monolith/docs/deployment/DOCKER_WORKFLOW_README.md
- core-monolith/docs/deployment/QUICK_DEPLOY.md

**Testing:**
- test-data/TEST_QUICK_DEMO.json (CURRENT)
- core-monolith/docs/testing/ - Testing documentation

**Archived**: docs/archive/ (43 historical files - don't use!)

---

## 🔄 Recent Changes

### December 22, 2025 - Company Server Deployment Documentation 🏢
- ✅ **Created COMPANY_DEPLOYMENT_GUIDE.md** - Complete guide for company server deployment
  - VPN setup (UHC Cloud VPN required)
  - PEM private key management and security
  - Staging server specs (tnt-staging.apeiro-digital.com, 64GB RAM, 16 cores)
  - GitHub Actions CI/CD with VPN connectivity
  - Manual deployment scripts
  - Troubleshooting guide
- ✅ **Updated TRANSFORM_ANY_PROJECT.md** - Migrated from DigitalOcean to company servers
  - Updated GitHub Secrets examples for company infrastructure
  - Added VPN connection requirements
  - Added PEM file secure sharing guide
  - Updated server specifications
- ✅ **Updated DOCUMENTATION_INDEX.md** - Added deployment documentation section

**Key Changes:**
- 🏢 Deployment strategy changed: DigitalOcean → Company Servers (UHC Cloud)
- 🔐 VPN required for all server access (staging + production)
- 🔑 PEM private key authentication (tnt-staging.pem)
- 🌐 Staging server: tnt-staging.apeiro-digital.com (10.10.101.181)

### December 18, 2025 - Phase 2: Documentation Cleanup & Consolidation ✨
- ✅ **Moved database docs** → `core-monolith/docs/database/` (5 files)
  - DATA_PERSISTENCE_ANALYSIS.md, PARTIES_OBJECT_PERSISTENCE_AUDIT.md
  - DATABASE_NAMING_AUDIT.md, FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md
  - TYPEORM_SNAKE_CASE_MIGRATION_PLAN_COMPREHENSIVE.md
- ✅ **Moved data quality calculation docs** → `master-data/docs/` (2 files)
  - DATA_QUALITY_PARAMETERS_CALCULATION_LOGIC.md → QUALITY_PARAMETERS.md
  - QUALITY_AUDIT_ENRICHMENT_VISUAL_COMPARISON.md → ENRICHMENT_GUIDE.md
- ✅ **Moved planning docs** → `docs/planning/` (2 files)
  - full-rearch-plan.md, epcis-hardening-plan.md
- ✅ **Moved coding standards** → `core-monolith/docs/` (2 files)
  - CODING_STANDARDS_README.md, LOGGING_EXAMPLES.md
- ✅ **Moved deployment docs** → `core-monolith/docs/deployment/` (1 file)
  - Docker best practices.md
- ✅ **Archived redundant summaries** → `docs/archive/2025-12/` (7 files)
  - IMPLEMENTATION_COMPLETE.md, REORGANIZATION_SUMMARY.md, etc.
- ✅ **Deleted 60 obsolete archive files** (103 → 43 files, 58% reduction)
  - Removed redundant *_FIXED.md, *_COMPLETE.md, *_SUMMARY.md, etc.

**Key Wins:**
- 📁 All database docs now in one place: `core-monolith/docs/database/`
- 📊 All quality calculation logic now near code: `master-data/docs/`
- 🗑️ 67 files removed/consolidated (18 moved + 7 archived + 60 deleted)
- 🎯 Root directory cleaned: 27 → 10 .md files (63% reduction)

### December 17, 2025 - Phase 1: Documentation Reorganization
- ✅ Moved 60+ documentation files closer to the code they document
- ✅ Created module READMEs for all major modules
- ✅ Master data documentation now in `master-data/docs/`
- ✅ Entity-specific docs in `master-data/docs/entities/`
- ✅ Deployment docs in `core-monolith/docs/deployment/`
- ✅ Created [DATA_QUALITY_INDEX.md](./DATA_QUALITY_INDEX.md) for easy searching

**Benefit**: Documentation is now easier to find, maintain, and keep in sync with code changes!

---

**Maintained By**: Development Team  
**Review Frequency**: After each major change  
**Last Major Reorganization**: December 18, 2025 (Phase 2: Cleanup & Consolidation)
