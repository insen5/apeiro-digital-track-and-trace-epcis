import { Module } from '@nestjs/common';
import { FacilityIntegrationController } from './facility-integration.controller';
import { FacilityIntegrationService } from './facility-integration.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { FacilityLoggingInterceptor } from './interceptors/logging.interceptor';
import { FacilityMetricsInterceptor } from './interceptors/metrics.interceptor';
import { GS1Module } from '../../../shared/gs1/gs1.module';
import { MasterDataModule } from '../../shared/master-data/master-data.module';

@Module({
  imports: [GS1Module, MasterDataModule],
  controllers: [FacilityIntegrationController],
  providers: [
    FacilityIntegrationService,
    ApiKeyGuard,
    FacilityLoggingInterceptor,
    FacilityMetricsInterceptor,
  ],
  exports: [FacilityIntegrationService],
})
export class FacilityIntegrationModule {}

