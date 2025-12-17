# Quick Start - Preview Phase 5

## 🚀 Fastest Way to See It Working

### Step 1: Start the Application

```bash
cd core-monolith
npm run start:dev
```

The application will start on **http://localhost:3000**

### Step 2: Open Swagger UI (Best Preview Method)

Open in your browser:
**http://localhost:3000/api/docs**

This gives you:
- ✅ Interactive API documentation
- ✅ Try all endpoints directly
- ✅ See request/response schemas
- ✅ Test the API without writing code

### Step 3: Test Key Endpoints

#### Health Check
```
GET http://localhost:3000/api/health
```

#### View Architecture
```
GET http://localhost:3000/api/demo/architecture
```

#### Test GS1 Services (No DB Required!)
```
GET http://localhost:3000/api/demo/gs1/sscc      # Generate SSCC
GET http://localhost:3000/api/demo/gs1/batch    # Generate Batch Number
GET http://localhost:3000/api/demo/gs1/sgtin    # Generate SGTIN
GET http://localhost:3000/api/demo/gs1/qrcode    # Generate QR Code
```

## 📊 What You Can Test

### ✅ Works Without Database
- GS1 Service (SSCC, SGTIN, Batch, QR Code generation)
- API structure and endpoints
- Swagger documentation
- Health checks

### ⚠️ Requires Database Setup
- Product catalog operations
- Batch/Case/Package/Shipment creation
- Journey tracking
- Analytics queries

## 🎯 Recommended Preview Flow

1. **Start the app**: `npm run start:dev`
2. **Open Swagger**: http://localhost:3000/api/docs
3. **Test GS1 Demo endpoints** (no DB needed):
   - `/api/demo/gs1/sscc` - See SSCC generation
   - `/api/demo/gs1/qrcode` - See QR code generation
4. **View architecture**: `/api/demo/architecture`
5. **Explore API structure** in Swagger UI

## 🔧 If You Want Full Functionality

1. Set up PostgreSQL (see `database/README.md`)
2. Run schema migration (`database/schema.sql`)
3. Start EPCIS service (or use mock)
4. Test full CRUD operations via Swagger

## 💡 Pro Tip

Use **Swagger UI** (`/api/docs`) - it's the best way to:
- See all available endpoints
- Understand the API structure
- Test functionality interactively
- View request/response examples

