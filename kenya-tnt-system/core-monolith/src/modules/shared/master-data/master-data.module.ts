import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';
import { MasterDataSchedulerService } from './master-data-scheduler.service';
import { Supplier } from '../../../shared/domain/entities/supplier.entity';
import { Premise } from '../../../shared/domain/entities/premise.entity';
import { LogisticsProvider } from '../../../shared/domain/entities/logistics-provider.entity';
import { PPBProduct } from '../../../shared/domain/entities/ppb-product.entity';
import { PPBPractitioner } from '../../../shared/domain/entities/ppb-practitioner.entity';
import { PremiseQualityReport } from '../../../shared/domain/entities/premise-quality-report.entity';
import { ProductQualityReport } from '../../../shared/domain/entities/product-quality-report.entity';
import { PractitionerQualityReport } from '../../../shared/domain/entities/practitioner-quality-report.entity';
import { UatFacility, UatFacilitiesSyncLog, UatFacilitiesQualityAudit } from '../../../shared/domain/entities/uat-facility.entity';
import { ProdFacility, ProdFacilitiesSyncLog, ProdFacilitiesQualityAudit } from '../../../shared/domain/entities/prod-facility.entity';
import { MasterDataSyncLog } from '../../../shared/domain/entities/master-data-sync-log.entity';
import { ExternalModule } from '../../../shared/infrastructure/external/external.module';
import { QualityAlertService } from './quality-alert.service';
import { GenericSyncService } from './generic-sync.service';
import { GenericQualityReportService } from './generic-quality-report.service';
import { GenericQualityHistoryService } from './generic-quality-history.service';
import { GenericCrudService } from './generic-crud.service';
import { GenericQualityAuditEnrichmentService } from './generic-quality-audit-enrichment.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron scheduling
    TypeOrmModule.forFeature([
      Supplier,
      Premise,
      LogisticsProvider,
      PPBProduct,
      PPBPractitioner,
      PremiseQualityReport,
      ProductQualityReport,
      PractitionerQualityReport,
      UatFacility,
      UatFacilitiesSyncLog,
      UatFacilitiesQualityAudit,
      ProdFacility,
      ProdFacilitiesSyncLog,
      ProdFacilitiesQualityAudit,
      MasterDataSyncLog, // NEW: Generic sync logging for all master data
    ]),
    HttpModule,
    ExternalModule, // Import ExternalModule to get PPBApiService and SafaricomHieApiService
  ],
  controllers: [MasterDataController],
  providers: [
    MasterDataService,
    MasterDataSchedulerService, // NEW: Automated sync & audit scheduler 
    QualityAlertService,
    // NEW: Generic services following config-driven pattern
    GenericSyncService,
    GenericQualityReportService,
    GenericQualityHistoryService,
    GenericCrudService,
    GenericQualityAuditEnrichmentService, // NEW: Quality audit enrichment with dimensions & trends
  ],
  exports: [MasterDataService],
})
export class MasterDataModule {}


