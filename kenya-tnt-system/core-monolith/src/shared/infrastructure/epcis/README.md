# EPCIS Service Abstraction Layer

This module provides a vendor-agnostic interface for interacting with EPCIS services, allowing seamless switching between OpenEPCIS (open source) and vendor solutions.

## Architecture

The module uses the **Adapter Pattern** to abstract EPCIS provider differences:

```
EPCISService (Business Logic)
    ↓
IEPCISAdapter (Interface)
    ↓
├── OpenEPCISAdapter (Open Source)
└── VendorEPCISAdapter (Vendor Solutions)
```

## Configuration

Configure the EPCIS adapter via environment variables:

```env
# Adapter Type: 'openepcis' or 'vendor'
EPCIS_ADAPTER_TYPE=openepcis

# EPCIS Service URL
EPCIS_BASE_URL=http://localhost:8080

# Authentication (optional)
EPCIS_AUTH_TYPE=none  # Options: 'none', 'basic', 'bearer', 'api-key'
EPCIS_API_KEY=your-api-key
EPCIS_API_SECRET=your-api-secret

# Timeout (milliseconds)
EPCIS_TIMEOUT=30000
```

## Usage

### Inject EPCISService

```typescript
import { Injectable } from '@nestjs/common';
import { EPCISService } from '@shared/infrastructure/epcis/epcis.service';
import { EPCISDocument } from '@shared/infrastructure/epcis/types';

@Injectable()
export class MyService {
  constructor(private readonly epcisService: EPCISService) {}

  async captureEvent() {
    const document: EPCISDocument = {
      '@context': ['https://ref.gs1.org/standards/epcis/epcis-context.jsonld'],
      type: 'EPCISDocument',
      schemaVersion: '2.0',
      creationDate: new Date().toISOString(),
      epcisBody: {
        eventList: [
          {
            eventID: 'urn:uuid:...',
            type: 'AggregationEvent',
            eventTime: new Date().toISOString(),
            eventTimeZoneOffset: '+04:00',
            parentID: 'https://example.com/cases/123',
            childEPCs: ['https://example.com/batches/456'],
            action: 'ADD',
            bizStep: 'packing',
          },
        ],
      },
    };

    const result = await this.epcisService.captureEvent(document);
    if (result.success) {
      console.log('Event captured:', result.eventIds);
    }
  }
}
```

## Switching Providers

### Current: OpenEPCIS

```env
EPCIS_ADAPTER_TYPE=openepcis
EPCIS_BASE_URL=http://localhost:8080
```

### Future: Vendor Solution

1. Implement `VendorEPCISAdapter` using vendor SDK
2. Update environment variable:

```env
EPCIS_ADAPTER_TYPE=vendor
EPCIS_BASE_URL=https://vendor-epcis-api.com
EPCIS_AUTH_TYPE=bearer
EPCIS_API_KEY=your-vendor-api-key
```

3. No code changes needed in business logic!

## Adapter Interface

All adapters implement `IEPCISAdapter`:

```typescript
interface IEPCISAdapter {
  captureEvent(document: EPCISDocument): Promise<CaptureResponse>;
  captureEvents(documents: EPCISDocument[]): Promise<CaptureResponse[]>;
  queryEvents(query: EPCISQuery): Promise<EPCISQueryDocument>;
  getEventById(eventId: string): Promise<EPCISEvent>;
  getEventsByEPC(epc: string, options?: QueryOptions): Promise<EPCISEvent[]>;
  healthCheck(): Promise<boolean>;
  configure(config: EPCISAdapterConfig): void;
}
```

## Benefits

1. **Vendor Agnostic**: Switch providers without changing business logic
2. **Testable**: Easy to mock for unit tests
3. **Future Proof**: Ready for vendor selection
4. **Consistent API**: Same interface regardless of provider

