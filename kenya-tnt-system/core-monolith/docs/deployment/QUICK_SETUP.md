# 🚀 Quick Setup Guide

## One-Command Database Setup

```bash
cd kenya-tnt-system
./scripts/setup-database.sh
```

This will:
- ✅ Start PostgreSQL in Docker
- ✅ Enable PostGIS
- ✅ Run schema migration

## Start All Services

### Terminal 1: Database (if not already running)
```bash
cd kenya-tnt-system
docker-compose up -d postgres
```

### Terminal 2: OpenEPCIS
```bash
cd ../epcis-service/docker
docker-compose up -d
```

### Terminal 3: Core Monolith
```bash
cd kenya-tnt-system/core-monolith
npm run start:dev
```

### Terminal 4: Frontend
```bash
cd kenya-tnt-system/frontend
npm install  # First time only
npm run dev
```

## Access Points

- **Frontend**: http://localhost:4001
- **API**: http://localhost:4000/api
- **Swagger Docs**: http://localhost:4000/api/docs
- **Health Check**: http://localhost:4000/api/health
- **OpenEPCIS**: http://localhost:8080

## Verify Everything Works

1. ✅ Database: `docker ps | grep kenya-tnt-postgres`
2. ✅ OpenEPCIS: `curl http://localhost:8080/health`
3. ✅ Monolith: `curl http://localhost:4000/api/health`
4. ✅ Frontend: Open http://localhost:4001

## What's Configured

- ✅ **Database**: Docker PostgreSQL with PostGIS on port 5433
- ✅ **Schema**: Auto-applied via setup script
- ✅ **EPCIS**: Configured to connect to OpenEPCIS on port 8080
- ✅ **Frontend**: Next.js app with copied UI components on port 4001
- ✅ **API**: Core monolith on port 4000

## Next Steps

1. Explore Swagger UI: http://localhost:4000/api/docs
2. Test demo endpoints (GS1 services)
3. Build out frontend pages
4. Test full CRUD operations

