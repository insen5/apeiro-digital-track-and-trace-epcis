import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecallService } from './recall.service';
import { RecallStatus } from '../../../shared/domain/entities/recall-request.entity';

// TODO: Add JWT Auth Guard
// import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Recall (Regulator)')
@ApiBearerAuth('access-token')
@Controller('regulator/recall')
// @UseGuards(JwtAuthGuard)
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Post()
  create(@Body() body: any) {
    return this.recallService.create(body);
  }

  @Get()
  findAll() {
    return this.recallService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recallService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: RecallStatus },
  ) {
    return this.recallService.updateStatus(+id, body.status);
  }
}

