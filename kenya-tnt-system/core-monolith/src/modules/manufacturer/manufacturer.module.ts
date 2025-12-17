import { Module } from '@nestjs/common';
import { BatchesModule } from './batches/batch.module';
import { CasesModule } from './cases/case.module';
import { PackagesModule } from './packages/package.module';
import { ShipmentsModule } from './shipments/shipment.module';
import { ConsignmentsModule } from './consignments/consignment.module';

// Feature flag: Set ENABLE_MANUFACTURER_PRODUCTION=false to hide production features
const ENABLE_PRODUCTION = process.env.ENABLE_MANUFACTURER_PRODUCTION !== 'false';

@Module({
  imports: [
    ConsignmentsModule, // Always import consignments
    ...(ENABLE_PRODUCTION
      ? [BatchesModule, CasesModule, PackagesModule, ShipmentsModule]
      : []),
  ],
  exports: [
    ConsignmentsModule, // Always export consignments
    ...(ENABLE_PRODUCTION
      ? [BatchesModule, CasesModule, PackagesModule, ShipmentsModule]
      : []),
  ],
})
export class ManufacturerModule {}
