# Development Workflow - Kenya TNT System

**Last Updated**: December 19, 2025  
**Status**: ACTIVE - New discipline starting today!

---

## 🎯 Purpose

This document defines the development workflow for Kenya TNT System, transitioning from "commit to main" to proper branch discipline with automated testing and deployment.

---

## 📊 Branch Structure

```
develop  ← Daily work (auto-deploy to dev)
   ↓
staging  ← QA testing (70% coverage, auto-deploy)
   ↓
main     ← Production (80% coverage, manual approval)
```

### Branch Policies

| Branch    | Purpose              | CI Requirements                          | Deployment        | Approval Required |
|-----------|----------------------|------------------------------------------|-------------------|-------------------|
| `develop` | Daily development    | Lint, type check, unit tests             | Local/Dev server  | ❌ No             |
| `staging` | QA & Integration     | Full tests (70%), integration, security  | Staging server    | ❌ No             |
| `main`    | Production           | Strictest (80%), E2E, load test          | Production server | ✅ YES            |

---

## 🔄 Daily Workflow

### 1. Start Your Day

```bash
# Ensure you're on develop
cd kenya-tnt-system
git checkout develop
git pull origin develop

# Start local development environment
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d

# View logs
docker compose logs -f backend frontend
```

### 2. Work on Feature

```bash
# Option A: Work directly on develop (small changes)
git checkout develop
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push origin develop

# Option B: Create feature branch (larger features)
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat: add my feature"
git push -u origin feature/my-feature
# Create PR: feature/my-feature → develop (via GitHub)
```

### 3. Test Locally

```bash
# Run backend tests
cd core-monolith
npm test

# Run linting
npm run lint

# Build to check for errors
npm run build

# Run frontend tests
cd ../frontend
npm run lint
npm run build
```

### 4. Push to Develop

```bash
git push origin develop
# ✅ CI runs automatically:
#    - Lint
#    - Type check
#    - Unit tests
#    - Docker build test
```

---

## 🧪 Moving to Staging

### When to Deploy to Staging

- Feature is complete and tested locally
- Ready for QA/integration testing
- Want to test with real-like environment

### Process

```bash
# Create PR: develop → staging
# Via GitHub UI or:
gh pr create --base staging --head develop --title "Deploy to staging" --body "Ready for QA"

# Once PR is merged to staging:
# ✅ CI runs automatically:
#    - Full test suite (70% coverage required)
#    - Integration tests
#    - Security scan (npm audit, Trivy)
#    - Load test (100 concurrent users)
#    - Auto-deploy to staging server (DigitalOcean)
```

### Staging Environment

- **URL**: `http://YOUR_STAGING_DROPLET_IP:3002`
- **API**: `http://YOUR_STAGING_DROPLET_IP:4000/api`
- **Database**: Same as production (or separate if you create one)
- **Purpose**: Test integrations, PPB APIs, full user flows

---

## 🚀 Deploying to Production

### When to Deploy to Production

- Thoroughly tested on staging
- All integration tests passing
- Stakeholder approval received

### Process

```bash
# Create PR: staging → main
# Via GitHub UI:
gh pr create --base main --head staging --title "Production deployment v1.x.x" --body "Changes: ..."

# Once PR is created:
# ✅ CI runs automatically:
#    - Strictest test suite (80% coverage required)
#    - E2E tests
#    - Security audit
#    - Load test (1000 concurrent users)
#    - ⚠️  AWAITS MANUAL APPROVAL (you must approve in GitHub)

# After approval:
#    - Auto-deploy to production server (DigitalOcean)
```

### Production Environment

- **URL**: `https://YOUR_PRODUCTION_DOMAIN` (or `http://YOUR_PROD_IP:3002`)
- **API**: `https://YOUR_PRODUCTION_DOMAIN/api`
- **Database**: Production database
- **Monitoring**: Sentry, CloudWatch (when set up)

---

## 🏗️ Environment Setup

### Local Development

```bash
# Copy environment template
cp .env.production .env.development
# Edit with local values
vim .env.development

# Start services
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d

# Access:
# - Frontend: http://localhost:3002
# - Backend: http://localhost:4000
# - API Docs: http://localhost:4000/api
```

### Staging Server (DigitalOcean)

```bash
# SSH to staging droplet
ssh root@YOUR_STAGING_DROPLET_IP

# Pull latest code
cd /app/kenya-tnt-system
git pull origin staging

# Update environment
vim .env.staging

# Restart services
docker compose -f docker-compose.production.yml -f docker-compose.staging.yml pull
docker compose -f docker-compose.production.yml -f docker-compose.staging.yml up -d

# View logs
docker compose logs -f backend frontend
```

### Production Server (DigitalOcean)

```bash
# SSH to production droplet
ssh root@YOUR_PRODUCTION_DROPLET_IP

# Pull latest code
cd /app/kenya-tnt-system
git pull origin main

# Update environment
vim .env.production

# Restart services
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# View logs
docker compose logs -f backend frontend
```

---

## 🔧 Common Commands

### Development

```bash
# Start development
make dev-up  # or: docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d

# Stop development
make dev-down

# View logs
make dev-logs

# Rebuild after dependency changes
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d --build

# Run tests
cd core-monolith && npm test
cd frontend && npm run lint
```

### Staging

```bash
# Start staging (locally)
docker compose -f docker-compose.production.yml -f docker-compose.staging.yml up -d

# Deploy to staging (automatic via CI)
git push origin staging
```

### Production

```bash
# Deploy to production (automatic via CI after approval)
# 1. Create PR: staging → main
# 2. Wait for CI checks
# 3. Approve deployment in GitHub
# 4. Auto-deploys to production
```

---

## 📝 Commit Message Convention

Follow conventional commits:

```bash
# Format: <type>(<scope>): <description>

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks

# Examples:
git commit -m "feat(consignments): add batch import functionality"
git commit -m "fix(auth): resolve JWT expiration issue"
git commit -m "docs(readme): update deployment instructions"
git commit -m "test(batches): add unit tests for batch validation"
```

---

## 🚨 Troubleshooting

### CI Failing on Develop

```bash
# Check what failed
# Go to: https://github.com/YOUR_REPO/actions

# Common fixes:
npm run lint              # Fix linting errors
npm test                  # Fix failing tests
npm run build             # Fix TypeScript errors
```

### CI Failing on Staging (Coverage < 70%)

```bash
# Check coverage locally
cd core-monolith
npm run test:cov

# Coverage report: coverage/lcov-report/index.html
# Add more tests until coverage >= 70%
```

### CI Failing on Production (Coverage < 80%)

```bash
# Check coverage locally
cd core-monolith
npm run test:cov

# Coverage must be >= 80% for production
# Add more tests, especially for critical paths
```

### Deployment Failed

```bash
# Check DigitalOcean droplet logs
ssh root@YOUR_DROPLET_IP
cd /app/kenya-tnt-system
docker compose logs -f

# Common issues:
# - Environment variables not set (.env.staging or .env.production)
# - Database connection failed (check DB_HOST, DB_PASSWORD)
# - Port conflicts (ensure ports 4000, 3002 are free)
# - Docker out of memory (check: docker stats)
```

---

## 📊 CI/CD Pipeline Overview

### Develop Branch (Fast Feedback)

```
Push to develop
    ↓
Lint & Type Check (2-3 min)
    ↓
Unit Tests (5 min)
    ↓
Docker Build Test (3 min)
    ↓
✅ Done (~10 min total)
```

### Staging Branch (Thorough Testing)

```
PR to staging
    ↓
Lint & Type Check
    ↓
Full Test Suite (70% coverage)
    ↓
Integration Tests
    ↓
Security Scan
    ↓
Load Test (100 users)
    ↓
Build Docker Images
    ↓
Push to DigitalOcean Registry
    ↓
Deploy to Staging Droplet
    ↓
✅ Done (~20-25 min total)
```

### Main Branch (Production-Ready)

```
PR to main
    ↓
Lint & Type Check
    ↓
Full Test Suite (80% coverage)
    ↓
E2E Tests
    ↓
Security Audit
    ↓
Load Test (1000 users)
    ↓
Build Docker Images
    ↓
⚠️  MANUAL APPROVAL REQUIRED
    ↓ (you approve)
Push to DigitalOcean Registry
    ↓
Deploy to Production Droplet
    ↓
✅ LIVE! (~30-40 min total)
```

---

## 🎯 Best Practices

### DO ✅

- Work on `develop` for daily changes
- Create feature branches for large features
- Run tests locally before pushing
- Test on staging before production
- Write meaningful commit messages
- Keep PRs small and focused
- Review your own PR before asking for review

### DON'T ❌

- Don't commit directly to `main` (protected)
- Don't skip tests ("I'll add them later")
- Don't commit secrets (`.env` files)
- Don't force push to `staging` or `main`
- Don't merge without CI passing
- Don't deploy to production on Friday evening 😄

---

## 📚 Reference

- **Branch Structure**: develop → staging → main
- **CI Workflows**: `.github/workflows/ci-*.yml`
- **NFR Requirements**: `NFR_MATRIX.md`
- **Setup Script**: `setup-dev-rails.sh`
- **Docker Configs**: `docker-compose.*.yml`

---

## 🆘 Getting Help

1. Check CI logs: `https://github.com/YOUR_REPO/actions`
2. Check server logs: `ssh root@SERVER_IP && docker compose logs -f`
3. Check this document: `DEVELOPMENT_WORKFLOW.md`
4. Check NFRs: `NFR_MATRIX.md`

---

**Remember**: The discipline you set today will save you hours of debugging tomorrow! 🚀


