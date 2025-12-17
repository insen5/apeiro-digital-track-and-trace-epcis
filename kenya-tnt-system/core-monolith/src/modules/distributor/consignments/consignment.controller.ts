import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsignmentService } from '../../shared/consignments/consignment.service';

/**
 * Distributor Consignments Controller
 * 
 * Query-only controller for distributors to view their consignments.
 * Import is only available to regulator (PPB).
 */
@ApiTags('Consignments (Distributor)')
@Controller('distributor/consignments')
export class DistributorConsignmentController {
  constructor(private readonly consignmentService: ConsignmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consignments for the distributor (filtered by GLN/PPBID)' })
  async findAll(@Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.consignmentService.findAllForDistributor(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consignment by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.consignmentService.findOne(+id, userId);
  }
}

