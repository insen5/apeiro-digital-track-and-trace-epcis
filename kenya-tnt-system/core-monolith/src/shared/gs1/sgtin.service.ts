import { Injectable, Logger } from '@nestjs/common';
import { GenerateSGTINDto } from './dto/gs1.dto';

/**
 * SGTIN (Serialized Global Trade Item Number) Service
 *
 * Generates GS1-compliant SGTIN identifiers for unit-level tracking.
 * SGTIN format: urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber
 */
@Injectable()
export class SGTINService {
  private readonly logger = new Logger(SGTINService.name);

  /**
   * Calculate GS1 check digit for GTIN
   * Algorithm varies by GTIN length:
   * - GTIN-8, GTIN-12, GTIN-13: Multiply odd positions by 1, even by 3 (from right)
   * - GTIN-14: Multiply odd positions by 3, even by 1 (from right) - same as SSCC
   */
  calculateGTINCheckDigit(gtinBase: string): string {
    if (!gtinBase || gtinBase.length < 7 || gtinBase.length > 13) {
      throw new Error(
        `Invalid GTIN base length: ${gtinBase.length}. Must be 7-13 digits.`,
      );
    }

    const digits = gtinBase.split('').map(Number).reverse();
    let sum = 0;

    // Determine algorithm based on target length
    const targetLength = gtinBase.length + 1; // +1 for check digit

    if (targetLength === 14) {
      // GTIN-14: odd positions × 3, even × 1 (same as SSCC)
      for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * (i % 2 === 0 ? 3 : 1);
      }
    } else {
      // GTIN-8, GTIN-12, GTIN-13: odd positions × 1, even × 3 (same as GLN)
      for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
      }
    }

    const mod = sum % 10;
    return mod === 0 ? '0' : (10 - mod).toString();
  }

  /**
   * Validate GTIN format and check digit
   * GTIN can be 8, 12, 13, or 14 digits
   */
  validateGTIN(gtin: string): boolean {
    if (!gtin || !/^\d{8,14}$/.test(gtin)) {
      return false;
    }

    // Extract base (all digits except last) and check digit
    const base = gtin.substring(0, gtin.length - 1);
    const checkDigit = gtin.substring(gtin.length - 1);

    try {
      const calculatedCheckDigit = this.calculateGTINCheckDigit(base);
      return checkDigit === calculatedCheckDigit;
    } catch (error) {
      this.logger.error(`Error validating GTIN check digit: ${error}`);
      return false;
    }
  }

  /**
   * Generate SGTIN EPC URI
   *
   * Format: urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber
   *
   * Note: Company prefix length is variable (6-12 digits). If not provided,
   * we attempt to extract it from GTIN, but this requires knowing the prefix length.
   * For accurate SGTIN generation, always provide the companyPrefix.
   *
   * @param dto GTIN, serial number, and optional company prefix
   * @returns SGTIN EPC URI
   */
  generateSGTIN(dto: GenerateSGTINDto): string {
    if (!this.validateGTIN(dto.gtin)) {
      throw new Error(`Invalid GTIN: ${dto.gtin}`);
    }

    // Serial number must be provided
    if (!dto.serialNumber || dto.serialNumber.trim() === '') {
      throw new Error('Serial number is required for SGTIN');
    }

    // Normalize GTIN to 14 digits (pad with zeros if needed)
    const normalizedGTIN = dto.gtin.padStart(14, '0');

    let companyPrefix: string;
    let itemRef: string;

    if (dto.companyPrefix) {
      // Use provided company prefix (preferred method)
      const prefixLength = dto.companyPrefix.length;

      if (prefixLength < 6 || prefixLength > 12) {
        throw new Error(
          `Invalid company prefix length: ${prefixLength}. Must be 6-12 digits.`,
        );
      }

      // Extract prefix from normalized GTIN (first prefixLength digits)
      // For GTIN-14: Indicator (1) + Company Prefix + Item Ref (remaining) + Check Digit (1)
      // We need to skip the indicator digit (position 0) for GTIN-14
      const indicatorDigit = normalizedGTIN.substring(0, 1);
      const extractedPrefix = normalizedGTIN.substring(1, 1 + prefixLength);

      // Verify extracted prefix matches provided prefix
      if (extractedPrefix !== dto.companyPrefix) {
        this.logger.warn(
          `GTIN prefix mismatch: provided ${dto.companyPrefix}, extracted ${extractedPrefix}. Using provided prefix.`,
        );
      }

      companyPrefix = dto.companyPrefix;

      // Item reference is the remaining digits between prefix and check digit
      // For GTIN-14: Indicator (1) + Prefix (prefixLength) + ItemRef (remaining) + CheckDigit (1)
      // ItemRef length = 14 - 1 (indicator) - prefixLength - 1 (check digit) = 12 - prefixLength
      const itemRefLength = 12 - prefixLength;
      if (itemRefLength < 1) {
        throw new Error(
          `Company prefix too long for GTIN-14: ${prefixLength} digits. Maximum is 12 digits.`,
        );
      }
      itemRef = normalizedGTIN.substring(1 + prefixLength, 13);
    } else {
      // Fallback: Try to extract prefix (assumes common prefix lengths)
      // This is not ideal - should provide companyPrefix when available
      this.logger.warn(
        'No company prefix provided for SGTIN generation. Attempting extraction (may be inaccurate).',
      );

      // Common prefix lengths: 7, 8, 9, 10, 11, 12
      // Try 8 digits first (most common in our system)
      const assumedPrefixLength = 8;
      const indicatorDigit = normalizedGTIN.substring(0, 1);
      companyPrefix = normalizedGTIN.substring(1, 1 + assumedPrefixLength);
      const itemRefLength = 12 - assumedPrefixLength;
      itemRef = normalizedGTIN.substring(1 + assumedPrefixLength, 13);

      this.logger.warn(
        `Using assumed prefix length of ${assumedPrefixLength} digits. For accuracy, provide companyPrefix.`,
      );
    }

    // Validate item reference length (should be 1-6 digits for GTIN-14)
    if (itemRef.length < 1 || itemRef.length > 6) {
      throw new Error(
        `Invalid item reference length: ${itemRef.length}. Expected 1-6 digits.`,
      );
    }

    const sgtin = `urn:epc:id:sgtin:${companyPrefix}.${itemRef}.${dto.serialNumber}`;

    this.logger.log(
      `Generated SGTIN: ${sgtin} (Company Prefix: ${companyPrefix}, Item Ref: ${itemRef})`,
    );
    return sgtin;
  }

  /**
   * Validate SGTIN format
   * SGTIN format: urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber
   * Company prefix: 6-12 digits
   * Item reference: 1-6 digits
   * Serial number: variable length
   */
  validateSGTIN(sgtin: string): boolean {
    if (!sgtin || !sgtin.startsWith('urn:epc:id:sgtin:')) {
      return false;
    }

    // Extract components
    const parts = sgtin.replace('urn:epc:id:sgtin:', '').split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [companyPrefix, itemRef, serialNumber] = parts;

    // Validate company prefix (6-12 digits)
    if (!/^\d{6,12}$/.test(companyPrefix)) {
      return false;
    }

    // Validate item reference (1-6 digits)
    if (!/^\d{1,6}$/.test(itemRef)) {
      return false;
    }

    // Validate serial number (non-empty)
    if (!serialNumber || serialNumber.trim() === '') {
      return false;
    }

    // Validate total length: prefix + itemRef should be <= 12 (for GTIN-14)
    if (companyPrefix.length + itemRef.length > 12) {
      return false;
    }

    return true;
  }

  /**
   * Parse SGTIN EPC URI to extract components
   */
  parseSGTIN(sgtin: string): {
    companyPrefix: string;
    itemRef: string;
    serialNumber: string;
  } {
    if (!this.validateSGTIN(sgtin)) {
      throw new Error(`Invalid SGTIN format: ${sgtin}`);
    }

    const parts = sgtin.replace('urn:epc:id:sgtin:', '').split('.');
    if (parts.length !== 3) {
      throw new Error(`Invalid SGTIN format: ${sgtin}`);
    }

    return {
      companyPrefix: parts[0],
      itemRef: parts[1],
      serialNumber: parts[2],
    };
  }
}

