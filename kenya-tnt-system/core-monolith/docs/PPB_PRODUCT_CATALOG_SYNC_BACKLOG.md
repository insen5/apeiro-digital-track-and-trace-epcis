# PPB Product Catalog Sync - Backlog Item

## Feature: Automatic Daily Product Catalog Sync

### Current Status
- ✅ Manual sync implemented via `POST /api/master-data/products/sync`
- ✅ Bootstrap script available: `scripts/bootstrap-ppb-product-catalog.ts`
- ❌ **Automatic scheduled sync NOT implemented**

### Requirement
Enable automatic daily synchronization of the PPB Product Catalog from the PPB Terminology API.

### Implementation Plan

#### 1. Create Scheduler Service
**File**: `src/modules/shared/master-data/master-data-scheduler.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MasterDataService } from './master-data.service';

@Injectable()
export class MasterDataSchedulerService {
  private readonly logger = new Logger(MasterDataSchedulerService.name);

  constructor(private readonly masterDataService: MasterDataService) {}

  /**
   * Sync PPB Product Catalog daily at 2:00 AM
   * Runs automatically every day to keep catalog up-to-date
   */
  @Cron('0 2 * * *', {
    name: 'sync-ppb-product-catalog',
    timeZone: 'Africa/Nairobi',
  })
  async syncProductCatalogDaily() {
    this.logger.log('Starting scheduled PPB Product Catalog sync...');
    
    try {
      const result = await this.masterDataService.syncProductCatalog();
      
      this.logger.log(
        `Scheduled sync completed: ${result.inserted} inserted, ${result.updated} updated, ${result.errors} errors, ${result.total} total`,
      );
    } catch (error: any) {
      this.logger.error('Scheduled product catalog sync failed:', error.message);
      // Don't throw - allow scheduler to continue with other tasks
    }
  }
}
```

#### 2. Register Scheduler in Module
**File**: `src/modules/shared/master-data/master-data.module.ts`

Add to providers:
```typescript
providers: [MasterDataService, PPBApiService, MasterDataSchedulerService],
```

#### 3. Configuration Options
Add to `.env`:
```env
# PPB Product Catalog Sync Schedule
PPB_PRODUCT_SYNC_ENABLED=true
PPB_PRODUCT_SYNC_CRON=0 2 * * *  # Daily at 2:00 AM (default)
PPB_PRODUCT_SYNC_TIMEZONE=Africa/Nairobi
```

#### 4. Alternative Schedule Options

**Daily at 2:00 AM** (Recommended - low traffic):
```typescript
@Cron('0 2 * * *')
```

**Twice daily** (2 AM & 2 PM):
```typescript
@Cron('0 2,14 * * *')
```

**Every 6 hours**:
```typescript
@Cron('0 */6 * * *')
```

**Every 12 hours** (Midnight & Noon):
```typescript
@Cron('0 0,12 * * *')
```

### Benefits
- ✅ Automatic catalog updates without manual intervention
- ✅ Ensures catalog is always current with PPB Terminology API
- ✅ Reduces risk of stale product data
- ✅ Configurable schedule based on PPB update frequency

### Dependencies
- ✅ `@nestjs/schedule` already installed (ScheduleModule enabled)
- ✅ `MasterDataService.syncProductCatalog()` method exists
- ✅ `PPBApiService` configured with correct API token

### Testing
1. Test scheduler with shorter interval (e.g., every 5 minutes) for development
2. Monitor logs during scheduled runs
3. Verify products are updated correctly
4. Test error handling (API failures, network issues)

### Notes
- Scheduler uses NestJS `@nestjs/schedule` which is already enabled
- Timezone should be set to `Africa/Nairobi` for Kenya
- Consider adding email/notification on sync failures
- May want to add sync statistics/metrics tracking


