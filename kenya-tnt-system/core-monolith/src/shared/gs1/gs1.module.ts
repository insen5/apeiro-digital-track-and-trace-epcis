import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GS1Service } from './gs1.service';
import { SSCCService } from './sscc.service';
import { SGTINService } from './sgtin.service';
import { BatchNumberService } from './batch-number.service';
import { EPCISEventService } from './epcis-event.service';
import { BarcodeService } from './barcode.service';
import { GLNService } from './gln.service';
import { GCPService } from './gcp.service';
import { GS1ParserService } from './gs1-parser.service';
import { EPCISModule } from '../infrastructure/epcis/epcis.module';
import { Shipment } from '../domain/entities/shipment.entity';
import { Package } from '../domain/entities/package.entity';
import { Case } from '../domain/entities/case.entity';
import { EPCISEvent } from '../domain/entities/epcis-event.entity';
import { EPCISEventEPC } from '../domain/entities/epcis-event-epc.entity';
import { EPCISEventBizTransaction } from '../domain/entities/epcis-event-biz-transaction.entity';
import { EPCISEventQuantity } from '../domain/entities/epcis-event-quantity.entity';
import { EPCISEventSource } from '../domain/entities/epcis-event-source.entity';
import { EPCISEventDestination } from '../domain/entities/epcis-event-destination.entity';
import { EPCISEventSensor } from '../domain/entities/epcis-event-sensor.entity';
import { Supplier } from '../domain/entities/supplier.entity';
import { LogisticsProvider } from '../domain/entities/logistics-provider.entity';

@Module({
  imports: [
    EPCISModule,
    TypeOrmModule.forFeature([
      Shipment,
      Package,
      Case,
      EPCISEvent,
      EPCISEventEPC,
      EPCISEventBizTransaction,
      EPCISEventQuantity,
      EPCISEventSource,
      EPCISEventDestination,
      EPCISEventSensor,
      Supplier,
      LogisticsProvider,
    ]),
  ],
  providers: [
    GS1Service,
    SSCCService,
    SGTINService,
    BatchNumberService,
    EPCISEventService,
    BarcodeService,
    GLNService,
    GCPService,
    GS1ParserService,
  ],
  exports: [GS1Service, SGTINService, GLNService, EPCISEventService, GCPService, GS1ParserService],
})
export class GS1Module {}

