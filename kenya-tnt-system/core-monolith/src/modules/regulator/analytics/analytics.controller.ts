import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

// TODO: Add JWT Auth Guard
// import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Analytics (Regulator)')
@ApiBearerAuth('access-token')
@Controller('regulator/analytics')
// @UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('shipments')
  getShipmentStats() {
    return this.analyticsService.getShipmentStats();
  }

  @Get('batches/expiry')
  getBatchExpiryStats() {
    return this.analyticsService.getBatchExpiryStats();
  }

  @Get('products')
  getProductStats() {
    return this.analyticsService.getProductStats();
  }
}

