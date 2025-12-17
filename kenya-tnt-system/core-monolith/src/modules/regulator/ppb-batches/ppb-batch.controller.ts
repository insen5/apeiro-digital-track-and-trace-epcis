import { Body, Controller, Get, Post, Param, Req, HttpException, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsignmentService } from '../../shared/consignments/consignment.service';
import { ImportPPBConsignmentDto } from '../../shared/consignments/dto/import-ppb-consignment.dto';

/**
 * PPB Consignments Controller (Regulator)
 * 
 * Rationalized to use consignment-based approach:
 * - Batches are viewed as part of consignments (not separate entities)
 * - All PPB data comes via consignment JSON import
 * - ppb_batches table is used for metadata storage only
 */
@ApiTags('PPB Consignments (Regulator)')
@Controller('regulator/ppb-batches')
export class PPBBatchController {
  private readonly logger = new Logger(PPBBatchController.name);

  constructor(
    private readonly consignmentService: ConsignmentService,
  ) {}

  // CRITICAL: More specific routes MUST come BEFORE parameterized routes
  // Otherwise ':id' will match 'consignments' as an ID parameter
  // Using 'all-consignments' to avoid route path issues with slashes
  @Get('all-consignments')
  @ApiOperation({ summary: 'Get all consignments (regulator view - no manufacturer filter)' })
  async getAllConsignments(@Req() req: any) {
    try {
      this.logger.log('Fetching all consignments for regulator view');
      const result = await this.consignmentService.findAll(); // No filter = all consignments
      this.logger.log(`Successfully fetched ${result?.length || 0} consignments`);
      return result;
    } catch (error: any) {
      this.logger.error('Error fetching consignments:', error?.message, error?.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Failed to fetch consignments',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('consignments/:id')
  @ApiOperation({ summary: 'Get consignment by ID (regulator view - shows all batches in consignment)' })
  async getConsignmentById(@Param('id') id: string, @Req() req: any) {
    try {
      // For regulator, find consignment without userId filter (regulator can see all)
      const consignment = await this.consignmentService.findOneForRegulator(+id);
      return consignment;
    } catch (error: any) {
      this.logger.error(`Error fetching consignment ${id}:`, error?.message, error?.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: error?.message || `Consignment with ID ${id} not found`,
          error: 'Not Found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('consignments/:id/backfill-serial-numbers')
  @ApiOperation({
    summary: 'Backfill serial numbers from PPB batch metadata',
    description: 'Populates serial_numbers table from serialization_range field in ppb_batches for an existing consignment. Useful for consignments imported before serial number expansion was implemented.'
  })
  async backfillSerialNumbers(@Param('id') id: string, @Req() req: any) {
    try {
      this.logger.log(`Backfilling serial numbers for consignment ID: ${id}`);
      const result = await this.consignmentService.backfillSerialNumbersFromPPBBatches(+id);
      
      return {
        success: true,
        message: `Successfully backfilled serial numbers for consignment ${id}`,
        ...result,
      };
    } catch (error: any) {
      this.logger.error(`Error backfilling serial numbers for consignment ${id}:`, error?.message, error?.stack);
      throw new HttpException(
        {
          statusCode: error instanceof NotFoundException ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || `Failed to backfill serial numbers for consignment ${id}`,
          error: 'Backfill Error',
        },
        error instanceof NotFoundException ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('consignment/import')
  @ApiOperation({ 
    summary: 'Import PPB consignment instantiation JSON (Option A)',
    description: 'Accepts PPB consignment JSON with full hierarchy (shipment → package → case → batch) and generates EPCIS events. Can be triggered directly or via Kafka topic ppb.consignment.instantiation'
  })
  async importConsignment(@Body() dto: ImportPPBConsignmentDto, @Req() req: any) {
    try {
      // Validate DTO structure before processing
      if (!dto) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Request body is missing or empty',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!dto.header) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Missing required field: header',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!dto.consignment) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Missing required field: consignment',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      this.logger.log(`Importing consignment: ${dto.header?.eventID || 'unknown'}`);
      return await this.consignmentService.importFromPPB(userId, dto);
    } catch (error: any) {
      // Extract error message from various error types
      let errorMessage = 'Failed to import consignment';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (error instanceof HttpException) {
        // If it's already an HttpException, extract its response
        const response = error.getResponse();
        if (typeof response === 'object' && response !== null) {
          errorMessage = (response as any).message || error.message;
          statusCode = error.getStatus();
        } else {
          errorMessage = response as string || error.message;
          statusCode = error.getStatus();
        }
        this.logger.error(`Failed to import consignment (${statusCode}): ${errorMessage}`, error?.stack);
        throw error; // Re-throw HttpException as-is
      }
      
      // Handle validation errors (from class-validator)
      if (error?.response?.message) {
        errorMessage = Array.isArray(error.response.message) 
          ? error.response.message.join(', ') 
          : error.response.message;
        statusCode = error.status || HttpStatus.BAD_REQUEST;
      } else if (error?.message) {
        errorMessage = error.message;
        statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      }
      
      // Log full error details - use console.error for immediate visibility
      console.error('=== CONSIGNMENT IMPORT ERROR ===');
      console.error('Error message:', errorMessage);
      console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error stack:', error?.stack);
      console.error('Consignment ID:', dto?.header?.eventID);
      console.error('================================');
      
      this.logger.error(`Failed to import consignment: ${errorMessage}`, {
        stack: error?.stack,
        error: error,
        consignmentId: dto?.header?.eventID,
      });
      
      // Return detailed error in development
      const isDevelopment = process.env.NODE_ENV !== 'production';
      throw new HttpException(
        {
          statusCode,
          message: errorMessage,
          error: isDevelopment ? 'Internal Server Error' : 'Internal Server Error',
          ...(isDevelopment && { details: error?.stack }),
        },
        statusCode,
      );
    }
  }
}

