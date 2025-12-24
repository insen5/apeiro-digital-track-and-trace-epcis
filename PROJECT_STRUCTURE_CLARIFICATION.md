# Project Structure Clarification

**Date**: December 19, 2025  
**Purpose**: Explain the relationship between root files and submodule files

---

## 🗂️ Your Project Structure

```
apeiro-digital-track-and-trace-epcis/         (ROOT - Umbrella repository)
│
├── .cursorrules                              ← MASTER rules for ALL submodules
├── NFR_MATRIX.md                             ← Kenya TNT specific (legacy, can remove)
├── ARCHITECTURE.md                           ← Overall system architecture
├── DOCUMENTATION_INDEX.md                    ← Documentation map
│
├── kenya-tnt-system/                         ← GIT SUBMODULE (has own git repo)
│   ├── .github/workflows/                    ← CI/CD (NEW)
│   ├── docker-compose.*.yml                  ← Environment configs
│   ├── NFR_MATRIX.md                         ← Kenya TNT NFRs (canonical version)
│   ├── BEST_PRACTICES_APPLIED.md             ← This summary
│   ├── core-monolith/                        ← Backend code
│   └── frontend/                             ← Frontend code
│
├── epcis-service/                            ← GIT SUBMODULE (external project)
│   └── (OpenEPCIS - don't modify)
│
└── medic-scan-fetch/                         ← GIT SUBMODULE (separate app)
    └── (Optional - apply template if developing)
```

---

## 🎯 Which Files Go Where?

### Root Level (apeiro-digital-track-and-trace-epcis/)

**Purpose**: Umbrella repository for coordinating all Track & Trace projects

**Files**:
- `.cursorrules` - **MASTER** rules that apply to ALL submodules ✅
- `ARCHITECTURE.md` - Overall system architecture
- `DOCUMENTATION_INDEX.md` - Central documentation map
- `NFR_MATRIX.md` - ⚠️ **LEGACY** - Should be removed (duplicate of kenya-tnt-system/NFR_MATRIX.md)

**Docker Compose** (Optional):
You could create orchestration files here to start all submodules together:
```bash
# Example: Root-level orchestration
docker-compose.all.yml  # Starts all 3 submodules in one command
```

### kenya-tnt-system/ (Submodule)

**Purpose**: Main Track & Trace application (has its own git repository)

**Files**:
- `.github/workflows/` - CI/CD pipelines (NEW) ✅
- `docker-compose.dev.yml` - Development environment ✅
- `docker-compose.staging.yml` - Staging environment (NEW) ✅
- `docker-compose.production.yml` - Production environment ✅
- `NFR_MATRIX.md` - Kenya TNT NFRs (NEW, canonical version) ✅
- `BEST_PRACTICES_APPLIED.md` - Summary of changes (NEW) ✅
- `env.staging.template` - Staging env template (NEW) ✅

**Optional**: `.cursorrules` - Only if you need to override/extend root rules

---

## 🔄 Why the Apparent Duplication?

### .cursorrules

**Root `.cursorrules`**:
- **Purpose**: Master rules for ENTIRE workspace
- **Applies to**: All submodules (kenya-tnt-system, epcis-service, medic-scan-fetch)
- **Contains**: Generic rules (naming, standards, best practices)

**Submodule `.cursorrules`** (optional):
- **Purpose**: Project-specific overrides/extensions
- **Applies to**: Only that submodule
- **Contains**: Project-specific rules (e.g., Kenya TNT specific imports)

**Example**:
```
Root .cursorrules:
  "Use snake_case for database columns"
  
kenya-tnt-system/.cursorrules (if you create it):
  "Always import from @modules/shared/master-data for facilities"
```

### NFR_MATRIX.md

**Root `NFR_MATRIX.md`**:
- ⚠️ **LEGACY** - Created before submodule structure was clear
- **Action**: Should be deleted (duplicate)

**kenya-tnt-system/NFR_MATRIX.md** (NEW):
- ✅ **CANONICAL** version
- **Purpose**: Kenya TNT specific NFRs
- **Contains**: Performance targets, security, testing requirements

**Recommendation**: Delete `NFR_MATRIX.md` from root.

### Dockerfiles

**Root level**: No Dockerfiles ❌ (umbrella repo doesn't run services)

**kenya-tnt-system/**:
- `core-monolith/Dockerfile` - Backend image ✅
- `frontend/Dockerfile` - Frontend image ✅

**Reason**: Each submodule has its own Dockerfiles because they're separate applications.

---

## ✅ Cleanup Recommendations

### 1. Delete Root NFR_MATRIX.md (Duplicate)

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis
git rm NFR_MATRIX.md
git commit -m "Remove duplicate NFR_MATRIX.md (canonical version in kenya-tnt-system/)"
```

### 2. Keep Root .cursorrules

✅ This is correct - it applies to all submodules.

### 3. Optional: Create Root Orchestration

If you want to start all submodules together from root:

```bash
# docker-compose.all.yml (in root)
version: '3.8'

services:
  # Start all Kenya TNT services
  kenya-tnt:
    extends:
      file: ./kenya-tnt-system/docker-compose.production.yml
      service: backend
  
  # Add medic-scan-fetch services if needed
  # medic-scan:
  #   extends:
  #     file: ./medic-scan-fetch/docker-compose.yml
  #     service: app
```

But this is **optional** - current structure works fine! ✅

---

## 🎯 Final Structure (After Cleanup)

```
apeiro-digital-track-and-trace-epcis/
│
├── .cursorrules                      ← Master rules (applies to all) ✅
├── ARCHITECTURE.md                   ← System architecture ✅
├── DOCUMENTATION_INDEX.md            ← Docs map ✅
├── NFR_MATRIX.md                     ← ❌ DELETE (duplicate)
│
├── kenya-tnt-system/                 ← Submodule
│   ├── .github/workflows/            ← CI/CD ✅
│   ├── docker-compose.*.yml          ← Env configs ✅
│   ├── NFR_MATRIX.md                 ← Canonical NFRs ✅
│   ├── core-monolith/Dockerfile      ← Backend image ✅
│   └── frontend/Dockerfile           ← Frontend image ✅
│
├── epcis-service/                    ← External (don't touch)
└── medic-scan-fetch/                 ← Separate app
```

---

## 📚 Quick Reference

| File Type           | Root Level           | kenya-tnt-system/    | Why                                    |
|---------------------|----------------------|----------------------|----------------------------------------|
| `.cursorrules`      | ✅ YES (master)      | ⚠️ Optional (override) | Master rules apply to all submodules |
| `NFR_MATRIX.md`     | ❌ DELETE (duplicate) | ✅ YES (canonical)    | Each submodule has its own NFRs       |
| `Dockerfile`        | ❌ NO                | ✅ YES               | Each app has its own image            |
| `docker-compose.yml`| ⚠️ Optional (orchestrate) | ✅ YES          | Submodule controls its services       |
| `ARCHITECTURE.md`   | ✅ YES (system-wide) | ⚠️ Optional (app-specific) | Root has overall architecture   |

---

**TL;DR**: 
- Root `.cursorrules` = Master rules for ALL ✅
- Root `NFR_MATRIX.md` = DELETE (duplicate) ❌
- Submodule files = Specific to that application ✅


