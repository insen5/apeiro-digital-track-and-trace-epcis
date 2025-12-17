import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FacilityOperationsService } from './facility-operations.service';
import { FacilityReceiving } from '../../domain/entities/facility-receiving.entity';
import { FacilityDispensing } from '../../domain/entities/facility-dispensing.entity';
import { FacilityInventory } from '../../domain/entities/facility-inventory.entity';

@ApiTags('L5 TNT Analytics - Facility Operations')
@Controller('l5-tnt/facility-operations')
export class FacilityOperationsController {
  constructor(private readonly service: FacilityOperationsService) {}

  // ==================== Receiving Endpoints ====================

  @Get('receiving')
  @ApiOperation({ summary: 'Get all receiving records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'facilityUserId', required: false, type: String })
  @ApiQuery({ name: 'shipmentId', required: false, type: Number })
  @ApiQuery({ name: 'consignmentId', required: false, type: Number })
  async findAllReceiving(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('facilityUserId') facilityUserId?: string,
    @Query('shipmentId') shipmentId?: number,
    @Query('consignmentId') consignmentId?: number,
  ) {
    return this.service.findAllReceiving(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      facilityUserId,
      shipmentId ? Number(shipmentId) : undefined,
      consignmentId ? Number(consignmentId) : undefined,
    );
  }

  @Get('receiving/:id')
  @ApiOperation({ summary: 'Get receiving record by ID' })
  async findOneReceiving(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneReceiving(id);
  }

  @Post('receiving')
  @ApiOperation({ summary: 'Create receiving record' })
  async createReceiving(@Body() data: Partial<FacilityReceiving>) {
    return this.service.createReceiving(data);
  }

  @Put('receiving/:id')
  @ApiOperation({ summary: 'Update receiving record' })
  async updateReceiving(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<FacilityReceiving>,
  ) {
    return this.service.updateReceiving(id, data);
  }

  // ==================== Dispensing Endpoints ====================

  @Get('dispensing')
  @ApiOperation({ summary: 'Get all dispensing records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'facilityUserId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'batchId', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  async findAllDispensing(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('facilityUserId') facilityUserId?: string,
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
    @Query('patientId') patientId?: string,
  ) {
    return this.service.findAllDispensing(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      facilityUserId,
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
      patientId,
    );
  }

  @Get('dispensing/:id')
  @ApiOperation({ summary: 'Get dispensing record by ID' })
  async findOneDispensing(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneDispensing(id);
  }

  @Post('dispensing')
  @ApiOperation({ summary: 'Create dispensing record' })
  async createDispensing(@Body() data: Partial<FacilityDispensing>) {
    return this.service.createDispensing(data);
  }

  @Put('dispensing/:id')
  @ApiOperation({ summary: 'Update dispensing record' })
  async updateDispensing(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<FacilityDispensing>,
  ) {
    return this.service.updateDispensing(id, data);
  }

  // ==================== Inventory Endpoints ====================

  @Get('inventory')
  @ApiOperation({ summary: 'Get all inventory records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'facilityUserId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'batchId', required: false, type: Number })
  async findAllInventory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('facilityUserId') facilityUserId?: string,
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
  ) {
    return this.service.findAllInventory(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      facilityUserId,
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
    );
  }

  @Get('inventory/:facilityUserId/:productId/:batchId')
  @ApiOperation({ summary: 'Get inventory record by facility, product, and batch' })
  async findOneInventory(
    @Param('facilityUserId', ParseUUIDPipe) facilityUserId: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('batchId', ParseIntPipe) batchId: number,
  ) {
    return this.service.findOneInventory(facilityUserId, productId, batchId);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Create or update inventory record' })
  async createOrUpdateInventory(@Body() data: Partial<FacilityInventory>) {
    return this.service.createOrUpdateInventory(data);
  }

  @Put('inventory/:facilityUserId/:productId/:batchId')
  @ApiOperation({ summary: 'Update inventory record' })
  async updateInventory(
    @Param('facilityUserId', ParseUUIDPipe) facilityUserId: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() data: Partial<FacilityInventory>,
  ) {
    return this.service.updateInventory(facilityUserId, productId, batchId, data);
  }
}
