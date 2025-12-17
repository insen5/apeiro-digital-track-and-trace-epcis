import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributorShipmentService } from './shipment.service';
import { DistributorShipmentController } from './shipment.controller';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';
import { MasterDataModule } from '../../shared/master-data/master-data.module';
import { CasesModule } from '../../shared/cases/case.module'; // For CaseService
import { PackagesModule } from '../../shared/packages/package.module'; // For PackageService

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Package, Case, User]),
    GS1Module,
    MasterDataModule,
    CasesModule, // Import shared CasesModule for CaseService
    PackagesModule, // Import shared PackagesModule for PackageService
  ],
  providers: [DistributorShipmentService],
  controllers: [DistributorShipmentController],
  exports: [DistributorShipmentService],
})
export class DistributorShipmentsModule {}

