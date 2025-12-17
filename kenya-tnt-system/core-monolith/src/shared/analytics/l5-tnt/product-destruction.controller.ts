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
import { ProductDestructionService } from './product-destruction.service';
import { ProductDestruction } from '../../domain/entities/product-destruction.entity';

@ApiTags('L5 TNT Analytics - Product Destruction')
@Controller('l5-tnt/product-destruction')
export class ProductDestructionController {
  constructor(private readonly service: ProductDestructionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all destruction records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'facilityUserId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'batchId', required: false, type: Number })
  @ApiQuery({ name: 'destructionReason', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('facilityUserId') facilityUserId?: string,
    @Query('productId') productId?: number,
    @Query('batchId') batchId?: number,
    @Query('destructionReason') destructionReason?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      facilityUserId,
      productId ? Number(productId) : undefined,
      batchId ? Number(batchId) : undefined,
      destructionReason,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get destruction statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getDestructionStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get destruction record by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create destruction record' })
  async create(@Body() data: Partial<ProductDestruction>) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update destruction record' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<ProductDestruction>,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete destruction record' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { message: 'Destruction record deleted successfully' };
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate destruction request' })
  async initiate(
    @Query('userId') userId: string,
    @Body() dto: {
      productId: number;
      batchId: number;
      sgtin?: string;
      quantity: number;
      destructionReason: 'EXPIRED' | 'DAMAGED' | 'RECALLED' | 'QUARANTINED';
      justification: string;
      scheduledDate?: string;
    }
  ) {
    return this.service.initiateDestruction(userId, {
      ...dto,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
    });
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve destruction request' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Query('approverId') approverId: string,
    @Body() body: { notes?: string }
  ) {
    return this.service.approveDestruction(approverId, id, body.notes);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject destruction request' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Query('approverId') approverId: string,
    @Body() body: { reason: string }
  ) {
    return this.service.rejectDestruction(approverId, id, body.reason);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete destruction' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
    @Body() dto: {
      witnessName?: string;
      witnessSignature?: string;
      complianceDocumentUrl?: string;
      actualDestructionDate?: string;
      completionNotes?: string;
    }
  ) {
    return this.service.completeDestruction(userId, id, {
      ...dto,
      actualDestructionDate: dto.actualDestructionDate ? new Date(dto.actualDestructionDate) : undefined,
    });
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: 'Get pending approval requests' })
  async getPendingApprovals() {
    return this.service.getPendingApprovals();
  }

  @Get('by-status/:status')
  @ApiOperation({ summary: 'Get destructions by status' })
  async getByStatus(@Param('status') status: string) {
    return this.service.getByStatus(status);
  }
}
