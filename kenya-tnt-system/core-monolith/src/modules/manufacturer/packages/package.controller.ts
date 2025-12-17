import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackageService } from '../../shared/packages/package.service';
import { CreatePackageDto } from '../../shared/packages/dto/create-package.dto';
import { AssignSSCCDto } from '../../shared/cases/dto/assign-sscc.dto';

/**
 * Manufacturer Packages Controller
 * 
 * Thin controller that uses shared PackageService
 */
@ApiTags('Packages (Manufacturer)')
@Controller('manufacturer/packages')
export class ManufacturerPackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a package by aggregating cases' })
  create(@Body() body: CreatePackageDto & { shipmentId: number }, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.packageService.create(userId, body.shipmentId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all packages for the manufacturer' })
  findAll(@Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.packageService.findAll(userId);
  }

  @Put(':id/assign-sscc')
  @ApiOperation({ summary: 'Assign SSCC to a package' })
  assignSSCC(
    @Param('id') id: string,
    @Body() dto: AssignSSCCDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.packageService.assignSSCC(+id, userId, dto.sscc);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.packageService.findOne(+id, userId);
  }
}
