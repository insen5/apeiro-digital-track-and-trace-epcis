#!/bin/bash

# Script to send test messages to Kafka topics
# Usage: ./test-kafka-messages.sh

KAFKA_BROKER=${KAFKA_BROKER:-"localhost:9092"}

echo "Sending test messages to Kafka topics..."
echo "Kafka Broker: $KAFKA_BROKER"
echo ""

# Check if kafka-console-producer is available
if command -v kafka-console-producer.sh &> /dev/null; then
    PRODUCER_CMD="kafka-console-producer.sh"
elif docker exec openepcis-kafka kafka-console-producer.sh --version &> /dev/null; then
    PRODUCER_CMD="docker exec -i openepcis-kafka kafka-console-producer.sh"
else
    echo "Error: kafka-console-producer.sh not found. Please install Kafka CLI tools or ensure Docker container is running."
    exit 1
fi

# Function to send message to topic
send_message() {
    local topic=$1
    local message=$2
    echo "Sending to topic: $topic"
    echo "$message" | $PRODUCER_CMD --bootstrap-server $KAFKA_BROKER --topic $topic 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Message sent successfully"
    else
        echo "✗ Failed to send message"
    fi
    echo ""
}

# Test PPB Batch Data (3 messages)
echo "=== Sending PPB Batch Data ==="
send_message "ppb.batch.data" '{
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
}'

send_message "ppb.batch.data" '{
  "gtin": "61640056789013",
  "product_name": "Amoxicillin 250mg Capsules",
  "product_code": "PH112A",
  "batch": {
    "batch_number": "BATCH-AMOXICILLIN-002",
    "status": "active",
    "expiration_date": "2026-12-31",
    "manufacture_date": "2024-12-15",
    "permit_id": "18906",
    "consignment_ref_number": "CRN-2024-0002",
    "Approval_Status": "True",
    "Approval_DateStamp": "2025-01-15 10:30:00 (UTC+03:00)",
    "quantities": {
      "declared_total": 5000,
      "declared_sent": 5000
    }
  },
  "serialization": {
    "range": ["SN-AMOX-001 - SN-AMOX-5000"],
    "is_partial_approval": false
  },
  "parties": {
    "manufacturer": {
      "name": "Cosmos Pharmaceuticals Ltd",
      "gln": "6164004000007"
    },
    "manufacturing_site": {
      "sgln": "urn:epc:id:sgln:6164004.00002.0",
      "label": "Cosmos Manufacturing Plant"
    },
    "importer": {
      "name": "HealthSup Distributors Ltd",
      "country": "KE",
      "gln": "7351002000000"
    }
  },
  "logistics": {
    "carrier": "FedEx",
    "origin": "Delhi, India",
    "port_of_entry": "Mombasa Port – Berth 5",
    "final_destination_sgln": "urn:epc:id:sgln:7351002.00001.0",
    "final_destination_address": "Nairobi, Kenya"
  }
}'

send_message "ppb.batch.data" '{
  "gtin": "61640056789014",
  "product_name": "Paracetamol 500mg Tablets",
  "product_code": "PH113B",
  "batch": {
    "batch_number": "BATCH-PARACETAMOL-003",
    "status": "active",
    "expiration_date": "2028-06-30",
    "manufacture_date": "2025-06-01",
    "permit_id": "18907",
    "consignment_ref_number": "CRN-2024-0003",
    "Approval_Status": "True",
    "Approval_DateStamp": "2025-06-10 14:20:00 (UTC+03:00)",
    "quantities": {
      "declared_total": 15000,
      "declared_sent": 12000
    }
  },
  "serialization": {
    "range": ["SN-PARA-001 - SN-PARA-5000", "SN-PARA-5001 - SN-PARA-10000", "SN-PARA-10001 - SN-PARA-15000"],
    "is_partial_approval": true
  },
  "parties": {
    "manufacturer": {
      "name": "Universal Pharmaceuticals Kenya Ltd",
      "gln": "6164005000004"
    },
    "manufacturing_site": {
      "sgln": "urn:epc:id:sgln:6164005.00001.0",
      "label": "Universal Pharmaceuticals HQ"
    },
    "importer": {
      "name": "MediCare Pharmaceuticals Kenya",
      "country": "KE",
      "gln": "6164001000006"
    }
  },
  "logistics": {
    "carrier": "UPS",
    "origin": "Mumbai, India",
    "port_of_entry": "Mombasa Port – Berth 8",
    "final_destination_sgln": "urn:epc:id:sgln:6164001.00001.0",
    "final_destination_address": "Nairobi, Kenya"
  }
}'

# Test Manufacturer Data (2 messages)
echo "=== Sending Manufacturer Data ==="
send_message "manufacturer.data" '{
  "entityId": "MFG-001",
  "legalEntityName": "Cosmos Pharmaceuticals Ltd",
  "actorType": "manufacturer",
  "roles": ["Pharmaceutical Manufacturer", "MAH"],
  "ownershipType": "PRIVATE COMPANY (LIMITED)",
  "identifiers": {
    "ppbLicenseNumber": "PPB/MFG/001/2025",
    "ppbCode": "PPB-MFG-001",
    "gs1Prefix": "61640040",
    "legalEntityGLN": "6164004000007"
  },
  "hq": {
    "name": "Cosmos Pharmaceuticals Manufacturing Plant",
    "gln": "6164004000007",
    "location": {
      "addressLine1": "Thika Road",
      "addressLine2": "Industrial Area",
      "county": "Kiambu",
      "constituency": "Thika",
      "ward": "Thika Town",
      "postalCode": "01000",
      "country": "KE"
    }
  },
  "contact": {
    "contactPersonName": "Dr. James Kariuki",
    "contactPersonTitle": "Manufacturing Director",
    "email": "manufacturing@cosmospharma.co.ke",
    "phone": "+254720111222",
    "website": "https://www.cosmospharma.co.ke"
  },
  "status": "Active"
}'

send_message "manufacturer.data" '{
  "entityId": "MFG-002",
  "legalEntityName": "Universal Pharmaceuticals Kenya Ltd",
  "actorType": "manufacturer",
  "roles": ["Pharmaceutical Manufacturer", "MAH"],
  "ownershipType": "PRIVATE COMPANY (LIMITED)",
  "identifiers": {
    "ppbLicenseNumber": "PPB/MFG/002/2025",
    "ppbCode": "PPB-MFG-002",
    "gs1Prefix": "61640050",
    "legalEntityGLN": "6164005000004"
  },
  "hq": {
    "name": "Universal Pharmaceuticals HQ",
    "gln": "6164005000004",
    "location": {
      "addressLine1": "Mombasa Road",
      "addressLine2": "Athi River Industrial Park",
      "county": "Machakos",
      "constituency": "Athi River",
      "ward": "Athi River",
      "postalCode": "00204",
      "country": "KE"
    }
  },
  "contact": {
    "contactPersonName": "Dr. Mary Wanjala",
    "contactPersonTitle": "Quality Assurance Manager",
    "email": "qa@universalpharma.co.ke",
    "phone": "+254721222333",
    "website": "https://www.universalpharma.co.ke"
  },
  "status": "Active"
}'

# Test Supplier Data (2 messages)
echo "=== Sending Supplier Data ==="
send_message "supplier.data" '{
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
  ],
  "status": "Active"
}'

send_message "supplier.data" '{
  "entityId": "SUP-002",
  "legalEntityName": "MediCare Pharmaceuticals Kenya",
  "actorType": "supplier",
  "roles": ["National Distributor"],
  "ownershipType": "PRIVATE COMPANY (LIMITED)",
  "identifiers": {
    "ppbLicenseNumber": "PPB/WHL/015/2025",
    "ppbCode": "PPB-SUP-002",
    "gs1Prefix": "61640010",
    "legalEntityGLN": "6164001000006"
  },
  "hq": {
    "name": "MediCare HQ",
    "gln": "6164001000006",
    "location": {
      "addressLine1": "Westlands Business Park",
      "addressLine2": "Waiyaki Way",
      "county": "Nairobi",
      "constituency": "Westlands",
      "ward": "Westlands",
      "postalCode": "00100",
      "country": "KE"
    }
  },
  "contact": {
    "contactPersonName": "Peter Kamau",
    "contactPersonTitle": "Operations Director",
    "email": "info@medicarepharma.co.ke",
    "phone": "+254722333444",
    "website": "https://www.medicarepharma.co.ke"
  },
  "status": "Active"
}'

# Test Premise Data (3 messages)
echo "=== Sending Premise Data ==="
send_message "premise.data" '{
  "premiseId": "SUP-001-WH2",
  "legacyPremiseId": 34014,
  "premiseName": "LIBWOB CHEMIST",
  "gln": "7351002000200",
  "businessType": "RETAIL",
  "premiseClassification": "RETAIL PHARMACY",
  "ownership": "SOLE PROPRIETOR",
  "superintendent": {
    "name": "KIPLAGAT K AMON",
    "cadre": "PHARMTECH",
    "registrationNumber": 11363
  },
  "license": {
    "ppbLicenseNumber": "PPB/RET/001/2025",
    "validUntil": "2025-12-31",
    "validityYear": 2025,
    "status": "Active"
  },
  "location": {
    "addressLine1": "Main Street",
    "county": "Uasin Gishu",
    "constituency": "TURBO",
    "ward": "KAMAGUT",
    "postalCode": "30100",
    "country": "KE"
  },
  "status": "Active",
  "supplierEntityId": "SUP-001"
}'

send_message "premise.data" '{
  "premiseId": "MFG-001-MFG",
  "legacyPremiseId": 33079,
  "premiseName": "Cosmos Manufacturing Plant - Thika",
  "gln": "6164004000008",
  "businessType": "MANUFACTURING",
  "premiseClassification": "MANUFACTURING FACILITY",
  "ownership": "PRIVATE COMPANY (LIMITED)",
  "superintendent": {
    "name": "Dr. James Kariuki",
    "cadre": "PHARMACIST",
    "registrationNumber": 5001
  },
  "license": {
    "ppbLicenseNumber": "PPB/MFG/001/2025-MFG",
    "validUntil": "2026-12-31",
    "validityYear": 2026,
    "status": "Active"
  },
  "location": {
    "addressLine1": "Thika Road",
    "addressLine2": "Industrial Area",
    "county": "Kiambu",
    "constituency": "Thika",
    "ward": "Thika Town",
    "postalCode": "01000",
    "country": "KE"
  },
  "status": "Active",
  "supplierEntityId": "MFG-001"
}'

send_message "premise.data" '{
  "premiseId": "SUP-002-WH1",
  "legacyPremiseId": 34015,
  "premiseName": "MediCare Warehouse - Westlands",
  "gln": "6164001000100",
  "businessType": "WHOLESALE",
  "premiseClassification": "WAREHOUSE/DISTRIBUTION",
  "ownership": "PRIVATE COMPANY (LIMITED)",
  "superintendent": {
    "name": "Peter Kamau",
    "cadre": "PHARMACIST",
    "registrationNumber": 5002
  },
  "license": {
    "ppbLicenseNumber": "PPB/WHL/015/2025-WH1",
    "validUntil": "2025-12-31",
    "validityYear": 2025,
    "status": "Active"
  },
  "location": {
    "addressLine1": "Westlands Business Park",
    "addressLine2": "Waiyaki Way",
    "county": "Nairobi",
    "constituency": "Westlands",
    "ward": "Westlands",
    "postalCode": "00100",
    "country": "KE"
  },
  "status": "Active",
  "supplierEntityId": "SUP-002"
}'

echo "=== Test Messages Sent ==="
echo "Total messages sent:"
echo "  - PPB Batch Data: 3"
echo "  - Manufacturer Data: 2"
echo "  - Supplier Data: 2"
echo "  - Premise Data: 3"
echo ""
echo "Total: 10 messages"
echo ""
echo "Check your application logs to see if messages were processed successfully."


