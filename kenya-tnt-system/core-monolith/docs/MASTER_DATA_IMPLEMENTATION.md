# Master Data Implementation

## Overview

This document describes the master data layer implementation for the Kenya TNT System. The master data provides centralized configuration for suppliers, premises (warehouses/distribution centers), and logistics service providers (LSPs), accessible to all users.

## Database Schema

### Tables Created

1. **`suppliers`** - Master data for suppliers/manufacturers
   - Entity ID, legal entity name, actor type, roles
   - HQ location with GLN
   - Contact information
   - PPB identifiers (license number, code, GS1 prefix, GLN)

2. **`premises`** - Master data for supplier premises (warehouses, distribution centers)
   - Premise ID, name, GLN
   - Business type, classification
   - License information
   - Location details (address, county, constituency, ward)
   - Linked to supplier

3. **`logistics_providers`** - Master data for logistics service providers (carriers)
   - LSP ID, name
   - Legal entity information (registration, permit, license)
   - Contact information
   - HQ location
   - Identifiers (GLN, GS1 prefix, PPB code)

### Shipment Table Updates

The `shipment` table now includes foreign key references:
- `supplier_id` - References supplier (customer)
- `premise_id` - References premise (pickup/destination location)
- `logistics_provider_id` - References logistics provider (carrier)

Legacy text fields (`customer`, `pickupLocation`, `destinationAddress`, `carrier`) are retained for backward compatibility.

## API Endpoints

### Master Data Endpoints

- `GET /api/master-data/suppliers` - Get all suppliers (with pagination and search)
- `GET /api/master-data/suppliers/:id` - Get supplier by ID
- `GET /api/master-data/premises` - Get all premises (with pagination, search, and optional supplier filter)
- `GET /api/master-data/premises/:id` - Get premise by ID
- `GET /api/master-data/logistics-providers` - Get all logistics providers (with pagination and search)
- `GET /api/master-data/logistics-providers/:id` - Get logistics provider by ID

### Shipment Endpoints (Updated)

The `POST /api/manufacturer/shipments` endpoint now accepts:
- `supplierId` (optional) - Instead of `customer` text
- `premiseId` (optional) - Instead of `pickupLocation` and `destinationAddress` text
- `logisticsProviderId` (optional) - Instead of `carrier` text

Legacy fields are still supported for backward compatibility.

## Frontend Implementation

### Components Created

1. **`SearchableSelect`** - A searchable dropdown component
   - Supports search/filter
   - Displays label and subtitle
   - Handles loading states
   - Supports async search (via `onSearch` callback)

2. **Master Data API Client** (`lib/api/master-data.ts`)
   - TypeScript interfaces for Supplier, Premise, LogisticsProvider
   - API methods for fetching master data with pagination and search

### Shipment Form Updates

The shipment creation form now uses:
- Searchable dropdown for **Supplier** (customer)
- Searchable dropdown for **Premise** (pickup/destination location)
- Searchable dropdown for **Logistics Provider** (carrier)

All dropdowns support:
- Real-time search
- Pagination (loads more as user scrolls)
- Display of relevant information (name, GLN, location)

## Data Flow

1. **PPB Integration** (Future)
   - PPB will sync master data via API/webhook
   - `MasterDataService.syncFromPPB()` method handles sync
   - Updates existing records or creates new ones

2. **User Selection**
   - User selects supplier, premise, and logistics provider from dropdowns
   - Frontend sends IDs to backend

3. **Backend Processing**
   - Backend resolves IDs to full entity details
   - Populates legacy text fields for backward compatibility
   - Stores both IDs and text in shipment record

## Migration

Run the migration to create master data tables:

```bash
cd kenya-tnt-system/core-monolith
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -f database/migrations/add_master_data_tables.sql
```

Or using Docker:

```bash
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/add_master_data_tables.sql
```

## Future Enhancements

1. **Separate Pickup and Destination Premises**
   - Currently uses same premise for both
   - Can be enhanced to support separate selection

2. **PPB Sync Integration**
   - Scheduled job to sync master data from PPB
   - Webhook endpoint for real-time updates

3. **Master Data Management UI**
   - Admin interface to view/edit master data
   - Manual sync trigger
   - Data validation

4. **Caching**
   - Cache master data for better performance
   - Invalidate on updates

