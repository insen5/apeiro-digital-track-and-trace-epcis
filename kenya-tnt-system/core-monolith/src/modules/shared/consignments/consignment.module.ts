import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsignmentService } from './consignment.service';
import { Consignment } from '../../../shared/domain/entities/consignment.entity';
import { ConsignmentBatch } from '../../../shared/domain/entities/consignment-batch.entity';
import { SerialNumber } from '../../../shared/domain/entities/serial-number.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { PPBProduct } from '../../../shared/domain/entities/ppb-product.entity';
import { PPBBatch } from '../../../shared/domain/entities/ppb-batch.entity';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { CasesProducts } from '../../../shared/domain/entities/cases-products.entity';
import { MasterDataModule } from '../master-data/master-data.module';
import { BatchesModule } from '../../manufacturer/batches/batch.module';
import { GS1Module } from '../../../shared/gs1/gs1.module';

/**
 * Shared Consignments Module
 * 
 * Provides consignment import and query services for all stakeholders.
 * - Regulator: All consignments (no filter)
 * - Manufacturer: Filtered by manufacturer GLN/PPBID
 * - Can be extended for other stakeholders
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consignment,
      ConsignmentBatch,
      SerialNumber,
      Batch,
      PPBProduct,
      PPBBatch,
      Shipment,
      Package,
      Case,
      CasesProducts,
    ]),
    MasterDataModule,
    BatchesModule, // To use BatchService for PPB import
    GS1Module, // For EPCIS events
  ],
  providers: [ConsignmentService],
  exports: [ConsignmentService], // Export for use in manufacturer/regulator controllers
})
export class ConsignmentsModule {}

