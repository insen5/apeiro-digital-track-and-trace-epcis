import { Injectable, Logger } from '@nestjs/common';
import { GenerateBatchNumberDto } from './dto/gs1.dto';

/**
 * Batch Number Service
 *
 * Generates GS1-compliant batch/lot numbers for product batches.
 * Batch numbers should be unique per product and user.
 */
@Injectable()
export class BatchNumberService {
  private readonly logger = new Logger(BatchNumberService.name);
  private readonly usedBatchNumbers = new Set<string>(); // In-memory cache (replace with DB check)

  /**
   * Generate a unique batch number
   *
   * Format: [PREFIX]-[TIMESTAMP]-[RANDOM]
   * Example: BATCH-20241219-ABC123
   *
   * @param dto Product ID and user ID for uniqueness
   * @returns Unique batch number
   */
  async generateBatchNumber(dto: GenerateBatchNumberDto): Promise<string> {
    const prefix = dto.prefix || 'BATCH';
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    let batchNumber = `${prefix}-${timestamp}-${randomPart}`;
    let unique = false;
    let attempts = 0;
    const maxAttempts = 100;

    // Ensure uniqueness (in-memory for now, replace with DB check)
    while (!unique && attempts < maxAttempts) {
      attempts++;

      const key = `${dto.product_id}-${dto.user_id}-${batchNumber}`;
      if (!this.usedBatchNumbers.has(key)) {
        this.usedBatchNumbers.add(key);
        unique = true;
      } else {
        // Regenerate random part
        const newRandomPart = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        batchNumber = `${prefix}-${timestamp}-${newRandomPart}`;
      }
    }

    if (!unique) {
      throw new Error(
        `Failed to generate unique batch number after ${maxAttempts} attempts`,
      );
    }

    this.logger.log(`Generated batch number: ${batchNumber}`);
    return batchNumber;
  }

  /**
   * Validate batch number format
   */
  validateBatchNumber(batchNo: string): boolean {
    if (!batchNo || batchNo.trim() === '') {
      return false;
    }

    // Basic validation: should contain alphanumeric characters and hyphens
    return /^[A-Z0-9-]+$/.test(batchNo);
  }

  /**
   * Format batch number as EPC URI (if needed for EPCIS events)
   * Format: https://example.com/batches/{batchno}
   */
  formatAsEPCURI(batchNo: string): string {
    if (!this.validateBatchNumber(batchNo)) {
      throw new Error(`Invalid batch number: ${batchNo}`);
    }

    // Remove spaces and special characters for URI
    const cleanBatchNo = batchNo.replace(/\s+/g, '');
    return `https://example.com/batches/${cleanBatchNo}`;
  }
}

