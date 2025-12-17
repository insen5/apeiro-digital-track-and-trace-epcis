# Route Registration Debug Analysis

## Problem
All product-related routes in `MasterDataController` return 404, even though:
- The controller is registered (suppliers endpoints work)
- Routes are properly defined with correct decorators
- Module structure appears correct
- No compilation errors in the main app

## Routes Affected
- `GET /api/master-data/products`
- `GET /api/master-data/products/all`
- `GET /api/master-data/products/stats`
- `GET /api/master-data/products/:id`
- `POST /api/master-data/products/sync`
- `DELETE /api/master-data/products/:id`
- `GET /api/master-data/products/test` (test route - also 404)

## Routes Working
- `GET /api/master-data/suppliers` ✅
- `GET /api/master-data/suppliers/:id` ✅
- `GET /api/master-data/premises` ✅
- `GET /api/master-data/logistics-providers` ✅

## Changes Made
1. ✅ Updated `MasterDataModule` to import `ExternalModule` instead of providing `PPBApiService` directly
2. ✅ Updated `RegulatorModule` to import `PPBBatchesModule`
3. ✅ Fixed route ordering (moved `products/all` before `products/:id`)

## Possible Causes

### 1. Runtime Error During Route Registration
- NestJS might be failing silently when trying to register product routes
- Check server startup logs for any errors related to:
  - `PPBProduct` entity
  - `PPBApiService` injection
  - `MasterDataService` initialization

### 2. TypeORM Repository Issue
- The `ppbProductRepo` might not be properly initialized
- Check if `PPBProduct` entity is properly registered in `DatabaseModule`

### 3. Service Method Errors
- Methods like `getAllProducts()`, `searchProducts()` might be throwing errors at initialization
- Check if these methods can be called directly

### 4. Route Conflict
- Another controller might be intercepting `/master-data/products` routes
- Check for any global route prefixes or middleware

## Debugging Steps

### 1. Check Server Logs
```bash
# Look for errors during startup
# Check for any messages about route registration
# Look for TypeORM errors related to PPBProduct
```

### 2. Test Service Methods Directly
```typescript
// In a test script or REPL, try:
const service = app.get(MasterDataService);
await service.getAllProducts(); // Does this work?
```

### 3. Check Entity Registration
```typescript
// Verify PPBProduct is in DatabaseModule entities array
// Check if TypeORM can connect to ppb_products table
```

### 4. Test Route Registration
```typescript
// Add logging to controller constructor
// Check if controller is being instantiated
// Verify all routes are being discovered
```

### 5. Try Minimal Route
```typescript
// Add a completely minimal route:
@Get('products-simple')
simple() {
  return { test: 'works' };
}
// If this works, the issue is with service methods
// If this doesn't work, the issue is with route registration
```

## Next Steps

1. **Check server console output** for any errors during startup
2. **Verify PPBProduct entity** is properly configured in database
3. **Test service methods** directly to see if they work
4. **Check for route conflicts** with other controllers
5. **Consider temporary workaround** using suppliers endpoint pattern as template

## Temporary Workaround

Since suppliers endpoints work, we could:
1. Create a separate `ProductsController` in a different module
2. Use the same pattern as suppliers endpoints
3. This would help isolate if the issue is specific to `MasterDataController`

## Files to Check

- `src/modules/shared/master-data/master-data.controller.ts` - Controller definition
- `src/modules/shared/master-data/master-data.service.ts` - Service methods
- `src/modules/shared/master-data/master-data.module.ts` - Module configuration
- `src/shared/infrastructure/external/external.module.ts` - PPBApiService export
- `src/shared/infrastructure/database/database.module.ts` - Entity registration
- Server startup logs - For runtime errors


