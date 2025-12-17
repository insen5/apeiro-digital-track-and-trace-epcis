import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { PPBProduct } from '../../../shared/domain/entities/ppb-product.entity';
import { JourneyModule } from '../../../shared/analytics/journey/journey.module';
import { L5TNTAnalyticsModule } from '../../../shared/analytics/l5-tnt/l5-tnt-analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Batch, PPBProduct]),
    JourneyModule, // Journey tracking analytics
    L5TNTAnalyticsModule, // L5 TNT compliance analytics
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, JourneyModule, L5TNTAnalyticsModule], // Export so other modules can use
})
export class AnalyticsModule {}

