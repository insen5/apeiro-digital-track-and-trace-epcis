# Best Practices Applied to Kenya TNT System

**Date**: December 19, 2025  
**Applied From**: [project-template-standard](https://github.com/insen5/project-template-standard)

---

## ✅ What Was Applied

### 1. CI/CD Workflows (GitHub Actions)

**Location**: `.github/workflows/`

Created three environment-specific workflows:

- **`ci-dev.yml`** - Fast checks for `develop` branch
  - Lint + type check (backend & frontend)
  - Unit tests only
  - Docker build test
  - **No coverage requirement**

- **`ci-staging.yml`** - Thorough checks for `staging` branch
  - Full test suite with **70% coverage requirement**
  - Integration tests
  - Security scan (npm audit, Trivy)
  - Load test (100 concurrent users)

- **`ci-production.yml`** - Strictest checks for `main` branch
  - Full test suite with **80% coverage requirement**
  - E2E tests
  - Security scan (strict)
  - Load test (1000 concurrent users)
  - **Manual approval gate** before deployment

### 2. Environment Configuration

**New Files**:
- `docker-compose.staging.yml` - Staging-specific config
- `env.staging.template` - Staging environment variables template

**Existing** (already good):
- ✅ `docker-compose.dev.yml` - Development config
- ✅ `docker-compose.production.yml` - Production config
- ✅ `env.production.template` - Production template

### 3. NFR Matrix

**Location**: `NFR_MATRIX.md`

Created comprehensive NFR matrix with:
- Performance targets (Dev, Staging, Prod)
- Security requirements
- Testing requirements (70% staging, 80% prod)
- Monitoring & alerting thresholds
- Backup & disaster recovery plans
- Scalability requirements
- Logging standards
- Compliance checklist

### 4. Template Repository

**Completed**: Moved to [https://github.com/insen5/project-template-standard](https://github.com/insen5/project-template-standard)

Deleted local copy from this project ✅

---

## 📋 How This Project is Structured

```
apeiro-digital-track-and-trace-epcis/  (ROOT - Umbrella repo)
│
├── .cursorrules                       ← Master rules (applies to all submodules)
├── NFR_MATRIX.md                      ← Kenya TNT specific NFRs
│
├── kenya-tnt-system/                  ← GIT SUBMODULE (main application)
│   ├── .github/workflows/             ← ✅ NEW: CI/CD pipelines
│   │   ├── ci-dev.yml
│   │   ├── ci-staging.yml
│   │   └── ci-production.yml
│   ├── docker-compose.dev.yml         ← Development environment
│   ├── docker-compose.staging.yml     ← ✅ NEW: Staging environment
│   ├── docker-compose.production.yml  ← Production environment
│   ├── env.staging.template           ← ✅ NEW: Staging env template
│   ├── NFR_MATRIX.md                  ← ✅ NEW: Kenya TNT NFRs
│   ├── core-monolith/                 ← Backend (NestJS)
│   │   └── Dockerfile                 ← Multi-stage (already exists)
│   └── frontend/                      ← Frontend (Next.js)
│       └── Dockerfile                 ← Multi-stage (already exists)
│
├── epcis-service/                     ← GIT SUBMODULE (External - OpenEPCIS)
│   └── (Don't modify - external project)
│
└── medic-scan-fetch/                  ← GIT SUBMODULE (Separate app)
    └── (Optional - apply template if actively developing)
```

---

## 🎯 Environment Progression

```
┌─────────────────────────────────────────────────────────────┐
│  develop branch → docker-compose.dev.yml                    │
│  ├─ Fast checks (lint, type, unit tests)                   │
│  ├─ No coverage requirement                                 │
│  └─ Auto-deploy on push                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓ (manual merge after testing)
┌─────────────────────────────────────────────────────────────┐
│  staging branch → docker-compose.staging.yml                │
│  ├─ Full tests (70% coverage)                               │
│  ├─ Integration tests + E2E                                 │
│  ├─ Security scan + Load test (100 users)                   │
│  └─ Auto-deploy after tests pass                            │
└─────────────────────────────────────────────────────────────┘
                              ↓ (manual merge + approval)
┌─────────────────────────────────────────────────────────────┐
│  main branch → docker-compose.production.yml                │
│  ├─ Strictest tests (80% coverage)                          │
│  ├─ Full E2E + Load test (1000 users)                       │
│  ├─ Security audit                                           │
│  ├─ ⚠️  MANUAL APPROVAL REQUIRED                            │
│  └─ Deploy to production server                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Development

```bash
cd kenya-tnt-system

# Copy and configure environment
cp env.production.template .env.development
vim .env.development  # Fill in values

# Start development environment
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d

# View logs
docker compose logs -f backend frontend
```

### Staging

```bash
cd kenya-tnt-system

# Copy and configure environment
cp env.staging.template .env.staging
vim .env.staging  # Fill in actual staging values

# Start staging environment
docker compose -f docker-compose.production.yml -f docker-compose.staging.yml up -d
```

### Production

```bash
cd kenya-tnt-system

# Use existing production config
docker compose -f docker-compose.production.yml up -d
```

---

## 📝 Next Steps

### 1. Configure GitHub Secrets

For CI/CD to work, add these secrets to GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

```
STAGING_API_URL          # e.g., http://staging-api.example.com/api
PRODUCTION_API_URL       # e.g., https://api.example.com/api
DOCKER_USERNAME          # If pushing to Docker Hub
DOCKER_PASSWORD          # Docker Hub token
SNYK_TOKEN              # For security scanning (optional)
```

### 2. Create GitHub Environments

**Settings → Environments → New environment**

Create `production` environment and enable:
- ✅ Required reviewers (add yourself or team)
- ✅ Wait timer (optional, e.g., 10 minutes)

This enables the manual approval gate before production deployment.

### 3. Configure Branch Protection

**Settings → Branches → Add branch protection rule**

For `staging` and `main` branches:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass (select CI workflows)
- ✅ Require branches to be up to date
- ✅ Do not allow force pushes

### 4. Update Package.json Scripts

Ensure these scripts exist in `core-monolith/package.json`:

```json
{
  "scripts": {
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

And in `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint": "next lint"
  }
}
```

### 5. Test CI/CD Locally

Before pushing to GitHub:

```bash
# Test backend build
cd kenya-tnt-system/core-monolith
npm ci
npm run lint
npm run build
npm test

# Test frontend build
cd ../frontend
npm ci
npm run lint
npm run build

# Test Docker builds
cd ..
docker build -t kenya-tnt-backend:test ./core-monolith
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api -t kenya-tnt-frontend:test ./frontend
```

---

## 🔍 How Cursor AI Rules Work

```
┌─────────────────────────────────────────────┐
│  Open: apeiro-digital-track-and-trace-epcis/ │
│  (Umbrella repo)                            │
│                                              │
│  Cursor reads: Root .cursorrules             │
│  ├─ Database naming standards                │
│  ├─ Documentation index                      │
│  ├─ GS1 & EPCIS standards                    │
│  ├─ Technology stack                         │
│  └─ Master data quality system               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Work in: kenya-tnt-system/                 │
│  (Submodule)                                │
│                                              │
│  Cursor still uses: Root .cursorrules ✅     │
│  (Applied to all submodules)                │
│                                              │
│  Optional: Add kenya-tnt-system/.cursorrules │
│  to override/extend root rules              │
└─────────────────────────────────────────────┘
```

**Your current setup is already correct!** ✅

The root `.cursorrules` applies to all submodules by default.

---

## 📚 Reference

- **Template Repo**: https://github.com/insen5/project-template-standard
- **Kenya TNT Root Rules**: `.cursorrules` (in root)
- **Kenya TNT NFRs**: `kenya-tnt-system/NFR_MATRIX.md`
- **Architecture**: `ARCHITECTURE.md` (in root)
- **Documentation Index**: `DOCUMENTATION_INDEX.md` (in root)

---

## ✅ Summary

**What Changed**:
1. ✅ Added CI/CD workflows (GitHub Actions)
2. ✅ Created `docker-compose.staging.yml`
3. ✅ Created `env.staging.template`
4. ✅ Created comprehensive `NFR_MATRIX.md`
5. ✅ Deleted local `project-template-standard/` (moved to GitHub)

**What Stayed the Same**:
- ✅ Existing Dockerfiles (already multi-stage)
- ✅ Existing docker-compose files (dev, production)
- ✅ Root `.cursorrules` (applies to all submodules)
- ✅ Submodule structure (epcis-service, medic-scan-fetch)

**Ready to Use**:
- Environment progression: dev → staging → prod ✅
- CI/CD pipelines: lint → test → security → deploy ✅
- NFR matrix: performance, security, testing thresholds ✅
- Template for future projects: [GitHub](https://github.com/insen5/project-template-standard) ✅

---

**All best practices from the template have been applied to `kenya-tnt-system`!** 🎉


