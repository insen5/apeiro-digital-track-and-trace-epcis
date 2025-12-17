# Preview Guide - Kenya TNT System (Phase 5)

## Quick Start

### Option 1: Start the Application (Recommended)

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Start the application**:
   ```bash
   npm run start:dev
   ```

4. **Access the API**:
   - **Health Check**: http://localhost:3000/api/health
   - **Swagger API Docs**: http://localhost:3000/api/docs
   - **Module Endpoints**: http://localhost:3000/api/health/modules

### Option 2: Build and Run Production Mode

```bash
npm run build
npm run start:prod
```

## What's Working (Phase 5)

### ✅ Regulator Module (PPB)
- **Products**: `/api/regulator/products` - Product catalog management
- **Journey**: `/api/regulator/journey` - Journey tracking (single SQL query!)
- **Recall**: `/api/regulator/recall` - Recall management
- **Analytics**: `/api/regulator/analytics` - Analytics queries

### ✅ Manufacturer Module
- **Batches**: `/api/manufacturer/batches` - Batch creation (calls PPB API for products)
- **Cases**: `/api/manufacturer/cases` - Case aggregation
- **Packages**: `/api/manufacturer/packages` - Package creation
- **Shipments**: `/api/manufacturer/shipments` - Shipment creation (SSCC generation)

### ✅ Distributor Module
- **Shipments**: `/api/distributor/shipments` - Receive & forward shipments

### ✅ Shared Services
- **GS1 Service**: SSCC, SGTIN, Batch Number, Barcode generation
- **EPCIS Service**: Vendor-agnostic EPCIS adapter
- **PPB API Client**: For product catalog access

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. View Available Modules
```bash
curl http://localhost:3000/api/health/modules
```

### 3. Swagger UI (Best for Testing)
Open http://localhost:3000/api/docs in your browser to:
- See all available endpoints
- Test API calls directly
- View request/response schemas
- Try out the API interactively

## Current Limitations

⚠️ **Database**: Application will start but database operations will fail until PostgreSQL is set up (Phase 4 schema needs to be applied)

⚠️ **EPCIS Service**: EPCIS operations will fail until EPCIS service is running (or mock adapter is used)

⚠️ **Authentication**: Auth guards are commented out (will be implemented later)

## Next Steps

1. Set up PostgreSQL database (see `database/README.md`)
2. Run database migrations
3. Start EPCIS service (or configure mock adapter)
4. Test API endpoints via Swagger UI

## Architecture Highlights

- ✅ **Single Database**: All modules share one PostgreSQL database
- ✅ **Direct DB Queries**: Journey tracking uses single SQL query (no HTTP calls!)
- ✅ **PPB API Integration**: Manufacturer/Distributor call PPB for products
- ✅ **GS1 Service Layer**: Centralized GS1 functionality
- ✅ **Vendor-Agnostic EPCIS**: Can switch EPCIS providers via config
- ✅ **Numeric Quantities**: Math operations work (`qty - sentQty`)

