# 🚀 Start Here - Quick Preview

## To See Swagger UI:

### Option 1: Simple Start (Recommended)
```bash
cd core-monolith
npm run start:dev
```

Wait for the message:
```
🚀 Kenya TNT System is running!
📚 Swagger Docs:  http://localhost:3000/api/docs
```

Then open: **http://localhost:3000/api/docs**

### Option 2: Using the Script
```bash
cd core-monolith
./start-preview.sh
```

## ⚠️ If You See Database Connection Errors

**That's OK!** The app will still start and you can:
- ✅ View Swagger UI
- ✅ Test demo endpoints (GS1 services)
- ✅ See API structure
- ✅ Test endpoints that don't need DB

Database-dependent endpoints will fail, but the app is still useful for preview!

## 🎯 What Works Without Database

1. **Swagger UI**: http://localhost:3000/api/docs
2. **Health Check**: http://localhost:3000/api/health
3. **Demo Endpoints**:
   - http://localhost:3000/api/demo/gs1/sscc
   - http://localhost:3000/api/demo/gs1/batch
   - http://localhost:3000/api/demo/gs1/sgtin
   - http://localhost:3000/api/demo/architecture

## 🔧 Troubleshooting

**Port 3000 already in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**App won't start?**
```bash
npm install
npm run build
npm run start:dev
```

