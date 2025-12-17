# Complete Setup Guide - Kenya TNT System

This guide will help you set up the entire Kenya TNT System from scratch.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Git

## Step 1: Database Setup (PostgreSQL with PostGIS)

### Option A: Using Docker (Recommended)

```bash
cd kenya-tnt-system
./scripts/setup-database.sh
```

This script will:
- Start PostgreSQL in Docker
- Enable PostGIS extension
- Run the schema migration

### Option B: Manual Docker Setup

```bash
cd kenya-tnt-system
docker-compose up -d postgres

# Wait for PostgreSQL to be ready, then:
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/schema.sql
```

### Verify Database

```bash
docker exec -it kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db -c "\dt"
```

You should see all the tables created.

## Step 2: Configure Core Monolith

### Update Environment Variables

The `.env` file is already created in `core-monolith/`. Verify it has:

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=tnt_user
DB_PASSWORD=tnt_password
DB_DATABASE=kenya_tnt_db

# EPCIS Service (OpenEPCIS)
EPCIS_ADAPTER_TYPE=openepcis
EPCIS_BASE_URL=http://localhost:8080
EPCIS_AUTH_TYPE=none
```

## Step 3: Start OpenEPCIS Service

The monolith is configured to connect to OpenEPCIS on port 8080.

### Start OpenEPCIS

```bash
cd ../epcis-service/docker
docker-compose up -d
```

This will start:
- OpenEPCIS REST API on port 8080
- Kafka
- OpenSearch

### Verify OpenEPCIS is Running

```bash
curl http://localhost:8080/health
```

## Step 4: Start Core Monolith

```bash
cd kenya-tnt-system/core-monolith
npm install
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## Step 5: Start Frontend

```bash
cd kenya-tnt-system/frontend
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

The frontend will be available at:
- **Frontend**: http://localhost:3001

## Quick Start Script

For convenience, you can use this one-liner to start everything:

```bash
# Terminal 1: Database
cd kenya-tnt-system && ./scripts/setup-database.sh

# Terminal 2: OpenEPCIS
cd epcis-service/docker && docker-compose up -d

# Terminal 3: Core Monolith
cd kenya-tnt-system/core-monolith && npm run start:dev

# Terminal 4: Frontend
cd kenya-tnt-system/frontend && npm run dev
```

## Verification Checklist

- [ ] PostgreSQL is running and schema is applied
- [ ] OpenEPCIS is running on port 8080
- [ ] Core Monolith is running on port 3000
- [ ] Frontend is running on port 3001
- [ ] Swagger UI is accessible
- [ ] Health check endpoint returns OK

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep kenya-tnt-postgres

# Check logs
docker logs kenya-tnt-postgres

# Test connection
docker exec -it kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db
```

### OpenEPCIS Connection Issues

```bash
# Check if OpenEPCIS is running
curl http://localhost:8080/health

# Check OpenEPCIS logs
cd epcis-service/docker
docker-compose logs
```

### Port Conflicts

If ports are already in use:

- **Port 3000**: Change `PORT` in `core-monolith/.env`
- **Port 3001**: Change port in `frontend/package.json` scripts
- **Port 5433**: Change in `docker-compose.yml`
- **Port 8080**: Change OpenEPCIS port or update `EPCIS_BASE_URL`

## Next Steps

1. Explore the API via Swagger UI
2. Test demo endpoints (GS1 services)
3. Build out frontend pages using UI components
4. Integrate authentication
5. Test full CRUD operations

