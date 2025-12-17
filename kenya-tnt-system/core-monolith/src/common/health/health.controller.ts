import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Kenya TNT System - Core Monolith',
      version: '1.0.0',
      modules: {
        regulator: 'active',
        manufacturer: 'active',
        distributor: 'active',
        gs1: 'active',
        epcis: 'active',
        database: 'configured',
      },
    };
  }

  @Get('modules')
  getModules() {
    return {
      regulator: {
        products: '/api/master-data/products',
        journey: '/api/analytics/journey',
        recall: '/api/regulator/recall',
        analytics: '/api/regulator/analytics',
      },
      manufacturer: {
        batches: '/api/manufacturer/batches',
        cases: '/api/manufacturer/cases',
        packages: '/api/manufacturer/packages',
        shipments: '/api/manufacturer/shipments',
      },
      distributor: {
        shipments: '/api/distributor/shipments',
      },
    };
  }
}

