# API 500 Error Fix - December 20, 2025

## Summary

Frontend is getting 500 Internal Server errors when calling:
1. `GET /api/master-data/uat-facilities/stats`
2. `GET /api/master-data/uat-facilities/quality-audit/enriched?days=30`
3. `GET /api/master-data/facilities-prod/quality-audit/enriched?days=30`

## Root Cause

**Hot reload is not working properly in Docker dev environment.**

The compiled code in `/app/dist/main.js` is using OLD code that has `dateField: 'reportDate'`, but the source code has been updated to `dateField: 'auditDate'` for UAT facilities.

### Evidence
```bash
# Source code (CORRECT):
Line 392: dateField: 'auditDate',  # For uatFacility config

# Compiled code (WRONG):
docker exec kenya-tnt-backend grep -n "dateField.*reportDate" /app/dist/main.js
# Returns: 12087, 12095, 12103, 12156, 12164 - all show reportDate
```

### Error Log
```
EntityPropertyNotFoundError: Property "reportDate" was not found in "UatFacilitiesQualityAudit". 
Make sure your query is correct.
```

The `UatFacilitiesQualityAudit` entity has `auditDate` (not `reportDate`), so the query fails.

## Docker Development Environment Issues

1. **Dockerfile.dev** mounts `src/` as volume for hot reload
2. **Webpack compiles** on startup but NOT picking up latest source
3. **`npm run start:dev`** runs but uses stale dist/ folder
4. **Touching files** doesn't trigger recompilation

## Solution Options

### Option 1: Stop local Docker backend, use local npm (RECOMMENDED)

```bash
# Stop Docker backend
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
docker stop kenya-tnt-backend

# Run locally (connects to Docker postgres)
cd core-monolith
npm run start:dev
```

**Pros:**
- True hot reload works
- Faster iteration
- Direct access to code

**Cons:**
- Need to ensure DB connection env vars are correct

### Option 2: Force rebuild dist in container

```bash
docker exec kenya-tnt-backend rm -rf /app/dist /app/node_modules/.cache
docker restart kenya-tnt-backend
```

### Option 3: Use production build (no hot reload)

```bash
docker-compose -f docker-compose.production.yml up -d --build backend
```

## Current Environment Status

**Running containers:**
- `kenya-tnt-postgres` - ✅ Healthy (port 5432)
- `kenya-tnt-backend` - ❌ Running but with stale code
- `kenya-tnt-frontend` - ✅ Running (port 3002)
- `epcis-service` - ✅ Running (port 8080)
- `kafka` - ✅ Running (port 9092)
- `opensearch-node` - ✅ Running (port 9200)

## Next Steps

1. **Immediate fix**: Run Option 1 (local npm)
2. **Long-term**: Fix Docker dev hot reload configuration
3. **Alternative**: Create setup-dev-rails.sh script to automate local development setup

## Related Files

- `/Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith/Dockerfile.dev`
- `/Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/docker-compose.dev.yml`
- `/Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith/src/modules/shared/master-data/quality-audit.config.ts`
- `/Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith/src/shared/domain/entities/uat-facility.entity.ts`

---

**Status**: Ready to implement Option 1
**Priority**: High
**Impact**: Blocks frontend development

