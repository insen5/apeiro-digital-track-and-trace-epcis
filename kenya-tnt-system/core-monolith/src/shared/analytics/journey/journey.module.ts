import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneyService } from './journey.service';
import { JourneyController } from './journey.controller';
import { Shipment } from '../../domain/entities/shipment.entity';
import { User } from '../../domain/entities/user.entity';
import { EPCISEvent } from '../../domain/entities/epcis-event.entity';
import { EPCISEventEPC } from '../../domain/entities/epcis-event-epc.entity';
import { Consignment } from '../../domain/entities/consignment.entity';
import { EPCISEventBizTransaction } from '../../domain/entities/epcis-event-biz-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      User,
      EPCISEvent,
      EPCISEventEPC,
      Consignment,
      EPCISEventBizTransaction,
    ]),
  ],
  providers: [JourneyService],
  controllers: [JourneyController],
  exports: [JourneyService],
})
export class JourneyModule {}

