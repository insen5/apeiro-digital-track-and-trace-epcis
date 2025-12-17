import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsignmentService } from '../../shared/consignments/consignment.service';

/**
 * Manufacturer Consignments Controller
 * 
 * Query-only controller for manufacturers to view their consignments.
 * Import is only available to regulator (PPB).
 * 
 * FUTURE: Will add submission endpoint for pre-approval workflow:
 * - POST /manufacturer/consignments/submit - Submit consignment for PPB approval
 * - See CONSIGNMENT_APPROVAL_WORKFLOW_BACKLOG.md for details
 */
@ApiTags('Consignments (Manufacturer)')
@Controller('manufacturer/consignments')
export class ManufacturerConsignmentController {
  constructor(private readonly consignmentService: ConsignmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consignments for the manufacturer (filtered by GLN/PPBID)' })
  async findAll(@Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.consignmentService.findAllForManufacturer(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consignment by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.consignmentService.findOne(+id, userId);
  }
}
