# Docker Setup - Complete Rebuild ✅

**Date:** December 20, 2025  
**Status:** INFRASTRUCTURE FIXED, API ERRORS REMAIN

---

## What Was Fixed

### 1. ✅ Docker Mess Cleaned Up
**Problem:** Multiple backends, duplicate networks, orphaned containers
**Solution:** Burned everything down and rebuilt clean

```bash
# Before:
- kenya-tnt-backend (stopped, old code)
- kenya-tnt-system-backend-1 (new, different network)
- kenya-tnt-system_default network
- kenya-tnt-system_tnt-network
- Old FLMIS containers

# After (CLEAN):
- kenya-tnt-backend (SINGLE backend, clean network)
- kenya-tnt-system_tnt-network (ONE network)
- All services on same network
```

### 2. ✅ Hot Reload Fixed (dist/ volume issue)
**Problem:** `/app/dist` mounted as volume caused `EBUSY: resource busy or locked` error
**Solution:** Remove dist from volumes, let it be ephemeral in container

```yaml
# docker-compose.dev.yml - FINAL WORKING CONFIG
volumes:
  - ./core-monolith/src:/app/src:delegated  # ✅ Source code mounted
  - backend-node-modules:/app/node_modules   # ✅ Named volume
  # ❌ NO dist volume - let NestJS manage it internally
```

**Why this works:**
- `nest start --watch` tries to delete/recreate `dist/` folder
- Docker volumes can't be deleted from inside container
- Solution: Don't mount `dist/`, let it live ephemerally in container
- Hot reload now triggers properly when you edit source files

### 3. ✅ Kafka Connection Fixed
**Problem:** Backend trying to connect to `localhost:9092` instead of `kafka:9092`
**Solution:** Added environment variable

```yaml
environment:
  KAFKA_BROKER: kafka:9092  # Use Docker service name
```

### 4. ✅ All Containers Running Healthy

```
CONTAINER          STATUS
kenya-tnt-backend  Up (healthy) - port 4000
kenya-tnt-frontend Up            - port 3002  
kenya-tnt-postgres Up (healthy) - port 5432
epcis-service      Up            - port 8080
kafka              Up (healthy) - port 9092
opensearch-node    Up (healthy) - port 9200
zookeeper          Up            - port 2181
```

**ONE network:** `kenya-tnt-system_tnt-network`  
**ONE backend:** `kenya-tnt-backend`  
**ONE postgres:** `kenya-tnt-postgres`

---

## ✅ Working Endpoints

```bash
# Health check - WORKS! ✅
curl http://localhost:4000/api/health
# Returns: {"status":"ok",...}
```

---

## ❌ Remaining API Errors

### Error 1: Stats Endpoint
```bash
curl http://localhost:4000/api/master-data/uat-facilities/stats
# Returns: 500 Internal Server Error
```

**Root Cause:** Database column mismatch
```
PostgreSQL Error: column "kephLevel" does not exist
Hint: Perhaps you meant to reference the column "facility.keph_level".
```

**Issue:** TypeORM entity uses `kephLevel` (camelCase) but needs `@Column({ name: 'keph_level' })` mapping

### Error 2: Quality Audit Enriched
```bash
curl "http://localhost:4000/api/master-data/uat-facilities/quality-audit/enriched?days=30"
# Returns: 500 Internal Server Error  
```

**Status:** Needs investigation (likely similar column mapping issue)

---

## How to Use Going Forward

### Start Everything
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
docker-compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d
```

### Stop Everything
```bash
docker-compose -f docker-compose.production.yml -f docker-compose.dev.yml down
```

### Rebuild Backend Only
```bash
docker-compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d --build backend
```

### Check Logs
```bash
docker logs kenya-tnt-backend --tail 50
docker logs kenya-tnt-frontend --tail 50
```

### Hot Reload - How It Works Now
1. Edit file in `core-monolith/src/`
2. Save file
3. Webpack detects change automatically
4. Recompiles in ~200ms
5. NestJS restarts automatically
6. No need to rebuild Docker image!

---

## Architecture - FINAL STATE

```
docker-compose.production.yml (BASE)
  ├── postgres (PostGIS)
  ├── opensearch
  ├── kafka + zookeeper
  ├── epcis-service
  ├── backend (production Dockerfile)
  └── frontend (production Dockerfile)

docker-compose.dev.yml (OVERLAY)
  ├── backend
  │   ├── Dockerfile.dev (lightweight)
  │   ├── Mounts: src/, tsconfig, nest-cli
  │   ├── Volume: node_modules (named)
  │   └── Ephemeral: dist/ (not mounted)
  └── frontend
      ├── Dockerfile.dev
      ├── Mounts: app/, components/, lib/
      └── Volumes: node_modules, .next
```

---

## Next Steps

1. ✅ **DONE:** Infrastructure cleanup
2. ✅ **DONE:** Hot reload working
3. ❌ **TODO:** Fix database column mapping errors
4. ❌ **TODO:** Test quality audit endpoints
5. ❌ **TODO:** Verify frontend can connect to backend

---

## Key Learnings

### ✅ DO:
- Use **named volumes** for `node_modules`
- Let `dist/` be **ephemeral** (don't mount it)
- Use **service names** for inter-container communication (`kafka:9092`, not `localhost:9092`)
- Mount **source code** for hot reload
- Use **delegated** mode for better Mac performance

### ❌ DON'T:
- Don't mount `/app/dist` as volume (causes EBUSY errors)
- Don't use anonymous volumes (`- /app/dist`)
- Don't use `localhost` for inter-container connections
- Don't create multiple backends accidentally
- Don't forget `@Column({ name: 'snake_case' })` for database columns

---

**Summary:** Infrastructure is CLEAN and HOT RELOAD WORKS. Now we need to fix the database entity column mappings.

