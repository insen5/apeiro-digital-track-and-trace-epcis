
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from './snake-naming-strategy';
import { User } from '../../domain/entities/user.entity';
import { Batch } from '../../domain/entities/batch.entity';
import { Shipment } from '../../domain/entities/shipment.entity';
import { Package } from '../../domain/entities/package.entity';
import { Case } from '../../domain/entities/case.entity';
import { CasesProducts } from '../../domain/entities/cases-products.entity';
import { RecallRequest } from '../../domain/entities/recall-request.entity';
import { BatchNotificationSettings } from '../../domain/entities/batch-notification-settings.entity';
import { PPBActivityLog } from '../../domain/entities/ppb-activity-log.entity';
import { Consignment } from '../../domain/entities/consignment.entity';
import { ConsignmentBatch } from '../../domain/entities/consignment-batch.entity';
import { SerialNumber } from '../../domain/entities/serial-number.entity';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRole } from '../../domain/entities/supplier-role.entity';
import { Premise } from '../../domain/entities/premise.entity';
import { LogisticsProvider } from '../../domain/entities/logistics-provider.entity';
import { PPBBatch } from '../../domain/entities/ppb-batch.entity';
import { PPBProduct } from '../../domain/entities/ppb-product.entity';
import { PPBPractitioner } from '../../domain/entities/ppb-practitioner.entity';
import { ProductStatus } from '../../domain/entities/product-status.entity';
import { ProductDestruction } from '../../domain/entities/product-destruction.entity';
import { ProductReturns } from '../../domain/entities/product-returns.entity';
import { ProductVerifications } from '../../domain/entities/product-verifications.entity';
import { FacilityReceiving } from '../../domain/entities/facility-receiving.entity';
import { FacilityDispensing } from '../../domain/entities/facility-dispensing.entity';
import { FacilityInventory } from '../../domain/entities/facility-inventory.entity';
import { EPCISEvent } from '../../domain/entities/epcis-event.entity';
import { EPCISEventEPC } from '../../domain/entities/epcis-event-epc.entity';
import { EPCISEventBizTransaction } from '../../domain/entities/epcis-event-biz-transaction.entity';
import { EPCISEventQuantity } from '../../domain/entities/epcis-event-quantity.entity';
import { EPCISEventSource } from '../../domain/entities/epcis-event-source.entity';
import { EPCISEventDestination } from '../../domain/entities/epcis-event-destination.entity';
import { EPCISEventSensor } from '../../domain/entities/epcis-event-sensor.entity';
import { Party } from '../../domain/entities/party.entity';
import { Location } from '../../domain/entities/location.entity';
import { PremiseQualityReport } from '../../domain/entities/premise-quality-report.entity';
import { ProductQualityReport } from '../../domain/entities/product-quality-report.entity';
import { PractitionerQualityReport } from '../../domain/entities/practitioner-quality-report.entity';
import { UatFacility, UatFacilitiesSyncLog, UatFacilitiesQualityAudit } from '../../domain/entities/uat-facility.entity';
import { ProdFacility, ProdFacilitiesSyncLog, ProdFacilitiesQualityAudit } from '../../domain/entities/prod-facility.entity';
import { HierarchyChange } from '../../domain/entities/hierarchy-change.entity';
import { GS1HelpContent } from '../../domain/entities/gs1-help-content.entity';
import { MasterDataSyncLog } from '../../domain/entities/master-data-sync-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'tnt_user'),
        password: configService.get<string>('DB_PASSWORD', 'tnt_password'),
        database: configService.get<string>('DB_DATABASE', 'kenya_tnt_db'),
        entities: [
          User,
          Batch,
          Shipment,
          Package,
          Case,
          CasesProducts,
          RecallRequest,
          BatchNotificationSettings,
          PPBActivityLog,
          Consignment,
          ConsignmentBatch,
          SerialNumber,
          Supplier,
          SupplierRole,
          Premise,
          LogisticsProvider,
          PPBBatch,
          PPBProduct,
          PPBPractitioner,
          ProductStatus,
          ProductDestruction,
          ProductReturns,
          ProductVerifications,
          FacilityReceiving,
          FacilityDispensing,
          FacilityInventory,
          EPCISEvent,
          EPCISEventEPC,
          EPCISEventBizTransaction,
          EPCISEventQuantity,
          EPCISEventSource,
          EPCISEventDestination,
          EPCISEventSensor,
          Party,
          Location,
          PremiseQualityReport,
          ProductQualityReport,
          PractitionerQualityReport,
            UatFacility,
            UatFacilitiesSyncLog,
            UatFacilitiesQualityAudit,
            ProdFacility,
            ProdFacilitiesSyncLog,
            ProdFacilitiesQualityAudit,
            HierarchyChange,
            GS1HelpContent,
            MasterDataSyncLog,
          ],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
        // namingStrategy: Removed SnakeNamingStrategy - database uses camelCase columns
        logging: configService.get<boolean>('DB_LOGGING', false),
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
        extra: {
          max: 20, // Connection pool size
          connectionTimeoutMillis: 30000, // 30 seconds (was 2s - too short!)
        },
        // Allow app to start even if DB connection fails (for preview)
        retryAttempts: 1,
        retryDelay: 1000,
      }),
      inject: [ConfigService],
    }),
    // Register repositories for dependency injection
    TypeOrmModule.forFeature([
      User,
      Batch,
      Shipment,
      Package,
      Case,
      CasesProducts,
      RecallRequest,
      BatchNotificationSettings,
      PPBActivityLog,
      Consignment,
      ConsignmentBatch,
      SerialNumber,
      Supplier,
      SupplierRole,
      Premise,
      LogisticsProvider,
      PPBBatch,
      PPBProduct,
      PPBPractitioner,
      ProductStatus,
      ProductDestruction,
      ProductReturns,
      ProductVerifications,
      FacilityReceiving,
      FacilityDispensing,
      FacilityInventory,
      EPCISEvent,
      EPCISEventEPC,
      EPCISEventBizTransaction,
      EPCISEventQuantity,
      EPCISEventSource,
      EPCISEventDestination,
      EPCISEventSensor,
      Party,
      Location,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
