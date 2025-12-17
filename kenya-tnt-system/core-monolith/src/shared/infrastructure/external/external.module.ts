import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PPBApiService } from './ppb-api.service';
import { SafaricomHieApiService } from './safaricom-hie-api.service';

@Module({
  imports: [HttpModule],
  providers: [PPBApiService, SafaricomHieApiService],
  exports: [PPBApiService, SafaricomHieApiService],
})
export class ExternalModule {}

