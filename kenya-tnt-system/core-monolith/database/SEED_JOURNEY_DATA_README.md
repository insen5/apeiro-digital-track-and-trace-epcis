# Journey Tracking Seed Data

This script creates sample data for testing journey tracking by SSCC and batch flow visualization.

## What It Creates

1. **Users**:
   - 2 Manufacturers (Port + Manufacturing)
   - 3 Distributors
   - 5 Facilities

2. **Shipments**:
   - 1 Main shipment (SSCC: `123456789012345678`) from manufacturer
   - 5 Child shipments to facilities

3. **EPCIS Events**:
   - Complete journey timeline events
   - Batch flow events for Sankey diagram visualization

## How to Run

```bash
# From the core-monolith directory
cd kenya-tnt-system/core-monolith

# Run the seed script
psql -U tnt_user -d kenya_tnt_db -f database/seed-journey-data.sql

# Or if using Docker
docker exec -i kenya-tnt-db psql -U tnt_user -d kenya_tnt_db < database/seed-journey-data.sql
```

## Test Data

### SSCC Journey Tracking
- **Test SSCC**: `123456789012345678`
- This SSCC has a complete journey from manufacturer → distributor → facilities
- Events are stored in `epcis_events` and `epcis_event_epcs` tables

### Consignment Flow Visualization
- **Test Consignment**: `CONS-2025-001`
- Shows flow from port → 3 distributors → 5 facilities
- Perfect for Sankey diagram visualization
- Note: Uses consignmentID (not batch number) since a batch can appear in multiple consignments

## API Endpoints

### SSCC Journey Tracking
```bash
POST /api/analytics/journey/by-sscc
Body: { "sscc": "123456789012345678" }
```

### Consignment Flow
```bash
POST /api/analytics/journey/consignment-flow
Body: { "consignmentID": "CONS-2025-001" }
```

## Frontend Usage

1. Navigate to `/regulator/journey`
2. **SSCC Tab**: Enter `123456789012345678` to see event timeline
3. **Consignment Flow Tab**: Enter `CONS-2025-001` to see Sankey diagram

## Database Tables Used

- `users` - Actor information
- `shipment` - Shipment data
- `epcis_events` - EPCIS event timeline
- `epcis_event_epcs` - EPC to event mapping (indexed for fast lookups)
- `batches` - Batch information

## Notes

- The seed script uses `ON CONFLICT DO NOTHING` to avoid duplicates
- Run multiple times safely
- Events are timestamped to show realistic timeline
- All events include actor context (actor_user_id, actor_organization, etc.)

