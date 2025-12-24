# ✅ Development Rails Setup Complete!

**Date**: December 19, 2025  
**Status**: READY TO USE

---

## 🎯 What Changed

### 1. ✅ Branch Structure Setup Script
**File**: `setup-dev-rails.sh`
- Creates `develop`, `staging`, `main` branches
- Guides through GitHub configuration
- Sets up local environment files
- Interactive setup with instructions

### 2. ✅ Updated CI/CD for DigitalOcean
**Files**: `.github/workflows/ci-staging.yml`, `ci-production.yml`
- Integrated DigitalOcean Container Registry
- Auto-deploy to DigitalOcean droplets
- Uses `doctl` for registry auth
- SSH deployment to staging/production servers

### 3. ✅ Development Workflow Documentation
**File**: `DEVELOPMENT_WORKFLOW.md`
- Complete workflow guide (develop → staging → main)
- Branch policies and requirements
- Common commands and troubleshooting
- CI/CD pipeline overview

### 4. ✅ Quick Start Guide
**File**: `QUICKSTART.md`
- Single-page reference for daily work
- GitHub secrets to configure
- Branch protection rules
- Quick commands

---

## 🚀 How to Start NOW

### Step 1: Run Setup Script

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
bash setup-dev-rails.sh
```

This will:
1. Create branch structure (develop, staging, main)
2. Guide you through GitHub settings (secrets, branch protection, environments)
3. Create local environment files (.env.development, .env.staging, .env.production)
4. Switch you to `develop` branch

### Step 2: Configure GitHub Secrets

**Go to**: https://github.com/YOUR_USERNAME/kenya-tnt-system/settings/secrets/actions

**Add these secrets**:

```
# Staging Environment
STAGING_API_URL                = http://YOUR_STAGING_DROPLET_IP:4000/api
STAGING_DROPLET_IP             = YOUR_STAGING_DROPLET_IP
STAGING_DROPLET_USER           = root
STAGING_DROPLET_SSH_KEY        = <paste-your-ssh-private-key>

# Production Environment  
PRODUCTION_API_URL             = https://YOUR_PRODUCTION_DOMAIN/api (or http://IP:4000/api)
PRODUCTION_DROPLET_IP          = YOUR_PRODUCTION_DROPLET_IP
PRODUCTION_DROPLET_USER        = root
PRODUCTION_DROPLET_SSH_KEY     = <paste-your-ssh-private-key>

# DigitalOcean
DIGITALOCEAN_ACCESS_TOKEN      = <your-DO-API-token>
DIGITALOCEAN_REGISTRY_NAME     = kenya-tnt (or create one in DO first)
```

**How to get your SSH key**:
```bash
cat ~/.ssh/id_rsa  # Copy entire output including BEGIN/END lines
```

**How to create DO Container Registry**:
1. Go to: https://cloud.digitalocean.com/registry
2. Create registry: "kenya-tnt"
3. Copy the name (e.g., "kenya-tnt")

### Step 3: Set Branch Protection

**Go to**: https://github.com/YOUR_USERNAME/kenya-tnt-system/settings/branches

**For `staging` branch**:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - Select: "Staging CI Summary"
- ✅ Require branches to be up to date before merging

**For `main` branch**:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - Select: "Production CI Summary"
- ✅ Require branches to be up to date before merging

### Step 4: Create Production Environment (for manual approval)

**Go to**: https://github.com/YOUR_USERNAME/kenya-tnt-system/settings/environments

- Click "New environment"
- Name: `production`
- ✅ Required reviewers: Add yourself
- Save

---

## 🔄 Your New Workflow

### Daily Work (develop branch)

```bash
# 1. Start your day
git checkout develop
git pull origin develop

# 2. Start local dev environment
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d

# 3. Make changes
# ... edit code ...

# 4. Test locally
cd core-monolith && npm test
cd ../frontend && npm run lint

# 5. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin develop

# ✅ CI runs automatically (lint, type check, unit tests)
```

### Deploy to Staging

```bash
# Create PR: develop → staging (via GitHub UI)
gh pr create --base staging --head develop --title "Deploy to staging"

# ✅ CI runs:
#    - Full tests (70% coverage)
#    - Integration tests
#    - Security scan
#    - Load test (100 users)
#    - Auto-deploy to staging droplet
```

### Deploy to Production

```bash
# Create PR: staging → main (via GitHub UI)
gh pr create --base main --head staging --title "Production release v1.x"

# ✅ CI runs:
#    - Strictest tests (80% coverage)
#    - E2E tests
#    - Load test (1000 users)
#    - ⚠️  AWAITS YOUR APPROVAL
#    - Auto-deploy to production after approval
```

---

## 📊 Branch Progression

```
┌─────────────────────────────────────────────────────────────┐
│  develop (daily work)                                       │
│  ├─ Fast CI: lint, type, unit tests                        │
│  ├─ No coverage requirement                                 │
│  └─ Deploy: Local or dev server                            │
└─────────────────────────────────────────────────────────────┘
                        ↓ (PR: develop → staging)
┌─────────────────────────────────────────────────────────────┐
│  staging (QA & integration)                                 │
│  ├─ Full CI: 70% coverage, integration, security           │
│  ├─ Load test: 100 concurrent users                        │
│  └─ Deploy: Auto to staging droplet (DigitalOcean)         │
└─────────────────────────────────────────────────────────────┘
                        ↓ (PR: staging → main)
┌─────────────────────────────────────────────────────────────┐
│  main (production)                                          │
│  ├─ Strictest CI: 80% coverage, E2E, security audit        │
│  ├─ Load test: 1000 concurrent users                       │
│  ├─ ⚠️  MANUAL APPROVAL REQUIRED (you)                     │
│  └─ Deploy: Auto to production droplet after approval      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Changes from "Commit to Main"

### Before (Your Current Setup)
```bash
# Working directly on main
git checkout main
# ... make changes ...
git commit -m "fix stuff"
git push origin main
# 🚨 No tests, no review, straight to prod!
```

### After (New Discipline)
```bash
# Work on develop
git checkout develop
# ... make changes ...
git commit -m "feat: add feature"
git push origin develop
# ✅ CI runs: lint, type, tests

# When ready for QA
# Create PR: develop → staging
# ✅ CI runs: full tests (70%), integration, security
# ✅ Auto-deploy to staging

# When ready for prod
# Create PR: staging → main
# ✅ CI runs: strictest tests (80%), E2E, load test
# ✅ You manually approve
# ✅ Auto-deploy to production
```

---

## 📁 File Structure

```
kenya-tnt-system/
│
├── .github/workflows/
│   ├── ci-dev.yml                    ← Fast checks (develop)
│   ├── ci-staging.yml                ← Full tests + deploy (staging)
│   └── ci-production.yml             ← Strictest + approval (main)
│
├── setup-dev-rails.sh                ← Run this first! ✅
├── DEVELOPMENT_WORKFLOW.md           ← Complete workflow guide
├── QUICKSTART.md                     ← Daily reference
├── SETUP_COMPLETE.md                 ← This file
│
├── docker-compose.dev.yml            ← Development environment
├── docker-compose.staging.yml        ← Staging environment
├── docker-compose.production.yml     ← Production environment
│
├── .env.development                  ← Local dev config (created by script)
├── .env.staging                      ← Staging config (edit with your IPs)
├── .env.production                   ← Production config (edit with your IPs)
│
├── env.staging.template              ← Template for staging
├── env.production.template           ← Template for production
│
└── NFR_MATRIX.md                     ← Performance & testing requirements
```

---

## 🆘 Troubleshooting

### "I need to set up my company's Docker Registry"

**Your registry URL format depends on your provider:**

- **Docker Hub**: `docker.io` (or leave blank)
- **GitHub Container Registry**: `ghcr.io`
- **GitLab Registry**: `registry.gitlab.com`
- **Private Registry**: `registry.yourcompany.com`

**Add credentials to GitHub Secrets:**
```
DOCKER_REGISTRY_URL      = registry.yourcompany.com
DOCKER_REGISTRY_USERNAME = your-username
DOCKER_REGISTRY_PASSWORD = your-password-or-token
```

### "I don't have separate staging/production droplets"

**Option 1**: Use the same droplet for staging and production (not recommended)
- Use different ports (e.g., staging on 4001/3003, prod on 4000/3002)

**Option 2**: Create separate droplets (recommended)
- Staging: Small droplet (2GB RAM, $12/month)
- Production: Larger droplet (4GB+ RAM)

### "How do I get my SSH private key?"

```bash
cat ~/.ssh/id_rsa
```

Copy the ENTIRE output including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
... (all lines) ...
-----END OPENSSH PRIVATE KEY-----
```

Paste into GitHub Secret: `STAGING_DROPLET_SSH_KEY` (or `PRODUCTION_DROPLET_SSH_KEY`)

### "CI is failing on coverage"

**For staging (70% required)**:
```bash
cd core-monolith
npm run test:cov
# Check: coverage/lcov-report/index.html
# Add more tests until >= 70%
```

**For production (80% required)**:
```bash
cd core-monolith
npm run test:cov
# Add comprehensive tests until >= 80%
```

### "Deployment failed"

```bash
# SSH to your droplet
ssh root@YOUR_DROPLET_IP

# Check if code is there
cd /app/kenya-tnt-system
ls -la

# Check if docker is running
docker ps

# Check logs
docker compose logs -f backend frontend

# Common issues:
# 1. .env file not configured: vim .env.staging
# 2. Database not running: docker compose up -d postgres
# 3. Ports in use: docker compose down && docker compose up -d
```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `QUICKSTART.md` | Single-page daily reference |
| `DEVELOPMENT_WORKFLOW.md` | Complete workflow guide |
| `NFR_MATRIX.md` | Performance & testing requirements |
| `BEST_PRACTICES_APPLIED.md` | What was changed and why |
| `setup-dev-rails.sh` | Interactive setup script |

---

## ✅ Checklist

Before you start coding with new workflow:

- [ ] Run `setup-dev-rails.sh`
- [ ] Add GitHub Secrets (8 total)
- [ ] Create DigitalOcean Container Registry
- [ ] Set branch protection (staging, main)
- [ ] Create production environment (for approval)
- [ ] Edit `.env.staging` with your staging droplet IP
- [ ] Edit `.env.production` with your production droplet IP
- [ ] Test local development: `docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d`
- [ ] Make first commit to `develop` branch
- [ ] Create first PR: develop → staging

---

**You now have professional development rails! 🚀**

**Start here**: Run `bash setup-dev-rails.sh` and follow the prompts.

**Daily work**: See `QUICKSTART.md`

**Full guide**: See `DEVELOPMENT_WORKFLOW.md`


