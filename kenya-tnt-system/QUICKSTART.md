# Quick Start - Kenya TNT Development

**Last Updated**: December 19, 2025

---

## 🚀 First Time Setup

```bash
cd kenya-tnt-system
bash setup-dev-rails.sh
```

This script will:
1. ✅ Create branch structure (develop, staging, main)
2. ✅ Guide you through GitHub settings
3. ✅ Create local environment files
4. ✅ Set up your workflow

---

## 📋 Daily Workflow

### Morning

```bash
git checkout develop
git pull origin develop
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d
```

### Make Changes

```bash
# Edit code...
npm test                    # Test
git add .
git commit -m "feat: ..."
git push origin develop     # ✅ CI runs automatically
```

### Deploy to Staging

```bash
# Create PR: develop → staging (via GitHub UI)
# CI runs + auto-deploys to staging server
```

### Deploy to Production

```bash
# Create PR: staging → main (via GitHub UI)
# CI runs + awaits your approval
# Approve → auto-deploys to production
```

---

## 🔑 GitHub Secrets to Add

**Go to**: Settings → Secrets → Actions → New secret

```
# Company Docker Registry
DOCKER_REGISTRY_URL            = registry.yourcompany.com
DOCKER_REGISTRY_USERNAME       = your-username
DOCKER_REGISTRY_PASSWORD       = your-password-or-token

# Staging Environment
STAGING_API_URL                = http://YOUR_STAGING_IP:4000/api
STAGING_SERVER_IP              = YOUR_STAGING_IP
STAGING_SERVER_USER            = root
STAGING_SERVER_SSH_KEY         = <your-ssh-private-key>

# Production Environment
PRODUCTION_API_URL             = https://YOUR_DOMAIN/api
PRODUCTION_SERVER_IP           = YOUR_PRODUCTION_IP
PRODUCTION_SERVER_USER         = root
PRODUCTION_SERVER_SSH_KEY      = <your-ssh-private-key>
```

---

## 🔒 Branch Protection

**Go to**: Settings → Branches → Add rule

### For `staging`:
- ✅ Require status checks (CI Staging)
- ✅ Require branches to be up to date

### For `main`:
- ✅ Require status checks (CI Production)
- ✅ Require branches to be up to date

---

## 🎯 Branch Progression

```
develop  →  staging  →  main
(daily)    (QA, 70%)  (prod, 80%, approval required)
```

---

## 📚 Full Guide

See: `DEVELOPMENT_WORKFLOW.md`

---

**You're ready to code with discipline!** 🎉
