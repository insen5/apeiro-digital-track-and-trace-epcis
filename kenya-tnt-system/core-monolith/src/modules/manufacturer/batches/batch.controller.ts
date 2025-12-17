import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BatchService } from './batch.service';
import { CreateBatchDto } from '../dto/create-batch.dto';

// TODO: Add JWT Auth Guard
// import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Batches (Manufacturer)')
@ApiBearerAuth('access-token')
@Controller('manufacturer/batches')
// @UseGuards(JwtAuthGuard)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  create(@Body() body: CreateBatchDto, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const token = req.token || 'temp-token';
    return this.batchService.create(userId, token, body);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.batchService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    return this.batchService.findOne(+id, userId);
  }
}

