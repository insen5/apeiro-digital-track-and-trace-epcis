import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EPCISService } from './epcis.service';
import { EPCISServiceFactory } from './epcis-service.factory';
import { OpenEPCISAdapter } from './openepcis.adapter';
import { VendorEPCISAdapter } from './vendor-epcis.adapter';

@Module({
  imports: [HttpModule],
  providers: [
    EPCISService,
    EPCISServiceFactory,
    OpenEPCISAdapter,
    VendorEPCISAdapter,
  ],
  exports: [EPCISService],
})
export class EPCISModule {}

