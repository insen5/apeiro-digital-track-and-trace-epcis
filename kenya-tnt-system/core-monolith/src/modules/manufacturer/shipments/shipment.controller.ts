import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';

// TODO: Add JWT Auth Guard
// import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Shipments (Manufacturer)')
@ApiBearerAuth('access-token')
@Controller('manufacturer/shipments')
// @UseGuards(JwtAuthGuard)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  create(@Body() body: CreateShipmentDto, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.create(userId, body);
  }

  @Post('by-sscc')
  getBySSCC(@Body() body: { sscc: string }, @Req() req: any) {
    return this.shipmentService.findBySSCC(body.sscc);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.shipmentService.findOne(+id, userId);
  }
}

