# 📚 Documentation Index - Single Source of Truth

**Last Updated**: December 14, 2025  
**Purpose**: Navigate to the LATEST and CURRENT documentation only

---

## 🎯 START HERE - Current Documentation

### Architecture & Design
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (CURRENT)
2. **[docs/data-model/DATABASE_SCHEMA_LATEST.md](./docs/data-model/DATABASE_SCHEMA_LATEST.md)** - Complete database schema after V02-V05

### Implementation Status
3. **[README_IMPLEMENTATION_STATUS.md](./README_IMPLEMENTATION_STATUS.md)** - What's implemented NOW
4. **[docs/implementation/MIGRATION_STATUS.md](./docs/implementation/MIGRATION_STATUS.md)** - Applied migrations

### Data Persistence
5. **[DATA_PERSISTENCE_ANALYSIS.md](./DATA_PERSISTENCE_ANALYSIS.md)** - Complete analysis (CONSOLIDATED)
6. **[PARTIES_OBJECT_PERSISTENCE_AUDIT.md](./PARTIES_OBJECT_PERSISTENCE_AUDIT.md)** - Parties JSON → Database mapping

### Testing
7. **[test-data/README_TEST_DATA.md](./test-data/README_TEST_DATA.md)** - Which test files to use
8. **[docs/testing/TEST_ILMD_IMPLEMENTATION.md](./docs/testing/TEST_ILMD_IMPLEMENTATION.md)** - ILMD testing guide

### Master Data & Data Quality
9. **[DATA_QUALITY_README.md](./DATA_QUALITY_README.md)** - **START HERE** - Quick start guide for data quality
10. **[DATA_QUALITY_EXECUTIVE_SUMMARY.md](./DATA_QUALITY_EXECUTIVE_SUMMARY.md)** - Executive overview comparing premise vs product quality
11. **[DATA_QUALITY_REPORT_PREMISE_MASTER_DATA.md](./DATA_QUALITY_REPORT_PREMISE_MASTER_DATA.md)** - Detailed premise data quality analysis
12. **[DATA_QUALITY_REPORT_PRODUCT_MASTER_DATA.md](./DATA_QUALITY_REPORT_PRODUCT_MASTER_DATA.md)** - Detailed product data quality analysis
13. **[DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md](./DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md)** - Detailed facility UAT data quality analysis
14. **[kenya-tnt-system/AUTOMATED_SYNC_SETUP_GUIDE.md](./kenya-tnt-system/AUTOMATED_SYNC_SETUP_GUIDE.md)** - Cron setup for automated 3-hour syncs
15. **[kenya-tnt-system/PREMISE_MASTER_DATA.md](./kenya-tnt-system/PREMISE_MASTER_DATA.md)** - Premise sync setup & usage
16. **[kenya-tnt-system/REAL_TIME_PREMISE_SYNC.md](./kenya-tnt-system/REAL_TIME_PREMISE_SYNC.md)** - Sync strategies (batch/incremental/webhook)
17. **[kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md](./kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md)** - Facility UAT sync setup & usage (Safaricom HIE)
18. **[kenya-tnt-system/REAL_TIME_FACILITY_UAT_SYNC.md](./kenya-tnt-system/REAL_TIME_FACILITY_UAT_SYNC.md)** - Facility sync strategies (incremental/webhook)

---

## ⚠️ DEPRECATED - Do NOT Use

All files in `docs/archive/` are outdated and kept for historical reference only.

---

## 🗂️ Documentation Structure

```
/
├── README.md                          ← Main project README
├── ARCHITECTURE.md                    ← System architecture (LATEST)
├── DOCUMENTATION_INDEX.md             ← THIS FILE (Start here!)
├── DATA_PERSISTENCE_ANALYSIS.md       ← Data flow analysis (LATEST)
├── README_IMPLEMENTATION_STATUS.md    ← Current implementation status
│
├── docs/
│   ├── architecture/                  ← Architecture decisions
│   ├── data-model/                    ← Database schema documentation
│   ├── implementation/                ← Implementation guides
│   ├── testing/                       ← Test guides
│   └── archive/                       ← OLD files (deprecated)
│
├── test-data/                         ← Test JSON files
│   ├── README_TEST_DATA.md           ← Which files to use
│   ├── TEST_QUICK_DEMO.json          ← CURRENT test file
│   └── archive/                       ← Old test files
│
└── kenya-tnt-system/                  ← Application code
    └── database/migrations/           ← Migration files (versioned)
```

---

## 📋 Quick Reference

**Need to understand data persistence?** → DATA_PERSISTENCE_ANALYSIS.md  
**Need to test ILMD?** → docs/testing/TEST_ILMD_IMPLEMENTATION.md  
**Need database schema?** → docs/data-model/DATABASE_SCHEMA_LATEST.md  
**Need migration history?** → docs/implementation/MIGRATION_STATUS.md  
**Need premise master data?** → kenya-tnt-system/PREMISE_MASTER_DATA.md  
**Need facility UAT master data?** → kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md  
**Need data quality reports?** → DATA_QUALITY_REPORT_*_MASTER_DATA.md  
**Confused by old docs?** → Check docs/archive/ (don't use them!)

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

**Implementation:**
- README_IMPLEMENTATION_STATUS.md (Dec 11, 2025)

**Master Data & Data Quality:**
- **DATA_QUALITY_EXECUTIVE_SUMMARY.md (Dec 14, 2025) ← START HERE FOR DATA QUALITY**
- kenya-tnt-system/PREMISE_MASTER_DATA.md (Dec 12, 2025)
- kenya-tnt-system/REAL_TIME_PREMISE_SYNC.md (Dec 12, 2025)
- kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md (Dec 14, 2025)
- kenya-tnt-system/REAL_TIME_FACILITY_UAT_SYNC.md (Dec 14, 2025)
- DATA_QUALITY_REPORT_PREMISE_MASTER_DATA.md (Dec 14, 2025)
- DATA_QUALITY_REPORT_PRODUCT_MASTER_DATA.md (Dec 14, 2025)
- DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md (Dec 14, 2025)

**Testing:**
- test-data/TEST_QUICK_DEMO.json (CURRENT)

**Everything Else**: Check docs/archive/ (outdated)

---

**Maintained By**: Development Team  
**Review Frequency**: After each major change
