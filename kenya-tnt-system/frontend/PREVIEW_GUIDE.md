# 🎯 Frontend Preview Guide

## Quick Access

### 🏠 Home Page
**URL**: http://localhost:3001

- Overview of all modules
- Quick links to each module
- Links to API documentation

---

## 📦 Manufacturer Module

### Batches (`/manufacturer/batches`)
**URL**: http://localhost:3001/manufacturer/batches

**Features to Test**:
1. Click "Create Batch" button
2. Fill in the form:
   - Product ID (from PPB catalog)
   - Batch Number (optional - will auto-generate if empty)
   - Expiry Date
   - Quantity
3. Submit to create a batch
4. View all batches in the table

**What to Look For**:
- ✅ Form validation
- ✅ Batch list table
- ✅ Error handling

---

### Cases (`/manufacturer/cases`)
**URL**: http://localhost:3001/manufacturer/cases

**Features to Test**:
1. Click "Create Case" button
2. Fill in:
   - Case Label
   - Products (JSON array format: `[{"productId": 1, "batchId": 1, "qty": 10}]`)
3. Submit to create a case

**What to Look For**:
- ✅ Case creation form
- ✅ Cases list table

---

### Packages (`/manufacturer/packages`)
**URL**: http://localhost:3001/manufacturer/packages

**Features to Test**:
1. Click "Create Package" button
2. Fill in:
   - Package Label
   - Case IDs (comma-separated: `1,2,3`)
3. Submit to create a package

**What to Look For**:
- ✅ Package creation form
- ✅ Packages list table

---

### Shipments (`/manufacturer/shipments`)
**URL**: http://localhost:3001/manufacturer/shipments

**Features to Test**:
1. Click "Create Shipment" button
2. Fill in shipment details:
   - Customer name
   - Pickup & delivery dates
   - Locations
   - Carrier
   - Package IDs (comma-separated)
3. Submit to create shipment
4. Click on a shipment row to see details
5. View SSCC barcode
6. Click "Dispatch Shipment" button (if not already dispatched)

**What to Look For**:
- ✅ Shipment creation form
- ✅ Shipments list table
- ✅ SSCC barcode display
- ✅ Dispatch functionality

---

## 🚚 Distributor Module

### Shipments (`/distributor/shipments`)
**URL**: http://localhost:3001/distributor/shipments

**Features to Test**:
1. **Receive Shipment**:
   - Click "Receive Shipment" button
   - Enter parent SSCC (from manufacturer)
   - Fill in customer, dates, locations, carrier
   - Submit to receive shipment

2. **Forward Shipment**:
   - Click "Forward Shipment" button
   - Enter received shipment ID
   - Fill in forwarding details
   - Submit to forward to facility

3. **View Received Shipments**:
   - View list of all received shipments
   - Click on shipment to see details and SSCC barcode

**What to Look For**:
- ✅ Receive shipment form
- ✅ Forward shipment form
- ✅ Received shipments list
- ✅ SSCC barcode display

---

## 🏛️ Regulator/PPB Module

### Products (`/regulator/products`)
**URL**: http://localhost:3001/regulator/products

**Features to Test**:
1. Click "Create Product" button
2. Fill in:
   - Product Name
   - Brand Name
   - GTIN (12-14 digits)
3. Submit to create product
4. View all products in table
5. Click "Delete" action to delete a product

**What to Look For**:
- ✅ Product creation form
- ✅ Products list table
- ✅ Delete functionality
- ✅ Product catalog management

---

### Journey Tracking (`/regulator/journey`)
**URL**: http://localhost:3001/regulator/journey

**Features to Test**:
1. Enter an SSCC barcode (18 digits)
2. Click "Track Journey" button
3. View journey details:
   - Manufacturer information
   - Distributor information
   - Facility information
   - Event timeline
   - SSCC barcode display

**What to Look For**:
- ✅ SSCC input field
- ✅ Journey tracking results
- ✅ Event timeline visualization
- ✅ SSCC barcode display

---

### Recalls (`/regulator/recall`)
**URL**: http://localhost:3001/regulator/recall

**Features to Test**:
1. Click "Create Recall" button
2. Fill in recall details:
   - Batch ID
   - Reason for recall
   - Transportation details
   - Pickup & delivery information
3. Submit to create recall
4. View all recalls in table
5. Update recall status:
   - "Mark In Progress" (for PENDING recalls)
   - "Mark Completed" (for IN_PROGRESS recalls)
   - "Cancel" (for active recalls)

**What to Look For**:
- ✅ Recall creation form
- ✅ Recalls list table
- ✅ Status update actions
- ✅ Status workflow

---

### Analytics (`/regulator/analytics`)
**URL**: http://localhost:3001/regulator/analytics

**Features to View**:
1. **Key Metrics Cards**:
   - Total Products
   - Total Batches
   - Total Shipments
   - Active Recalls

2. **Additional Metrics**:
   - Expired Batches
   - Shipments by Status

3. **Charts**:
   - Product Distribution (bar chart)
   - Monthly Trends (line chart)

**What to Look For**:
- ✅ Dashboard layout
- ✅ Metric cards
- ✅ Chart visualizations
- ✅ Data aggregation

---

## 🧪 Testing Workflow

### Complete Flow Test:

1. **Regulator**: Create a product
   - Go to `/regulator/products`
   - Create a product with GTIN

2. **Manufacturer**: Create a batch
   - Go to `/manufacturer/batches`
   - Create a batch using the product ID from step 1

3. **Manufacturer**: Create a case
   - Go to `/manufacturer/cases`
   - Create a case with the batch from step 2

4. **Manufacturer**: Create a package
   - Go to `/manufacturer/packages`
   - Create a package with the case from step 3

5. **Manufacturer**: Create a shipment
   - Go to `/manufacturer/shipments`
   - Create a shipment with the package from step 4
   - Note the SSCC barcode

6. **Manufacturer**: Dispatch shipment
   - Click on the shipment
   - Click "Dispatch Shipment"

7. **Distributor**: Receive shipment
   - Go to `/distributor/shipments`
   - Use the SSCC from step 5 to receive the shipment

8. **Regulator**: Track journey
   - Go to `/regulator/journey`
   - Enter the SSCC to see the full journey

9. **Regulator**: View analytics
   - Go to `/regulator/analytics`
   - See all the metrics and charts

---

## 🐛 Troubleshooting

### If pages don't load:
1. Check if Core Monolith is running: http://localhost:3000/api/health
2. Check if Frontend is running: http://localhost:3001
3. Check browser console for errors

### If API calls fail:
1. Verify Core Monolith is running on port 3000
2. Check API base URL in `.env.local` (should be `http://localhost:3000/api`)
3. Check Swagger UI: http://localhost:3000/api/docs

### If forms don't submit:
1. Check browser console for validation errors
2. Verify all required fields are filled
3. Check network tab for API errors

---

## 📸 What You Should See

### Home Page:
- 4 module cards (Regulator, Manufacturer, Distributor, API Docs)
- Quick links section
- Clean, modern UI

### Module Pages:
- Navigation bar with module name
- Page title
- Action buttons (Create, etc.)
- Data tables
- Forms in modals
- Error messages (if any)
- Loading states

### Features:
- ✅ Responsive design
- ✅ Clean UI with Tailwind CSS
- ✅ Interactive forms
- ✅ Data tables
- ✅ SSCC barcode display
- ✅ Error handling
- ✅ Loading states

---

## 🎉 Enjoy Exploring!

All modules are fully functional and ready for testing. Start with the home page and navigate through each module to see the complete Track & Trace system in action!

