# Fixing "Failed to fetch" Errors

## Issues Fixed

1. ✅ **CORS Enabled** - Added CORS configuration in `main.ts` to allow frontend requests
2. ✅ **Import Fix** - Fixed `Not` import in `distributor/shipments/shipment.service.ts`
3. ✅ **Database Tables** - Verified all tables exist

## Required Actions

### 1. Restart Backend (REQUIRED)

The backend needs to be restarted for CORS and import fixes to take effect:

```bash
# Stop the current backend (Ctrl+C in the terminal running it)
# Then restart:
cd kenya-tnt-system/core-monolith
npm run start:dev
```

### 2. Verify Database Connection

The database is running on port **5433** (not 5432). Make sure your `.env` file in `core-monolith/` has:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=tnt_user
DB_PASSWORD=tnt_password
DB_DATABASE=kenya_tnt_db
```

### 3. Check Backend Logs

After restarting, check the console output for:
- ✅ "Kenya TNT System is running!"
- ✅ Database connection success
- ❌ Any error messages

## Testing

After restarting the backend:

1. **Test Health Endpoint**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Test API Endpoint**:
   ```bash
   curl http://localhost:3000/api/manufacturer/batches
   ```
   Should return: `[]` (empty array) or data, not 500 error

3. **Test Frontend**:
   - Open http://localhost:3001/manufacturer/batches
   - Should load without "Failed to fetch" error

## Common Issues

### Still Getting "Failed to fetch"?

1. **Check Backend is Running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check CORS**:
   - Open browser DevTools → Network tab
   - Look for CORS errors in console
   - If you see CORS errors, backend restart didn't work

3. **Check Database Connection**:
   - Backend logs should show database connection status
   - If connection fails, check `.env` file port (should be 5433)

4. **Check API Endpoints**:
   - Visit http://localhost:3000/api/docs
   - Try endpoints directly in Swagger UI

## What Was Changed

### `core-monolith/src/main.ts`
- Added `app.enableCors()` with frontend origin

### `core-monolith/src/modules/distributor/shipments/shipment.service.ts`
- Fixed `Not` import (moved to top with other TypeORM imports)

## Next Steps

Once backend is restarted and working:
1. Test all frontend pages
2. Create test data (products, batches, etc.)
3. Test complete workflow

