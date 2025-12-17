import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { HierarchyService } from './hierarchy.service';
import { PackDto, PackLiteDto, PackLargeDto, UnpackAllDto } from './dto/pack.dto';
import { HierarchyOperationType } from '../../../shared/domain/entities/hierarchy-change.entity';

@ApiTags('Hierarchy Management')
@Controller('hierarchy')
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Post('pack')
  @ApiOperation({ 
    summary: 'Pack cases into new package',
    description: 'Create a new package from selected cases and generate new SSCC'
  })
  async pack(@Request() req, @Body() dto: PackDto) {
    const userId = req.headers['x-user-id'] || 'test-user-123'; // TODO: Get from auth
    return this.hierarchyService.pack(userId, dto);
  }

  @Post('pack-lite')
  @ApiOperation({ 
    summary: 'Small repackaging operation',
    description: 'Pack a small number of cases (Pack Lite operation)'
  })
  async packLite(@Request() req, @Body() dto: PackLiteDto) {
    const userId = req.headers['x-user-id'] || 'test-user-123';
    return this.hierarchyService.packLite(userId, dto);
  }

  @Post('pack-large')
  @ApiOperation({ 
    summary: 'Large repackaging operation',
    description: 'Pack a large number of cases (Pack Large operation)'
  })
  async packLarge(@Request() req, @Body() dto: PackLargeDto) {
    const userId = req.headers['x-user-id'] || 'test-user-123';
    return this.hierarchyService.packLarge(userId, dto);
  }

  @Post('unpack/:packageId')
  @ApiOperation({ 
    summary: 'Unpack package into cases',
    description: 'Break down package and release cases for individual handling'
  })
  @ApiParam({ name: 'packageId', description: 'Package ID to unpack' })
  async unpack(@Request() req, @Param('packageId', ParseIntPipe) packageId: number) {
    const userId = req.headers['x-user-id'] || 'test-user-123';
    return this.hierarchyService.unpack(userId, packageId);
  }

  @Post('unpack-all')
  @ApiOperation({ 
    summary: 'Bulk unpacking operation',
    description: 'Unpack multiple packages at once'
  })
  async unpackAll(@Request() req, @Body() dto: UnpackAllDto) {
    const userId = req.headers['x-user-id'] || 'test-user-123';
    return this.hierarchyService.unpackAll(userId, dto);
  }

  @Post('repack/:packageId')
  @ApiOperation({ 
    summary: 'Repack package with new SSCC',
    description: 'Unpack and repack with new SSCC (for reorganization)'
  })
  @ApiParam({ name: 'packageId', description: 'Package ID to repack' })
  async repack(
    @Request() req,
    @Param('packageId', ParseIntPipe) packageId: number,
    @Query('newShipmentId', ParseIntPipe) newShipmentId: number
  ) {
    const userId = req.headers['x-user-id'] || 'test-user-123';
    return this.hierarchyService.repack(userId, packageId, newShipmentId);
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Get hierarchy change history',
    description: 'Retrieve history of pack/unpack operations'
  })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'operationType', required: false, enum: HierarchyOperationType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @Query('userId') userId?: string,
    @Query('operationType') operationType?: HierarchyOperationType,
    @Query('limit') limit?: number,
  ) {
    return this.hierarchyService.getHierarchyHistory(
      userId,
      operationType,
      limit ? parseInt(limit.toString()) : 50
    );
  }

  @Get('history/sscc/:sscc')
  @ApiOperation({ 
    summary: 'Get hierarchy changes by SSCC',
    description: 'Find all pack/unpack operations involving a specific SSCC'
  })
  @ApiParam({ name: 'sscc', description: 'SSCC to search for' })
  async getHistoryBySSCC(@Param('sscc') sscc: string) {
    return this.hierarchyService.getHistoryBySSCC(sscc);
  }
}
