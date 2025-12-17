# PPB Product Catalog Sync

## Overview

The system now syncs products from the **PPB Terminology API** (`https://terminology-api.liviaapp.net/terminology/v1/product`) into the local `products` table. This sync happens:

1. **Automatically**: Every night at 2:00 AM (Nairobi time) via scheduled cron job
2. **Manually**: Via API endpoint `/api/regulator/products/sync`

## Architecture

### Components

1. **PPBApiService** (`src/shared/infrastructure/external/ppb-api.service.ts`)
   - Handles HTTP requests to PPB Terminology API
   - Supports pagination (fetches page by page)
   - Handles different API response formats

2. **PPBProductSyncService** (`src/modules/regulator/products/ppb-product-sync.service.ts`)
   - Orchestrates the sync process
   - Normalizes API data to Product entity format
   - Performs upsert operations (insert new, update existing)
   - Creates system user for products if needed

3. **PPBProductSyncSchedulerService** (`src/modules/regulator/products/ppb-product-sync-scheduler.service.ts`)
   - Scheduled cron job for nightly sync
   - Runs at 2:00 AM Nairobi time

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# PPB Terminology API Configuration
PPB_TERMINOLOGY_API_URL=https://terminology-api.liviaapp.net/terminology/v1
PPB_TERMINOLOGY_API_TOKEN=KUxQ6heclTEtZOiB8rJwhtwmfoW9OUDYawov0t8xzjeTF6oahc3BKpBHHDoGtfwq
```

**Note**: The token is currently hardcoded as a fallback, but should be moved to environment variables for production.

## API Endpoints

### 1. Manual Sync

**POST** `/api/regulator/products/sync`

Triggers a full sync from PPB Terminology API. Fetches all products page by page and upserts them.

**Response:**
```json
{
  "inserted": 150,
  "updated": 50,
  "errors": 2,
  "total": 202
}
```

**Note**: This can take several minutes for large product catalogs.

### 2. Sync Statistics

**GET** `/api/regulator/products/sync/stats`

Returns statistics about synced products.

**Response:**
```json
{
  "total": 1000,
  "enabled": 950,
  "disabled": 50,
  "lastSync": "2025-01-15T02:00:00.000Z"
}
```

## How It Works

### Sync Process

1. **Fetch Products**: Calls PPB Terminology API page by page (100 products per page)
2. **Normalize Data**: Converts API response to Product entity format:
   - `productName`: From `brand_display_name` or `generic_display_name`
   - `brandName`: From `brand_name` or `generic_name`
   - `gtin`: From `GTIN` or `gtin` field
3. **Upsert Logic**:
   - If product exists (by GTIN): Updates `productName`, `brandName`, sets `isEnabled = true`
   - If product is new: Creates new record with system user ID
4. **Error Handling**: Continues processing even if individual products fail

### Data Normalization

The sync service handles various API response formats:

```typescript
// API Response Fields → Product Entity
brand_display_name → productName
generic_display_name → productName (fallback)
brand_name → brandName
generic_name → brandName (fallback)
GTIN / gtin → gtin
```

### System User

Products require a `userId`. The sync service automatically creates/uses a system user:
- Email: `ppb-system@kenya-tnt.gov`
- Organization: `PPB - Pharmacy and Poisons Board`
- Role: `dha` (regulator)

## Scheduled Sync

The nightly sync runs automatically via cron job:

- **Schedule**: `0 0 2 * * *` (Every day at 2:00 AM)
- **Time Zone**: `Africa/Nairobi`
- **Job Name**: `ppb-daily-product-sync`

Logs are written to the application logs showing:
- Number of products fetched
- Number inserted/updated
- Any errors encountered

## API Response Format Handling

The service handles multiple API response formats:

1. **Array Response**: `[{product1}, {product2}, ...]`
2. **Object with Array**: `{products: [...], total: 1000}`
3. **Object with Data**: `{data: [...], count: 1000}`

If the API uses different pagination parameters (e.g., `offset`/`limit` instead of `page`/`limit`), update the `getTerminologyProducts` method in `PPBApiService`.

## Troubleshooting

### Sync Fails

1. Check API token is valid
2. Verify API URL is accessible
3. Check logs for specific error messages
4. Ensure database connection is working

### Products Not Appearing

1. Check if sync completed successfully (check logs)
2. Verify products have valid GTINs (required for upsert)
3. Check `products` table directly: `SELECT * FROM products ORDER BY created_at DESC LIMIT 10;`

### Rate Limiting

The service includes a 100ms delay between page requests to avoid rate limiting. If you encounter rate limits:

1. Increase delay in `getAllTerminologyProducts` method
2. Reduce `limit` per page
3. Contact PPB API administrators for rate limit information

## Testing

### Manual Sync Test

```bash
curl -X POST http://localhost:3000/api/regulator/products/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Sync Stats

```bash
curl -X GET http://localhost:3000/api/regulator/products/sync/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

- [ ] Add incremental sync (only fetch updated products)
- [ ] Add webhook support for real-time updates
- [ ] Add sync history/audit log
- [ ] Add retry logic for failed products
- [ ] Add sync progress tracking for long-running syncs
- [ ] Support filtering by date range or product category

