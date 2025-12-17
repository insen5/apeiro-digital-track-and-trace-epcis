# Troubleshooting Guide

## Product Catalog API Error: "Cannot GET /api/master-data/products/all"

### Issue
The frontend is showing an error when trying to load products from `/api/master-data/products/all`.

### Root Cause
The endpoint exists in the code but may not be registered if the backend wasn't restarted after adding the MasterDataModule.

### Solution

1. **Restart the Backend Server**
   ```bash
   cd kenya-tnt-system/core-monolith
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run start:dev
   # Or if using production:
   npm run build && npm run start:prod
   ```

2. **Verify the Endpoint is Available**
   ```bash
   curl http://localhost:4000/api/master-data/products/all
   ```
   
   Should return a JSON array of products (or empty array `[]` if no products).

3. **Check Swagger Documentation**
   Navigate to: http://localhost:4000/api/docs
   
   Look for "Master Data" section and verify `GET /master-data/products/all` is listed.

4. **Verify Products Exist**
   ```bash
   PGPASSWORD=tnt_password psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -c "SELECT COUNT(*) FROM ppb_products;"
   ```
   
   Should show product count > 0.

### Expected Behavior

After restarting:
- ✅ Endpoint `/api/master-data/products/all` should return 200 OK
- ✅ Products should load in the frontend
- ✅ Product counts should display correctly

### Alternative: Use Search Endpoint

If `products/all` still doesn't work, you can use the search endpoint:
```typescript
// In regulator.ts, change:
getAll: () => apiClient.get<Product[]>('/master-data/products/all'),

// To:
getAll: () => apiClient.get<{products: Product[]}>('/master-data/products?limit=10000').then(r => r.products),
```

### Verification Checklist

- [ ] Backend server is running on port 4000
- [ ] MasterDataModule is imported in AppModule
- [ ] MasterDataController is registered in MasterDataModule
- [ ] Products exist in `ppb_products` table
- [ ] Endpoint returns 200 (not 404)
- [ ] CORS is enabled for frontend origin
- [ ] Frontend API base URL is correct (`http://localhost:4000/api`)


