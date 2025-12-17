import { Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EpcisBackfillService } from './epcis-backfill.service';

@ApiTags('EPCIS Backfill')
@Controller('epcis-backfill')
export class EpcisBackfillController {
  private readonly logger = new Logger(EpcisBackfillController.name);

  constructor(private readonly backfillService: EpcisBackfillService) {}

  @Post('shipments')
  @ApiOperation({ summary: 'Backfill EPCIS events for seed shipments' })
  @ApiResponse({ status: 200, description: 'Backfill completed' })
  async backfillShipments() {
    this.logger.log('Backfill shipment EPCIS events requested');
    const result = await this.backfillService.backfillShipmentEvents();
    return {
      message: 'Backfill completed',
      ...result,
    };
  }
}
