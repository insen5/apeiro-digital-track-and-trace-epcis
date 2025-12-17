import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { GenerateBarcodeDto } from './dto/gs1.dto';

/**
 * Barcode Service
 *
 * Generates barcodes and QR codes for GS1 identifiers (SSCC, SGTIN, etc.)
 */
@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  /**
   * Generate Code 128 barcode as SVG
   *
   * Note: For production, consider using a proper barcode library with Node.js support
   * or generate barcodes on the client side. This is a simplified implementation.
   *
   * @param data Data to encode (SSCC, GTIN, etc.)
   * @param options Barcode options
   * @returns SVG string
   */
  async generateCode128(
    data: string,
    options?: { width?: number; height?: number },
  ): Promise<string> {
    try {
      // Simplified Code 128 representation
      // In production, use a proper barcode library or generate on client side
      const width = options?.width || 200;
      const height = options?.height || 100;

      // Create a simple barcode-like SVG representation
      // TODO: Integrate proper Code 128 barcode generation library
      const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white"/>
        <text x="${width / 2}" y="${height / 2}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              font-family="monospace" 
              font-size="16" 
              font-weight="bold">${data}</text>
        <text x="${width / 2}" y="${height - 10}" 
              text-anchor="middle" 
              font-family="monospace" 
              font-size="12">CODE 128</text>
      </svg>`;

      this.logger.warn(
        'Code 128 barcode generation is simplified. Consider using a proper barcode library.',
      );
      return svg;
    } catch (error: any) {
      this.logger.error(`Failed to generate Code 128 barcode: ${error.message}`);
      throw new Error(`Barcode generation failed: ${error.message}`);
    }
  }

  /**
   * Generate Data Matrix code
   *
   * @param data Data to encode
   * @param options Barcode options
   * @returns Buffer containing Data Matrix image (PNG)
   */
  async generateDataMatrix(
    data: string,
    options?: { width?: number; height?: number },
  ): Promise<Buffer> {
    try {
      // Data Matrix generation requires a specialized library
      // For now, we'll use QR Code as a placeholder
      // TODO: Implement proper Data Matrix generation when library is available
      this.logger.warn(
        'Data Matrix generation not yet implemented, using QR Code',
      );
      return this.generateQRCode(data, options);
    } catch (error: any) {
      this.logger.error(
        `Failed to generate Data Matrix code: ${error.message}`,
      );
      throw new Error(`Data Matrix generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR Code
   *
   * @param data Data to encode
   * @param options QR Code options
   * @returns Buffer containing QR code image (PNG)
   */
  async generateQRCode(
    data: string,
    options?: { width?: number; height?: number },
  ): Promise<Buffer> {
    try {
      const qrCodeOptions: QRCode.QRCodeToBufferOptions = {
        type: 'png',
        width: options?.width || 200,
        margin: 1,
      };

      const buffer = await QRCode.toBuffer(data, qrCodeOptions);
      this.logger.log(`Generated QR code for data: ${data.substring(0, 20)}...`);
      return buffer;
    } catch (error: any) {
      this.logger.error(`Failed to generate QR code: ${error.message}`);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate barcode based on format
   *
   * @param dto Barcode generation parameters
   * @returns Buffer containing barcode image (PNG for QR/DataMatrix, SVG string for Code128)
   */
  async generateBarcode(dto: GenerateBarcodeDto): Promise<Buffer | string> {
    switch (dto.format) {
      case 'code128':
        return this.generateCode128(dto.data, {
          width: dto.width,
          height: dto.height,
        });
      case 'datamatrix':
        return this.generateDataMatrix(dto.data, {
          width: dto.width,
          height: dto.height,
        });
      case 'qrcode':
        return this.generateQRCode(dto.data, {
          width: dto.width,
          height: dto.height,
        });
      default:
        throw new Error(`Unsupported barcode format: ${dto.format}`);
    }
  }

  /**
   * Generate barcode as base64 string (for embedding in HTML/JSON)
   */
  async generateBarcodeBase64(dto: GenerateBarcodeDto): Promise<string> {
    const result = await this.generateBarcode(dto);

    if (Buffer.isBuffer(result)) {
      // PNG image
      return `data:image/png;base64,${result.toString('base64')}`;
    } else {
      // SVG string
      return `data:image/svg+xml;base64,${Buffer.from(result).toString('base64')}`;
    }
  }
}
