import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { GS1Module } from './shared/gs1/gs1.module';
import { EPCISModule } from './shared/infrastructure/epcis/epcis.module';
import { ExternalModule } from './shared/infrastructure/external/external.module';
import { RegulatorModule } from './modules/regulator/regulator.module';
import { ManufacturerModule } from './modules/manufacturer/manufacturer.module';
import { DistributorModule } from './modules/distributor/distributor.module';
import { MasterDataModule } from './modules/shared/master-data/master-data.module';
import { KafkaModule } from './shared/infrastructure/kafka/kafka.module';
import { AuthModule } from './modules/auth/auth.module';
// DEPRECATED: ManufacturerPPBBatchesModule - PPB data now comes via consignments only
// import { ManufacturerPPBBatchesModule } from './modules/manufacturer/ppb-batches/ppb-batch.module';
import { HealthModule } from './common/health/health.module';
import { DemoModule } from './common/demo/demo.module';
import { FacilityIntegrationModule } from './modules/integration/facility/facility-integration.module';
import { EpcisBackfillModule } from './modules/shared/epcis-backfill/epcis-backfill.module';
import { HierarchyModule } from './modules/shared/hierarchy/hierarchy.module';
import { HelpModule } from './modules/shared/help/help.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(), // Enable scheduled tasks (cron jobs)
    EPCISModule,
    DatabaseModule,
    GS1Module,
    ExternalModule, // PPB API client
    AuthModule, // Simple authentication with dummy users (ppp, ranbaxy, kemsa)
    RegulatorModule, // Includes analytics (dashboard stats, journey tracking, L5 TNT compliance)
    ManufacturerModule, // Includes ConsignmentsModule (unified PPB data with batches)
    DistributorModule,
    MasterDataModule, // Master data (suppliers, premises, logistics providers)
    KafkaModule, // Kafka consumer for PPB data streams (ppb.consignment.instantiation only)
    // DEPRECATED: ManufacturerPPBBatchesModule - PPB sends full consignment JSON, not individual batches
    // All PPB data (including batches) is now accessed via /manufacturer/consignments endpoint
    HealthModule, // Health check endpoints
    DemoModule, // Demo endpoints for preview
    FacilityIntegrationModule, // Facility LMIS integration service
    EpcisBackfillModule, // EPCIS event backfill for seed data
    HierarchyModule, // Hierarchy Management (Pack/Unpack operations)
    HelpModule, // GS1 Education System (in-app help)
  ],
})
export class AppModule {}

