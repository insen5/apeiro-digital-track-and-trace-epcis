import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { GS1ParserService, GS1ParsedData } from '../../../shared/gs1/gs1-parser.service';

/**
 * Public Barcode Scanner Controller
 * Provides GS1 barcode parsing as a public utility
 * No authentication required - meant for general public use
 */

export class ParseBarcodeDto {
  @ApiProperty({
    description: 'Raw barcode data to parse',
    example: '(01)12345678901234(21)ABC123(10)LOT001(17)251231'
  })
  @IsString()
  @IsNotEmpty()
  barcode_data: string;
}

export class ParseBarcodeResponse {
  @ApiProperty()
  success: boolean;
  
  @ApiProperty({ required: false })
  data?: GS1ParsedData;
  
  @ApiProperty({ required: false })
  error?: string;
}

@ApiTags('Public Barcode Scanner')
@Controller('public/barcode-scanner')
export class BarcodeScannerController {
  private readonly logger = new Logger(BarcodeScannerController.name);

  constructor(private readonly gs1ParserService: GS1ParserService) {}

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse GS1 barcode (public endpoint)',
    description: 'Parses GS1 Data Matrix, Digital Link, plain GTIN, or plain SSCC barcodes. Supports traditional format (with parentheses), FNC1 format, and GS1 Digital Link URLs. No authentication required.'
  })
  @ApiResponse({
    status: 200,
    description: 'Barcode parsed successfully',
    type: ParseBarcodeResponse,
  })
  async parseBarcode(@Body() dto: ParseBarcodeDto): Promise<ParseBarcodeResponse> {
    try {
      this.logger.log(`=== BARCODE PARSE REQUEST ===`);
      this.logger.log(`DTO received: ${JSON.stringify(dto)}`);
      this.logger.log(`barcode_data: ${dto?.barcode_data}`);
      this.logger.log(`barcode_data type: ${typeof dto?.barcode_data}`);
      this.logger.log(`barcode_data length: ${dto?.barcode_data?.length}`);
      
      if (!dto || !dto.barcode_data || dto.barcode_data.trim().length === 0) {
        this.logger.error(`Invalid request - DTO: ${JSON.stringify(dto)}`);
        return {
          success: false,
          error: 'Barcode data is required and cannot be empty',
        };
      }

      const barcodeData = dto.barcode_data.trim();
      this.logger.log(`Processing barcode: ${barcodeData.substring(0, 100)}...`);

      const parsedData = this.gs1ParserService.parseGS1Barcode(barcodeData);

      // Log what we parsed for debugging
      this.logger.log(`Parsed data: ${JSON.stringify(parsedData)}`);

      // Always return the parsed data, even if validation fails
      // This helps with debugging
      if (!this.gs1ParserService.isValidGS1Data(parsedData)) {
        this.logger.warn(`No valid GS1 identifiers found in barcode`);
        return {
          success: false,
          error: 'No valid GS1 identifiers found. The barcode may not be GS1-compliant. Raw data included for inspection.',
          data: parsedData, // Include raw data for debugging
        };
      }

      this.logger.log(`Successfully parsed ${parsedData.code_type || 'unknown'} barcode (format: ${parsedData.format})`);

      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      this.logger.error(`Error parsing barcode: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Failed to parse barcode: ${error.message}`,
      };
    }
  }

  @Post('validate-sscc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate SSCC check digit (public endpoint)',
    description: 'Validates an 18-digit SSCC using the GS1 check digit algorithm. No authentication required.'
  })
  async validateSSCC(@Body() body: { sscc: string }): Promise<{ valid: boolean; sscc: string; formatted?: string }> {
    try {
      const isValid = this.gs1ParserService.validateSSCC(body.sscc);
      
      return {
        valid: isValid,
        sscc: body.sscc,
        formatted: isValid ? this.gs1ParserService.formatSSCC(body.sscc) : undefined,
      };
    } catch (error) {
      this.logger.error(`Error validating SSCC: ${error.message}`);
      return {
        valid: false,
        sscc: body.sscc,
      };
    }
  }
}
