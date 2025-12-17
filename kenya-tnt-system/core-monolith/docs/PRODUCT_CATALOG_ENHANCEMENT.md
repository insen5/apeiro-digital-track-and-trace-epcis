# Product Catalog Enhancement

## Overview

The product catalog has been enhanced to store and display all fields from the PPB Terminology API response. This includes additional product metadata, KEML information, programs, and manufacturers.

## Database Schema Changes

### 1. Enhanced Products Table

The `products` table has been extended with the following columns:

#### Basic Identifiers
- `etcd_product_id` (VARCHAR(100), UNIQUE) - ETCD Product ID from PPB Terminology API
- `generic_concept_id` (INTEGER) - Generic concept identifier
- `generic_concept_code` (VARCHAR(50)) - Generic concept code (e.g., GE10547)
- `ppb_registration_code` (VARCHAR(100)) - PPB registration code (e.g., PPB/CTD1811/027)

#### Display Names
- `brand_display_name` (VARCHAR(500)) - Brand display name with strength and form
- `generic_display_name` (VARCHAR(500)) - Generic display name with strength and form
- `generic_name` (VARCHAR(255)) - Generic name without strength/form

#### Strength and Form
- `strength_amount` (VARCHAR(50)) - Product strength amount (e.g., "600/300")
- `strength_unit` (VARCHAR(50)) - Strength unit (e.g., "mg/mg", "mg")
- `route_description` (VARCHAR(100)) - Administration route (e.g., "Oral", "IV")
- `route_id` (INTEGER) - Route identifier
- `route_code` (VARCHAR(50)) - Route code (e.g., RT10025)
- `form_description` (VARCHAR(100)) - Dosage form (e.g., "Tablet", "Capsule")
- `form_id` (INTEGER) - Form identifier
- `form_code` (VARCHAR(50)) - Form code (e.g., DF10501)

#### Active Component
- `active_component_id` (INTEGER) - Active component identifier
- `active_component_code` (VARCHAR(50)) - Active component code (e.g., AC11652)

#### Status and Metadata
- `level_of_use` (VARCHAR(10)) - Level of use classification (1-3)
- `keml_status` (VARCHAR(10)) - KEML status (Yes/No)
- `updation_date` (TIMESTAMP) - Last update date from PPB Terminology API

#### KEML Info
- `keml_is_on_keml` (BOOLEAN) - Whether product is on Kenya Essential Medicines List
- `keml_category` (VARCHAR(100)) - KEML category (e.g., "Essential Medicine")
- `keml_drug_class` (VARCHAR(100)) - Drug class (e.g., "Antiretroviral Combination")

#### Formulary
- `formulary_included` (BOOLEAN) - Whether product is included in formulary

### 2. Relational Tables

#### product_programs (Many-to-Many)
Stores the relationship between products and programs (e.g., Essential Commodities, ARV).

**Columns:**
- `id` (SERIAL PRIMARY KEY)
- `product_id` (INTEGER, FK to products)
- `program_code` (VARCHAR(50)) - Program code (e.g., "ESSENTIAL", "ARV")
- `program_name` (VARCHAR(255)) - Program name (e.g., "Essential Commodities")
- `created_at` (TIMESTAMP)

**Unique Constraint:** `(product_id, program_code)`

#### product_manufacturers (Many-to-Many)
Stores the relationship between products and manufacturers.

**Columns:**
- `id` (SERIAL PRIMARY KEY)
- `product_id` (INTEGER, FK to products)
- `manufacturer_entity_id` (VARCHAR(100)) - Manufacturer entity ID (e.g., "MFG-001")
- `manufacturer_name` (VARCHAR(255)) - Manufacturer name (e.g., "KEM Pharma Ltd")
- `created_at` (TIMESTAMP)

**Unique Constraint:** `(product_id, manufacturer_entity_id)`

## Migration

Run the migration script to add the new columns and tables:

```bash
psql -U tnt_user -d kenya_tnt_db -f database/migrations/enhance_products_table.sql
```

## Entity Updates

### Product Entity (`product.entity.ts`)

The Product entity now includes:
- All new fields from PPB Terminology API
- Relations to `ProductProgram` and `ProductManufacturer` entities
- Proper TypeORM decorators and indexes

### New Entities

1. **ProductProgram** (`product-program.entity.ts`)
   - Represents product-program relationships
   - Many-to-many with Product

2. **ProductManufacturer** (`product-manufacturer.entity.ts`)
   - Represents product-manufacturer relationships
   - Many-to-many with Product

## Sync Service Updates

The `PPBProductSyncService` has been updated to:
- Populate all new fields from PPB Terminology API response
- Handle programs_mapping array (creates ProductProgram records)
- Handle manufacturers array (creates ProductManufacturer records)
- Update existing products with new data on each sync

### Normalization Logic

The `normalizeProduct` method maps API response fields to entity fields:

```typescript
API Field → Entity Field
- etcd_product_id → etcdProductId
- brand_display_name → brandDisplayName
- generic_display_name → genericDisplayName
- keml.is_on_keml → kemlIsOnKeml
- keml.keml_category → kemlCategory
- keml.drug_class → kemlDrugClass
- programs_mapping[] → ProductProgram[] (via updateProductPrograms)
- manufacturers[] → ProductManufacturer[] (via updateProductManufacturers)
```

## Frontend Updates

### API Types

The `Product` interface has been extended with all new fields:

```typescript
export interface Product {
  // ... existing fields
  etcdProductId?: string;
  ppbRegistrationCode?: string;
  brandDisplayName?: string;
  genericDisplayName?: string;
  strengthAmount?: string;
  strengthUnit?: string;
  routeDescription?: string;
  formDescription?: string;
  kemlIsOnKeml: boolean;
  kemlCategory?: string;
  kemlDrugClass?: string;
  formularyIncluded: boolean;
  programs?: ProductProgram[];
  manufacturers?: ProductManufacturer[];
  // ... more fields
}
```

### Product Catalog Display

The Product Catalog page now displays:
- **Product Name Column**: Shows brand display name, generic display name, strength, form, and route
- **GTIN / PPB Code Column**: Shows GTIN, PPB registration code, and ETCD product ID
- **KEML / Programs Column**: Shows KEML status, category, programs, and formulary inclusion
- **Manufacturers Column**: Shows all manufacturers with entity IDs

## Seed Data

Sample seed data is available in `database/seed_enhanced_products.sql`:

- 3 sample products with full PPB catalog data
- Product programs (Essential Commodities, ARV)
- Product manufacturers (KEM Pharma Ltd, Apex Pharmaceuticals)

To seed:
```bash
psql -U tnt_user -d kenya_tnt_db -f database/seed_enhanced_products.sql
```

## API Response Example

When fetching products, the API now returns:

```json
{
  "id": 1,
  "etcdProductId": "PH11231",
  "ppbRegistrationCode": "PPB/CTD1811/027",
  "productName": "Abacavir And Lamivudine 600 mg/300 mg Oral Tablet",
  "brandDisplayName": "Abacavir And Lamivudine 600 mg/300 mg Oral Tablet",
  "genericDisplayName": "Abacavir 600 mg/Lamivudine 300 mg Oral Tablet",
  "brandName": "Abacavir And Lamivudine",
  "genericName": "Abacavir/Lamivudine",
  "gtin": "213123",
  "strengthAmount": "600/300",
  "strengthUnit": "mg/mg",
  "routeDescription": "Oral",
  "formDescription": "Tablet",
  "kemlIsOnKeml": true,
  "kemlCategory": "Essential Medicine",
  "kemlDrugClass": "Antiretroviral Combination",
  "formularyIncluded": true,
  "programs": [
    {
      "id": 1,
      "programCode": "ESSENTIAL",
      "programName": "Essential Commodities"
    },
    {
      "id": 2,
      "programCode": "ARV",
      "programName": "ARV"
    }
  ],
  "manufacturers": [
    {
      "id": 1,
      "manufacturerEntityId": "MFG-001",
      "manufacturerName": "KEM Pharma Ltd"
    }
  ],
  "isEnabled": true,
  "createdAt": "2025-11-11T18:46:13.018Z",
  "updatedAt": "2025-11-11T18:46:13.018Z"
}
```

## Indexes

The following indexes have been added for performance:

- `idx_products_etcd_product_id` - On etcd_product_id
- `idx_products_ppb_registration_code` - On ppb_registration_code
- `idx_products_generic_concept_id` - On generic_concept_id
- `idx_products_brand_display_name` - On brand_display_name
- `idx_products_generic_display_name` - On generic_display_name
- `idx_products_keml_status` - On keml_status
- `idx_products_formulary_included` - On formulary_included
- `idx_product_programs_product_id` - On product_programs.product_id
- `idx_product_programs_code` - On product_programs.program_code
- `idx_product_manufacturers_product_id` - On product_manufacturers.product_id
- `idx_product_manufacturers_entity_id` - On product_manufacturers.manufacturer_entity_id

## Notes

1. **GTIN vs etcd_product_id**: The system uses GTIN as the primary unique identifier. If GTIN is not available, `etcd_product_id` is used as a fallback.

2. **Programs and Manufacturers**: These are stored in separate tables to support many-to-many relationships. A product can have multiple programs and multiple manufacturers.

3. **KEML Status**: The `keml_is_on_keml` field is derived from `keml.is_on_keml` in the API response, or from `keml_status === 'Yes'`.

4. **Sync Behavior**: On each sync, existing products are updated with new data, and programs/manufacturers are replaced (deleted and recreated) to match the API response.

5. **Nullable Fields**: Most new fields are nullable to handle cases where the API doesn't provide certain information.

## Future Enhancements

- [ ] Add search/filter by KEML category
- [ ] Add search/filter by program
- [ ] Add search/filter by manufacturer
- [ ] Add product detail modal/page with all fields
- [ ] Add export functionality with all fields
- [ ] Add analytics based on KEML status, programs, etc.

