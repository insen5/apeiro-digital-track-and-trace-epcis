# Development Workflow: Local Dev vs Docker Deployment

**Date:** December 18, 2025  
**Status:** ✅ RECOMMENDED APPROACH  
**Purpose:** Fast local development, Docker only for deployment

---

## 🎯 The Problem with Docker Development

**Issues:**
- ❌ **Slow rebuilds** - Every code change requires rebuild (2-5 minutes)
- ❌ **No hot reload** - Changes don't reflect instantly
- ❌ **Resource heavy** - Docker uses more RAM/CPU
- ❌ **Debugging harder** - Logs buried in containers
- ❌ **Slow iteration** - Testing takes forever

**Docker is GREAT for:**
- ✅ **Deployment** - Consistent environment across servers
- ✅ **CI/CD** - Automated builds and tests
- ✅ **Production** - Oracle Cloud, AWS, etc.

**Docker is BAD for:**
- ❌ **Active development** - Too slow for iteration
- ❌ **Debugging** - Hard to inspect issues
- ❌ **Testing** - Rebuilds waste time

---

## ✅ RECOMMENDED: Local Development Workflow

### Daily Development (Fast!)

```bash
# 1. Start Postgres in Docker (only infrastructure)
cd kenya-tnt-system
docker-compose -f docker-compose.yml up -d postgres

# 2. Start Backend locally (hot reload!)
cd kenya-tnt-system/core-monolith
npm run start:dev

# 3. Start Frontend locally (hot reload!)
cd kenya-tnt-system/frontend  
npm run dev

# 4. Develop!
# - Edit code
# - Changes reflect instantly
# - See logs in terminal
# - Fast iteration
```

**Result:**
- ⚡ **Instant hot reload** on code changes
- 🔍 **Easy debugging** - logs right in terminal
- 💻 **Low resource usage** - just Node.js processes
- 🚀 **Fast iteration** - test immediately

---

## 🐳 Docker Deployment (For Cloud Only)

### When to Use Docker:

1. **Deploying to Oracle Cloud** ✅
2. **Sharing with team** ✅
3. **CI/CD pipelines** ✅
4. **Production** ✅

### One-Shot Containerization:

```bash
# When ready to deploy, build everything once:
cd kenya-tnt-system

# Build both backend and frontend
docker-compose -f docker-compose.production.yml build

# Test locally (optional)
docker-compose -f docker-compose.production.yml up -d

# Deploy to Oracle Cloud
./deploy-to-oracle.sh  # Your deployment script
```

---

## 📋 Development Setup (One-Time)

### Prerequisites

```bash
# Node.js (v18+)
node --version

# PostgreSQL client (for local connections)
psql --version

# Docker (for Postgres only)
docker --version
```

### Initial Setup

```bash
cd kenya-tnt-system

# 1. Install dependencies
cd core-monolith && npm install
cd ../frontend && npm install

# 2. Start Postgres in Docker
cd ..
docker-compose -f docker-compose.yml up -d postgres

# 3. Apply migrations (one-time)
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/V*.sql

# 4. Configure environment (.env files already configured for localhost)
# core-monolith/.env:
#   DB_HOST=localhost
#   DB_PORT=5432  (mapped from Docker)
#   PORT=4000

# frontend/.env:
#   NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 🚀 Daily Development Workflow

### Morning Startup

```bash
# Terminal 1: Start Postgres (if not running)
docker ps | grep postgres || docker-compose -f kenya-tnt-system/docker-compose.yml up -d postgres

# Terminal 2: Start Backend
cd kenya-tnt-system/core-monolith
npm run start:dev
# Wait for: "🚀 Kenya TNT System is running!"

# Terminal 3: Start Frontend
cd kenya-tnt-system/frontend
npm run dev
# Wait for: "✓ Ready in X.Xs"

# Browser: http://localhost:3002
```

### During Development

```typescript
// Edit any file
// core-monolith/src/**/*.ts → Auto-compiles and restarts (5-10 seconds)
// frontend/app/**/*.tsx → Hot reload (instant!)

// No rebuilds needed!
// No Docker commands!
// Just code and test!
```

### End of Day

```bash
# Stop servers (Ctrl+C in terminals)
# Postgres keeps running (or docker-compose down if you want)
```

---

## 🐳 Deployment Workflow (Weekly/As Needed)

### Pre-Deployment Checklist

```bash
# 1. Ensure all changes committed
git status
git add .
git commit -m "Feature: XYZ"

# 2. Run tests
cd core-monolith && npm run test
cd ../frontend && npm run build  # Ensure no build errors

# 3. Update version/changelog if needed
```

### Build Docker Images

```bash
cd kenya-tnt-system

# Build backend
docker-compose -f docker-compose.production.yml build --no-cache backend

# Build frontend  
docker-compose -f docker-compose.production.yml build --no-cache frontend

# Test locally (optional)
docker-compose -f docker-compose.production.yml up -d
curl http://localhost:4000/api/health
curl http://localhost:3002

# If all good, stop
docker-compose -f docker-compose.production.yml down
```

### Deploy to Oracle Cloud

```bash
# Tag and push images (your deployment process)
docker tag kenya-tnt-system-backend:latest your-registry/kenya-tnt-backend:v1.2.3
docker tag kenya-tnt-system-frontend:latest your-registry/kenya-tnt-frontend:v1.2.3

docker push your-registry/kenya-tnt-backend:v1.2.3
docker push your-registry/kenya-tnt-frontend:v1.2.3

# Deploy to Oracle Cloud
# (Follow your Oracle Cloud deployment process)
```

---

## 📊 Comparison

| Aspect | Local Dev (✅ Recommended) | Docker Dev (❌ Slow) |
|--------|---------------------------|---------------------|
| **Code changes** | Instant hot reload | 2-5 min rebuild |
| **Backend restart** | 5-10 seconds | 2-3 minutes |
| **Frontend reload** | Instant | 3-5 minutes |
| **Debugging** | Easy (terminal logs) | Hard (docker logs) |
| **Resource usage** | Low | High |
| **Iteration speed** | ⚡ Fast | 🐢 Slow |
| **When to use** | ✅ Daily development | ❌ Never for dev |
| | | ✅ Only for deployment |

---

## 🔧 Your Current Setup (Perfect!)

```
✅ Backend: npm run start:dev (localhost:4000)
✅ Frontend: npm run dev (localhost:3002)
✅ Postgres: Docker only (localhost:5432)
✅ Hot reload: Enabled on both

Development speed: ⚡⚡⚡ FAST!
```

---

## 📝 Quick Reference Commands

### Start Development

```bash
# Option 1: Separate terminals (see logs)
Terminal 1: docker-compose -f kenya-tnt-system/docker-compose.yml up -d postgres
Terminal 2: cd kenya-tnt-system/core-monolith && npm run start:dev
Terminal 3: cd kenya-tnt-system/frontend && npm run dev

# Option 2: One-liner background
docker-compose -f kenya-tnt-system/docker-compose.yml up -d postgres && \
  (cd kenya-tnt-system/core-monolith && npm run start:dev &) && \
  (cd kenya-tnt-system/frontend && npm run dev &)
```

### Stop Development

```bash
# Stop backend/frontend (Ctrl+C in terminals, or)
pkill -f "nest start"
pkill -f "next dev"

# Stop Postgres (optional)
docker-compose -f kenya-tnt-system/docker-compose.yml down
```

### Build for Deployment

```bash
cd kenya-tnt-system
docker-compose -f docker-compose.production.yml build
```

---

## 🎯 Key Takeaways

1. **Use local for development** - Hot reload is your friend
2. **Use Docker for infrastructure** - Postgres, Kafka (if needed)
3. **Use Docker for deployment** - Oracle Cloud, production
4. **Never develop in Docker** - Too slow, not worth it

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T DO THIS (Slow):
```bash
# DON'T: Build Docker every time you change code
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up
# Edit code
docker-compose -f docker-compose.production.yml build  # ← 5 minutes wasted
```

### ✅ DO THIS (Fast):
```bash
# DO: Run locally, edit, test immediately
npm run start:dev  # Backend
npm run dev        # Frontend
# Edit code → Instant reload! ⚡
```

---

## 📚 Related Documentation

- **ORACLE_CLOUD_DEPLOYMENT.md** - How to deploy to cloud
- **docker-compose.production.yml** - Production container config
- **docker-compose.dev.yml** - Dev overrides (NOT recommended, use local instead)

---

**Last Updated:** December 18, 2025  
**Status:** ✅ ACTIVE - Use this workflow for all development  
**Docker Use:** Only for Postgres (local) and deployment (cloud)




