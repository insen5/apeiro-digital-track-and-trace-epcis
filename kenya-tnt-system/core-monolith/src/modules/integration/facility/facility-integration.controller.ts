import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FacilityIntegrationService } from './facility-integration.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { FacilityLoggingInterceptor } from './interceptors/logging.interceptor';
import { FacilityMetricsInterceptor } from './interceptors/metrics.interceptor';
import { ReceivedEventDto, ConsumedEventDto } from './dto/facility-event.dto';
import {
  LMISEventDto,
  DispenseEventDto,
  ReceiveEventDto,
  AdjustEventDto,
  StockCountEventDto,
  ReturnEventDto,
  RecallEventDto,
  LMISEventType,
} from './dto/lmis-event.dto';

@ApiTags('Facility Integration')
@ApiSecurity('api-key')
@Controller('integration/facility')
@UseGuards(ApiKeyGuard)
@UseInterceptors(FacilityLoggingInterceptor, FacilityMetricsInterceptor)
export class FacilityIntegrationController {
  private readonly logger = new Logger(FacilityIntegrationController.name);

  constructor(
    private readonly facilityService: FacilityIntegrationService,
    private readonly metricsInterceptor: FacilityMetricsInterceptor,
  ) {}

  @Post('events/received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive product received event from FLMIS',
    description:
      'Endpoint for facility LMIS systems to report when products are received. ' +
      'The system will transform the business event to EPCIS format and send to OpenEPCIS.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'API key for facility authentication',
    required: true,
  })
  @ApiHeader({
    name: 'X-Facility-ID',
    description: 'Facility identifier',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Event processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Event processed successfully' },
        eventId: { type: 'string', example: 'FAC-2025-001' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing API key',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - EPCIS event capture failed',
  })
  async handleReceived(@Body() dto: ReceivedEventDto) {
    await this.facilityService.handleProductReceived(dto);
    return {
      success: true,
      message: 'Event processed successfully',
      eventId: dto.event_id,
    };
  }

  @Post('events/consumed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive product consumed event from FLMIS',
    description:
      'Endpoint for facility LMIS systems to report when products are consumed/dispensed. ' +
      'The system will transform the business event to EPCIS format and send to OpenEPCIS.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'API key for facility authentication',
    required: true,
  })
  @ApiHeader({
    name: 'X-Facility-ID',
    description: 'Facility identifier',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Event processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Event processed successfully' },
        eventId: { type: 'string', example: 'FAC-2025-002' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing API key',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - EPCIS event capture failed',
  })
  async handleConsumed(@Body() dto: ConsumedEventDto) {
    await this.facilityService.handleProductConsumed(dto);
    return {
      success: true,
      message: 'Event processed successfully',
      eventId: dto.event_id,
    };
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get integration metrics',
    description: 'Returns metrics about facility integration API usage and EPCIS event processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        requestsTotal: { type: 'number', example: 150 },
        requestsSuccess: { type: 'number', example: 145 },
        requestsError: { type: 'number', example: 5 },
        epcisEventsCaptured: { type: 'number', example: 140 },
        epcisEventsFailed: { type: 'number', example: 5 },
        averageResponseTime: { type: 'number', example: 234.5 },
        receivedEvents: { type: 'number', example: 80 },
        consumedEvents: { type: 'number', example: 60 },
      },
    },
  })
  getMetrics() {
    return this.metricsInterceptor.getMetrics();
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unified endpoint for all LMIS business events',
    description:
      'Single endpoint that accepts all LMIS event types (dispense, receive, adjust, stock_count, return, recall). ' +
      'The system automatically transforms business events to EPCIS format based on event type.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'API key for facility authentication',
    required: true,
  })
  @ApiHeader({
    name: 'X-Facility-ID',
    description: 'Facility identifier',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Event processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Event processed successfully' },
        eventType: { type: 'string', example: 'dispense' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing API key',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - EPCIS event capture failed',
  })
  async handleUnifiedEvent(@Body() dto: LMISEventDto) {
    try {
      await this.facilityService.handleLMISEvent(dto);
      return {
        success: true,
        message: 'Event processed successfully',
        eventType: dto.type,
      };
    } catch (error: any) {
      // Log the full error for debugging
      this.logger.error('Error processing LMIS event:', error?.stack || error?.message || error);
      // Return detailed error in development, generic in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      throw new HttpException(
        {
          statusCode: error?.status || 500,
          message: isDevelopment ? (error?.message || 'Internal server error') : 'Internal server error',
          error: isDevelopment ? error?.stack : undefined,
        },
        error?.status || 500,
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns service health status',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'Facility Integration Service' },
        timestamp: { type: 'string', example: '2025-01-15T10:30:00Z' },
      },
    },
  })
  health() {
    return {
      status: 'ok',
      service: 'Facility Integration Service',
      timestamp: new Date().toISOString(),
    };
  }
}

