import { Body, Controller, Get, Post, Query, Req, UseGuards, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JourneyService } from './journey.service';

// TODO: Add JWT Auth Guard
// import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Journey Tracking')
@ApiBearerAuth('access-token')
@Controller('analytics/journey')
// @UseGuards(JwtAuthGuard)
export class JourneyController {
  private readonly logger = new Logger(JourneyController.name);

  constructor(private readonly journeyService: JourneyService) {}

  @Post('by-sscc')
  async getBySSCC(@Body() body: { sscc: string }, @Req() req: any) {
    try {
      if (!body?.sscc) {
        throw new HttpException('SSCC is required', HttpStatus.BAD_REQUEST);
      }
      console.log(`[Controller] ===== getBySSCC called with SSCC: ${body.sscc} =====`);
      this.logger.log(`Getting journey for SSCC: ${body.sscc}`);
      const result = await this.journeyService.getJourneyBySSCC(body.sscc);
      console.log(`[Controller] Service returned ${result?.events?.length || 0} events`);
      return result;
    } catch (error: any) {
      // Enhanced error logging
      const errorMessage = error?.message || 'Internal server error';
      const errorStack = error?.stack;
      const statusCode = error?.status || error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      
      this.logger.error(`Error in getBySSCC for SSCC ${body?.sscc}: ${errorMessage}`, errorStack);
      console.error('=== JOURNEY BY SSCC ERROR ===');
      console.error('SSCC:', body?.sscc);
      console.error('Error message:', errorMessage);
      console.error('Error status:', statusCode);
      console.error('Error stack:', errorStack);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('================================');
      
      // Return detailed error in development, generic in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      throw new HttpException(
        {
          statusCode,
          message: isDevelopment ? errorMessage : 'Internal server error',
          ...(isDevelopment && { 
            error: errorStack,
            details: error?.details || error?.response || undefined,
          }),
        },
        statusCode,
      );
    }
  }

  @Get('all')
  async getAll(@Query('page') page: string, @Query('limit') limit: string) {
    try {
      return await this.journeyService.getAllJourneys(
        page ? +page : 1,
        limit ? +limit : 10,
      );
    } catch (error: any) {
      this.logger.error(`Error in getAll: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Internal server error',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('consignment-flow')
  async getConsignmentFlow(@Body() body: { consignmentID: string }) {
    try {
      if (!body?.consignmentID) {
        throw new HttpException('consignmentID is required', HttpStatus.BAD_REQUEST);
      }
      return await this.journeyService.getConsignmentFlow(body.consignmentID);
    } catch (error: any) {
      this.logger.error(`Error in getConsignmentFlow: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Internal server error',
          error: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

