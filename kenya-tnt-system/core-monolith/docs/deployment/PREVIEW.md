# Kenya TNT System - Preview Guide

## 🚀 Quick Access

### Frontend Application
- **Main URL**: http://localhost:4001
- **PPB Regulator**: http://localhost:4001/regulator/products
- **Manufacturer**: http://localhost:4001/manufacturer/batches
- **Distributor**: http://localhost:4001/distributor/shipments

### Backend API
- **API Base**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/api
- **Health Check**: http://localhost:4000/api/health

---

## 📱 Module Access

### PPB Regulator Module
**Sidebar Navigation:**
- **Product Catalog** - Manage product catalog
- **Journey Tracking** - Track shipments by SSCC
- **Recalls** - Manage product recalls
- **Analytics** - View analytics dashboard

**Key Pages:**
- Products: http://localhost:4001/regulator/products
- Journey: http://localhost:4001/regulator/journey (Use SSCC: `123456789012345678`)
- Recalls: http://localhost:4001/regulator/recall
- Analytics: http://localhost:4001/regulator/analytics

### Manufacturer Module
**Sidebar Navigation:**
- **Production** (Dropdown)
  - Batches
  - Cases
  - Packages
- **Shipments**

**Key Pages:**
- Batches: http://localhost:4001/manufacturer/batches
- Cases: http://localhost:4001/manufacturer/cases
- Packages: http://localhost:4001/manufacturer/packages
- Shipments: http://localhost:4001/manufacturer/shipments

### Distributor Module
**Sidebar Navigation:**
- **Shipments** (Dropdown)
  - Received Shipments
  - Forward Shipments

**Key Pages:**
- Shipments: http://localhost:4001/distributor/shipments

---

## 🎯 Test Journey Tracking

1. Navigate to: http://localhost:4001/regulator/journey
2. Enter SSCC: `123456789012345678`
3. Click "Track Journey"
4. You should see:
   - Complete journey timeline
   - 3 packages with cases and products
   - Manufacturer information
   - Shipment details

---

## ✨ New Features

### 1. Larger Modals
- All modals now use **XL size** (max-width: 6xl)
- Better for displaying tables and forms
- Fullscreen option available

### 2. Sidebar Navigation
- Fixed sidebar on the left (256px width)
- Dropdown menus for grouped items
- Active state highlighting
- Icons for all menu items

---

## 🔧 Starting Services

If services are not running:

```bash
# Start Backend
cd kenya-tnt-system/core-monolith
npm run start:dev

# Start Frontend (in another terminal)
cd kenya-tnt-system/frontend
npm run dev
```

---

## 📊 Sample Data

The database is seeded with:
- 5 Products
- 5 Batches
- 4 Shipments (including complete journey chain)
- 5 Packages
- 4 Cases
- 5 Product entries in cases

Test SSCC: `123456789012345678`

