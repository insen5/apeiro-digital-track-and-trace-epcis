import { Module } from '@nestjs/common';
import { RecallModule } from './recall/recall.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PPBBatchesModule } from './ppb-batches/ppb-batch.module';
import { JourneyModule } from '../../shared/analytics/journey/journey.module';
import { L5TNTAnalyticsModule } from '../../shared/analytics/l5-tnt/l5-tnt-analytics.module';

@Module({
  imports: [
    RecallModule,
    AnalyticsModule, // Includes JourneyModule and L5TNTAnalyticsModule
    PPBBatchesModule,
    JourneyModule, // Also import directly for direct access
    L5TNTAnalyticsModule, // Also import directly for direct access
  ],
  exports: [
    AnalyticsModule, // Exports JourneyModule and L5TNTAnalyticsModule
    JourneyModule, // Export so other modules can use journey tracking
    L5TNTAnalyticsModule, // Export so other modules can use L5 TNT analytics
  ],
})
export class RegulatorModule {}
