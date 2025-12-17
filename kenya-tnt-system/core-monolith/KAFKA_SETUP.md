# Kafka Consumer Setup

## Overview

The system uses Kafka to consume real-time data from PPB (Pharmacy and Poisons Board) via Kafka topics. The consumer handles multiple topics and routes messages to appropriate services.

## Topics

The system consumes from the following Kafka topics:

- `ppb.batch.data` - PPB batch approval data
- `manufacturer.data` - Manufacturer master data
- `premise.data` - Premise (warehouse/facility) master data
- `supplier.data` - Supplier master data

## Environment Variables

Add the following to your `.env` file:

```env
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CONSUMER_GROUP_ID=ppb-master-data-consumer-group
```

### Configuration Details

- **KAFKA_BROKERS**: Comma-separated list of Kafka broker addresses (e.g., `localhost:9092` or `kafka1:9092,kafka2:9092`)
- **KAFKA_CONSUMER_GROUP_ID**: Consumer group ID for Kafka consumer (default: `ppb-master-data-consumer-group`)

## Architecture

```
Kafka Topics
    ↓
MultiTopicConsumerService (NestJS)
    ↓
    ├──► PPBBatchService (for ppb.batch.data)
    ├──► MasterDataService (for manufacturer.data, supplier.data, premise.data)
    ↓
PostgreSQL Database
```

## Message Formats

### PPB Batch Data

```json
{
  "gtin": "61640056789012",
  "product_name": "Metformin 500mg Tablets",
  "product_code": "PH111D",
  "batch": {
    "batch_number": "BATCH-METFORMIN-001",
    "status": "active",
    "expiration_date": "2027-09-16",
    "manufacture_date": "2027-07-07",
    "permit_id": "18905",
    "consignment_ref_number": "CRN-2024-0001",
    "Approval_Status": "True",
    "Approval_DateStamp": "2025-11-21 16:49:00 (UTC+04:00 Abu Dhabi time)",
    "quantities": {
      "declared_total": 10000,
      "declared_sent": 8000
    }
  },
  "serialization": {
    "range": ["SN-METFORMIN-001 - SN-METFORMIN-1000", "SN-METFORMIN-1001 - SN-METFORMIN-2000"],
    "is_partial_approval": false
  },
  "parties": {
    "manufacturer": {
      "name": "KEM Pharma Ltd",
      "gln": "urn:epc:id:sgln:7894500.00001.0"
    },
    "manufacturing_site": {
      "sgln": "urn:epc:id:sgln:7894500.00002.0",
      "label": "Kiambu Manufacturing Facility"
    },
    "importer": {
      "name": "Pharma Imports Ltd",
      "country": "KE",
      "gln": "urn:epc:id:sgln:1234567.00001.0"
    }
  },
  "logistics": {
    "carrier": "DHL",
    "origin": "Mumbai, India",
    "port_of_entry": "Mombasa Port – Berth 11",
    "final_destination_sgln": "urn:epc:id:sgln:1234567.00002.0",
    "final_destination_address": "Nairobi, Kenya"
  }
}
```

### Manufacturer/Supplier Data

```json
{
  "entityId": "SUP-001",
  "legalEntityName": "HealthSup Distributors Ltd",
  "actorType": "supplier",
  "roles": ["National Distributor", "Wholesaler"],
  "ownershipType": "PRIVATE COMPANY (LIMITED)",
  "identifiers": {
    "ppbLicenseNumber": "PPB/WHL/002/2025",
    "ppbCode": "PPB-SUP-001",
    "gs1Prefix": "73510020",
    "legalEntityGLN": "7351002000000"
  },
  "hq": {
    "name": "HealthSup HQ",
    "gln": "7351002000000",
    "location": {
      "addressLine1": "Plot 23, Industrial Area",
      "addressLine2": "Off Enterprise Road",
      "county": "Nairobi",
      "constituency": "Starehe",
      "ward": "Industrial Area",
      "postalCode": "00500",
      "country": "KE"
    }
  },
  "contact": {
    "contactPersonName": "Jane Mwangi",
    "contactPersonTitle": "Supply Chain Manager",
    "email": "operations@healthsup.co.ke",
    "phone": "+254710111222",
    "website": "https://www.healthsup.co.ke"
  },
  "premises": [
    {
      "premiseId": "SUP-001-WH1",
      "legacyPremiseId": 33078,
      "premiseName": "Central Distribution Warehouse",
      "gln": "7351002000100",
      "businessType": "WHOLESALE",
      "premiseClassification": "WAREHOUSE/DISTRIBUTION",
      "ownership": "PRIVATE COMPANY (LIMITED)",
      "superintendent": {
        "name": "DANIEL BARASA WAFULA",
        "cadre": "PHARMACIST",
        "registrationNumber": 3237
      },
      "license": {
        "ppbLicenseNumber": "PPB/WHL/002/2025-WH1",
        "validUntil": "2025-12-31",
        "validityYear": 2025,
        "status": "Active"
      },
      "location": {
        "addressLine1": "North Airport Road",
        "county": "Nairobi",
        "constituency": "Embakasi North",
        "ward": "Embakasi",
        "postalCode": "00501"
      },
      "status": "Active"
    }
  ]
}
```

## Debezium/CDC Support

The consumer supports multiple message formats:

1. **Direct JSON**: Messages in the format shown above
2. **Debezium CDC**: Messages with `schema` and `payload` structure
3. **JDBC Connector**: Messages with `key` and `value` structure

The consumer automatically detects and transforms the message format.

## Database Migration

Run the migration to create the `ppb_batches` table:

```bash
cd kenya-tnt-system/core-monolith
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -f database/migrations/V3__Create_PPB_Batch_Tables.sql
```

Or using Docker:

```bash
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/V3__Create_PPB_Batch_Tables.sql
```

## API Endpoints

### Regulator Endpoints

- `GET /api/regulator/ppb-batches` - Get all PPB batches (with pagination)
- `GET /api/regulator/ppb-batches/:id` - Get PPB batch by ID

### Manufacturer Endpoints

- `GET /api/manufacturer/ppb-batches` - Get PPB approved batches for logged-in manufacturer
- `GET /api/manufacturer/ppb-batches/:id` - Get PPB batch by ID (for manufacturer)

## Troubleshooting

### Consumer Not Starting

1. Check Kafka broker connectivity:
   ```bash
   telnet localhost 9092
   ```

2. Verify topics exist:
   ```bash
   kafka-topics.sh --list --bootstrap-server localhost:9092
   ```

3. Check application logs for connection errors

### Messages Not Processing

1. Check consumer group status:
   ```bash
   kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group ppb-master-data-consumer-group --describe
   ```

2. Verify message format matches expected structure

3. Check database connection and table existence

### Error Handling

- Failed messages are logged with full error details
- Batches with processing errors are marked with `processed_status = 'ERROR'`
- Consider implementing a dead letter queue for persistent failures

## Testing

To test the consumer manually:

1. Start the application
2. Send a test message to Kafka topic:
   ```bash
   kafka-console-producer.sh --broker-list localhost:9092 --topic ppb.batch.data
   ```
3. Paste JSON message and press Enter
4. Check application logs for processing confirmation
5. Verify data in database


