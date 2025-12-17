import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DistributorShipmentService } from './shipment.service';
import { CaseService } from '../../shared/cases/case.service';
import { PackageService } from '../../shared/packages/package.service';
import { MasterDataService } from '../../shared/master-data/master-data.service';
import { ReceiveShipmentDto } from '../dto/receive-shipment.dto';
import { ForwardShipmentDto } from '../dto/forward-shipment.dto';
import { AssignSSCCDto } from '../../shared/cases/dto/assign-sscc.dto';

// TODO: Add JWT Auth Guard
// import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Shipments (Distributor)')
@ApiBearerAuth('access-token')
@Controller('distributor/shipments')
// @UseGuards(JwtAuthGuard)
export class DistributorShipmentController {
  constructor(
    private readonly shipmentService: DistributorShipmentService,
    private readonly caseService: CaseService, // Use shared CaseService
    private readonly packageService: PackageService, // Use shared PackageService
    private readonly masterDataService: MasterDataService, // For facilities lookup
  ) {}

  @Post('receive')
  receiveShipment(@Body() body: ReceiveShipmentDto, @Req() req: any) {
    // Get userId from custom header (set by frontend) or fallback to default
    const userId = req.headers['x-user-id'] || req.user?.id || '00000000-0000-0000-0000-000000000001';
    
    // Debug logging
    console.log('[receiveShipment] Received body:', JSON.stringify(body, null, 2));
    console.log('[receiveShipment] pickupDate type:', typeof body.pickupDate, 'value:', body.pickupDate);
    console.log('[receiveShipment] expectedDeliveryDate type:', typeof body.expectedDeliveryDate, 'value:', body.expectedDeliveryDate);
    
    return this.shipmentService.receiveShipment(userId, body);
  }

  @Post('forward')
  forwardShipment(@Body() body: ForwardShipmentDto, @Req() req: any) {
    // Get userId from custom header (set by frontend) or fallback to default
    const userId = req.headers['x-user-id'] || req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.forwardShipment(userId, body);
  }

  @Get('received')
  getReceivedShipments(@Req() req: any) {
    // Get userId from custom header (set by frontend) or fallback to default
    const userId = req.headers['x-user-id'] || req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.getReceivedShipments(userId);
  }

  @Get('pending')
  getPendingShipments(@Req() req: any) {
    // Get userId from custom header (set by frontend) or fallback to default
    const userId = req.headers['x-user-id'] || req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.getPendingShipments(userId);
  }

  @Get('forwardable')
  getForwardableShipments(@Req() req: any) {
    // Get userId from custom header (set by frontend) or fallback to default
    const userId = req.headers['x-user-id'] || req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.getForwardableShipments(userId);
  }

  @Get('destinations')
  async getDestinations() {
    // Get healthcare facilities (hospitals, clinics, dispensaries) from premises/master data
    // Return all active facilities (filtering happens on frontend if needed)
    const result = await this.masterDataService.getPremises(1, 500);
    
    // Filter out wholesale/manufacturing facilities, keep only healthcare facilities
    const healthcareFacilities = result.premises.filter(p => 
      ['HOSPITAL', 'CLINIC', 'DISPENSARY', 'HEALTH CENTER', 'HEALTH CENTRE'].includes(p.businessType?.toUpperCase() || '')
    );
    
    return {
      ...result,
      premises: healthcareFacilities,
      total: healthcareFacilities.length
    };
  }

  @Post('by-parent-sscc')
  findByParentSSCC(
    @Body() body: { parentSSCC: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.findByParentSSCC(body.parentSSCC, userId);
  }

  @Put('packages/:id/assign-sscc')
  assignSSCCToPackage(
    @Param('id') id: string,
    @Body() dto: AssignSSCCDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    // Use shared PackageService instead of distributor-specific method
    return this.packageService.assignSSCC(+id, userId, dto.sscc);
  }

  @Put('cases/:id/assign-sscc')
  assignSSCCToCase(
    @Param('id') id: string,
    @Body() dto: AssignSSCCDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    // Use shared CaseService instead of distributor-specific method
    return this.caseService.assignSSCC(+id, userId, dto.sscc);
  }
}

