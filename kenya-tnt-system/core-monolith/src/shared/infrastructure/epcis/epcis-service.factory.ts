import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  IEPCISAdapter,
  EPCISAdapterConfig,
} from './epcis-adapter.interface';
import { OpenEPCISAdapter } from './openepcis.adapter';
import { VendorEPCISAdapter } from './vendor-epcis.adapter';

@Injectable()
export class EPCISServiceFactory {
  private readonly logger = new Logger(EPCISServiceFactory.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  createAdapter(): IEPCISAdapter {
    const adapterType =
      this.configService.get<string>('EPCIS_ADAPTER_TYPE') || 'openepcis';
    const baseUrl =
      this.configService.get<string>('EPCIS_BASE_URL') ||
      'http://localhost:8084';

    const config: EPCISAdapterConfig = {
      baseUrl,
      apiKey: this.configService.get<string>('EPCIS_API_KEY'),
      apiSecret: this.configService.get<string>('EPCIS_API_SECRET'),
      authType:
        (this.configService.get<'none' | 'basic' | 'bearer' | 'api-key'>(
          'EPCIS_AUTH_TYPE',
        ) as 'none' | 'basic' | 'bearer' | 'api-key') || 'none',
      timeout: this.configService.get<number>('EPCIS_TIMEOUT') || 30000,
    };

    this.logger.log(`Creating EPCIS adapter: ${adapterType}`);

    let adapter: IEPCISAdapter;

    switch (adapterType) {
      case 'openepcis':
        adapter = new OpenEPCISAdapter(this.httpService);
        break;
      case 'vendor':
        adapter = new VendorEPCISAdapter();
        break;
      default:
        this.logger.warn(
          `Unknown adapter type: ${adapterType}, defaulting to openepcis`,
        );
        adapter = new OpenEPCISAdapter(this.httpService);
    }

    adapter.configure(config);
    return adapter;
  }
}

