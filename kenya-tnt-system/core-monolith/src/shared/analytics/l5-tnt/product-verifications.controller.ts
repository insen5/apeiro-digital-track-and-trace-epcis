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
import { ProductVerificationsService } from './product-verifications.service';
import { ProductVerifications } from '../../domain/entities/product-verifications.entity';

@ApiTags('L5 TNT Analytics - Product Verifications')
@Controller('l5-tnt/product-verifications')
export class ProductVerificationsController {
  constructor(private readonly service: ProductVerificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all verification records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sgtin', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'batchId', required: false, type: Number })
  @ApiQuery({ name: 'verificationResult', required: false, type: String })
  @ApiQuery({ name: 'verifierUserId', required: false, type: String })
  @ApiQuery({ name: 'isConsumerVerification', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sgtin') sgtin?: string,
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
    @Query('verificationResult') verificationResult?: string,
    @Query('verifierUserId') verifierUserId?: string,
    @Query('isConsumerVerification') isConsumerVerification?: boolean,
  ) {
    return this.service.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      sgtin,
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
      verificationResult,
      verifierUserId,
      typeof isConsumerVerification === 'string' 
        ? (isConsumerVerification === 'true' ? true : isConsumerVerification === 'false' ? false : undefined)
        : isConsumerVerification,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get verification statistics' })
  async getStats() {
    return this.service.getVerificationStats();
  }

  @Get('sgtin/:sgtin')
  @ApiOperation({ summary: 'Get verifications by SGTIN' })
  async findBySGTIN(@Param('sgtin') sgtin: string) {
    return this.service.findBySGTIN(sgtin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get verification record by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create verification record' })
  async create(@Body() data: Partial<ProductVerifications>) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update verification record' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<ProductVerifications>,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete verification record' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { message: 'Verification record deleted successfully' };
  }
}
