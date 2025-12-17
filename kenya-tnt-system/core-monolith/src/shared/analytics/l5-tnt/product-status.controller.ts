import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductStatusService } from './product-status.service';
import { CreateProductStatusDto } from './dto/create-product-status.dto';

@ApiTags('L5 TNT Analytics - Product Status')
@Controller('l5-tnt/product-status')
export class ProductStatusController {
  constructor(private readonly productStatusService: ProductStatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product status change' })
  async create(@Body() dto: CreateProductStatusDto, @Query('userId') userId: string) {
    return this.productStatusService.create(userId, dto);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update product status with authorization check' })
  async updateStatus(@Body() dto: CreateProductStatusDto, @Query('userId') userId: string) {
    return this.productStatusService.updateStatus(userId, dto);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update product statuses' })
  async bulkUpdate(@Body() updates: CreateProductStatusDto[], @Query('userId') userId: string) {
    return this.productStatusService.bulkUpdateStatus(userId, updates);
  }

  @Get()
  @ApiOperation({ summary: 'Get product status history' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'sgtin', required: false })
  async findByProduct(
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
    @Query('sgtin') sgtin?: string,
  ) {
    return this.productStatusService.findByProduct(
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
      sgtin,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current product status' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'sgtin', required: false })
  async getCurrentStatus(
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
    @Query('sgtin') sgtin?: string,
  ) {
    return this.productStatusService.getCurrentStatus(
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
      sgtin,
    );
  }

  @Get('report')
  @ApiOperation({ summary: 'Get status-based report' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getReport(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
    } : undefined;

    return this.productStatusService.getStatusReport(status, dateRange);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get status summary (grouped by status)' })
  async getSummary() {
    return this.productStatusService.getStatusSummary();
  }
}

