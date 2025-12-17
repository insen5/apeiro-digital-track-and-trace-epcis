import { Module } from '@nestjs/common';
import { DistributorShipmentsModule } from './shipments/shipment.module';
import { DistributorConsignmentsModule } from './consignments/consignment.module';

@Module({
  imports: [
    DistributorShipmentsModule,
    DistributorConsignmentsModule, // Distributor consignments (query only)
  ],
  exports: [
    DistributorShipmentsModule,
    DistributorConsignmentsModule,
  ],
})
export class DistributorModule {}
