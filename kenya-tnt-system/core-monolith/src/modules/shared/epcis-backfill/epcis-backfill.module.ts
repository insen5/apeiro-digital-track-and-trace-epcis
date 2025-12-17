import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpcisBackfillController } from './epcis-backfill.controller';
import { EpcisBackfillService } from './epcis-backfill.service';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Package, User]),
    GS1Module,
  ],
  controllers: [EpcisBackfillController],
  providers: [EpcisBackfillService],
  exports: [EpcisBackfillService],
})
export class EpcisBackfillModule {}
