import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';
import { MasterDataModule } from '../../shared/master-data/master-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Package, User]),
    GS1Module,
    MasterDataModule,
  ],
  providers: [ShipmentService],
  controllers: [ShipmentController],
  exports: [ShipmentService],
})
export class ShipmentsModule {}

