import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductReturnsService } from './product-returns.service';
import { ProductReturns } from '../../domain/entities/product-returns.entity';

@ApiTags('L5 TNT Analytics - Product Returns')
@Controller('l5-tnt/product-returns')
export class ProductReturnsController {
  constructor(private readonly service: ProductReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all return records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'fromActorUserId', required: false, type: String })
  @ApiQuery({ name: 'toActorUserId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'batchId', required: false, type: Number })
  @ApiQuery({ name: 'returnType', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('fromActorUserId') fromActorUserId?: string,
    @Query('toActorUserId') toActorUserId?: string,
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
    @Query('returnType') returnType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      fromActorUserId,
      toActorUserId,
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
      returnType,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get return statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getReturnsStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get return record by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create return record' })
  async create(@Body() data: Partial<ProductReturns>) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update return record' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<ProductReturns>,
  ) {
    return this.service.update(id, data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update return status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.service.updateStatus(id, body.status, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete return record' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { message: 'Return record deleted successfully' };
  }

  @Post('receive')
  @ApiOperation({ summary: 'Create return receipt (Return Receiving workflow)' })
  async createReturnReceipt(
    @Query('userId') userId: string,
    @Body() dto: {
      referenceDocumentNumber?: string;
      sscc?: string;
      batchId: number;
      productId: number;
      sgtin?: string;
      quantity: number;
      qualityCheck: 'ACCEPTABLE' | 'DAMAGED' | 'EXPIRED';
      fromActorUserId: string;
      notes?: string;
    }
  ) {
    return this.service.createReturnReceipt(userId, dto);
  }

  @Post('ship')
  @ApiOperation({ summary: 'Create return shipment (Return Shipping workflow)' })
  async createReturnShipment(
    @Query('userId') userId: string,
    @Body() dto: {
      destinationGLN?: string;
      referenceDocumentNumber?: string;
      batchId: number;
      productId: number;
      sgtin?: string;
      quantity: number;
      returnReason: 'DEFECTIVE' | 'EXPIRED' | 'OVERSTOCK' | 'CUSTOMER_RETURN';
      toActorUserId: string;
      notes?: string;
    }
  ) {
    return this.service.createReturnShipment(userId, dto);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process return (approve/reject)' })
  async processReturn(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
    @Body() body: { decision: 'PROCESSED' | 'REJECTED'; notes?: string }
  ) {
    return this.service.processReturn(userId, id, body.decision, body.notes);
  }

  @Get('by-status/:status')
  @ApiOperation({ summary: 'Get returns by status' })
  async getByStatus(@Param('status') status: string) {
    return this.service.getReturnsByStatus(status);
  }
}
