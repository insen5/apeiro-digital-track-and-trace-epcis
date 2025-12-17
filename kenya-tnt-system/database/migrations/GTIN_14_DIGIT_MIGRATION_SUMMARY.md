# GTIN 14-Digit Standardization Migration

## Migration Details
- **Date**: December 9, 2025
- **Migration File**: `V01__Update_GTINs_To_14_Digits.sql`
- **Database**: `kenya_tnt_db`
- **Table**: `ppb_products`

## Summary

Successfully updated all GTINs in the product catalog to the 14-digit GS1 standard format by prepending a leading "0" to all 13-digit GTINs.

## Before Migration
- **Total products with GTIN**: 41
- **13-digit GTINs**: 24 (58.5%)
- **14-digit GTINs**: 17 (41.5%)

## After Migration
- **Total products with GTIN**: 41
- **13-digit GTINs**: 0 (0%)
- **14-digit GTINs**: 41 (100%)

## Changes Made

### Example Conversions
| Product ID | Original GTIN | New GTIN       | Product Name                    |
|-----------|---------------|----------------|---------------------------------|
| 230       | 8901234567944 | 08901234567944 | Clofen 100 mg Oral Tablet       |
| 451       | 8901234567920 | 08901234567920 | Profen 100 mg Oral Suspension   |
| 978       | 8901234567968 | 08901234567968 | Metronidazole 200 mg Oral Tablet|
| 4926      | 8901234567951 | 08901234567951 | Ciprofloxacin 500 mg Oral Tablet|
| 5533      | 8901234567890 | 08901234567890 | Paracetamol 10 mg Injection     |

## Backup
A backup of all GTINs before migration was created:
- **Location**: `/tmp/gtin_backup_20251209_083431.csv`
- **Contents**: id, gtin, brand_display_name

## Rollback Instructions

If you need to revert this migration (restore 13-digit GTINs), run the rollback script provided in the migration file:

```sql
BEGIN;

-- Remove leading zero from GTINs that were updated
UPDATE ppb_products
SET 
  gtin = SUBSTRING(gtin FROM 2),
  "updatedAt" = NOW()
WHERE 
  gtin IS NOT NULL 
  AND LENGTH(gtin) = 14
  AND SUBSTRING(gtin FROM 1 FOR 1) = '0';

COMMIT;
```

## Verification Queries

### Check GTIN lengths
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN LENGTH(gtin) = 13 THEN 1 END) as thirteen_digit,
  COUNT(CASE WHEN LENGTH(gtin) = 14 THEN 1 END) as fourteen_digit
FROM ppb_products 
WHERE gtin IS NOT NULL;
```

### View all updated GTINs
```sql
SELECT id, gtin, brand_display_name 
FROM ppb_products 
WHERE gtin IS NOT NULL 
ORDER BY id;
```

## Impact Analysis

### Affected Systems
1. **Product Catalog**: All GTIN references in `ppb_products` table
2. **EPCIS Events**: No direct impact (events reference products by ID, not GTIN)
3. **Facility Inventory**: No direct impact (uses product_id foreign key)
4. **Serial Numbers**: No direct impact (uses batch_id foreign key)

### Unchanged Systems
- **batches** table: Does not store GTINs (references products via productId)
- **epcis_events** table: Stores SGTINs which include GTIN but are separate identifiers
- **facility_*** tables: Reference products by ID, not GTIN

## Notes

- GTINs starting with "616400567890XX" were already 14 digits (no change)
- GTINs starting with "890123456XXXX" were updated from 13 to 14 digits
- GTINs starting with "061414112XXXXX" were updated from 13 to 14 digits
- The 14-digit format is the GS1 standard for GTIN-14
- All GTINs maintain their uniqueness (index on gtin column preserved)

## Migration Status

✅ **COMPLETED SUCCESSFULLY**

- All 24 13-digit GTINs updated to 14 digits
- Zero 13-digit GTINs remain in the database
- All 41 products now have valid 14-digit GTINs
- Database constraints and indexes remain intact
- No errors or warnings during migration
