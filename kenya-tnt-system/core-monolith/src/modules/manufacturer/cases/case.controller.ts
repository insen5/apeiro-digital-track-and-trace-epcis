import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaseService } from '../../shared/cases/case.service';
import { CreateCaseDto } from '../../shared/cases/dto/create-case.dto';
import { AssignSSCCDto } from '../../shared/cases/dto/assign-sscc.dto';

/**
 * Manufacturer Cases Controller
 * 
 * Thin controller that uses shared CaseService
 */
@ApiTags('Cases (Manufacturer)')
@Controller('manufacturer/cases')
export class ManufacturerCaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a case by aggregating batches' })
  create(@Body() body: CreateCaseDto & { packageId: number }, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.caseService.create(userId, body.packageId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases for the manufacturer' })
  findAll(@Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.caseService.findAll(userId);
  }

  @Put(':id/assign-sscc')
  @ApiOperation({ summary: 'Assign SSCC to a case' })
  assignSSCC(
    @Param('id') id: string,
    @Body() dto: AssignSSCCDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.caseService.assignSSCC(+id, userId, dto.sscc);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.caseService.findOne(+id, userId);
  }
}
