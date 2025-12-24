import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerateSSCCDto } from './dto/gs1.dto';
import { Shipment } from '../domain/entities/shipment.entity';
import { Package } from '../domain/entities/package.entity';
import { Case } from '../domain/entities/case.entity';

/**
 * SSCC (Serial Shipping Container Code) Service
 *
 * Generates GS1-compliant SSCC identifiers for shipments.
 * SSCC format: 18 digits
 *   - Extension Digit (1 digit: 0-9)
 *   - GS1 Company Prefix (6-12 digits)
 *   - Serial Reference (remaining digits to make 17 total)
 *   - Check Digit (1 digit)
 * 
 * Uses database to ensure uniqueness across all entities (Shipment, Package, Case)
 */
@Injectable()
export class SSCCService {
  private readonly logger = new Logger(SSCCService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
  ) {}

  /**
   * Calculate GS1 SSCC check digit for a 17-digit number
   * Algorithm: Multiply odd positions by 3, even by 1, sum, then calculate check digit
   */
  calculateCheckDigit(number: string): string {
    if (number.length !== 17) {
      throw new Error('SSCC base number must be exactly 17 digits');
    }

    const digits = number.split('').map(Number).reverse();
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      // Multiply odd positions by 3, even by 1 (index 0 is rightmost digit)
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const mod = sum % 10;
    return mod === 0 ? '0' : (10 - mod).toString();
  }

  /**
   * Validate SSCC format and check digit
   */
  validateSSCC(sscc: string): boolean {
    if (!sscc || sscc.length !== 18) {
      return false;
    }

    if (!/^\d{18}$/.test(sscc)) {
      return false;
    }

    const base = sscc.substring(0, 17);
    const checkDigit = sscc.substring(17);
    const calculatedCheckDigit = this.calculateCheckDigit(base);

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Generate a unique GS1-compliant SSCC
   *
   * GS1 SSCC Structure:
   *   - Extension Digit: 1 digit (0-9, typically 0)
   *   - GS1 Company Prefix: 6-12 digits (provided via dto)
   *   - Serial Reference: remaining digits to make 17 total before check digit
   *   - Check Digit: 1 digit
   *   Total: 18 digits
   *
   * @param dto Company prefix (required for GS1 compliance)
   * @returns 18-digit GS1-compliant SSCC
   */
  async generateSSCC(dto?: GenerateSSCCDto): Promise<string> {
    const company_prefix = dto?.company_prefix;

    if (!company_prefix) {
      this.logger.warn(
        'No GS1 Company Prefix provided. Generating SSCC without prefix (non-GS1 compliant).',
      );
      // Fallback: Generate without prefix (for backward compatibility)
      return this.generateSSCCWithoutPrefix();
    }

    // Validate company prefix format (6-12 digits)
    if (!/^\d{6,12}$/.test(company_prefix)) {
      throw new Error(
        `Invalid GS1 Company Prefix: ${company_prefix}. Must be 6-12 digits.`,
      );
    }

    const prefixLength = company_prefix.length;
    // Serial reference length = 17 - 1 (extension) - prefixLength
    const serialReferenceLength = 16 - prefixLength;

    if (serialReferenceLength < 1) {
      throw new Error(
        `Company Prefix too long: ${company_prefix}. Maximum length is 12 digits for SSCC.`,
      );
    }

    let unique = false;
    let sscc = '';
    let attempts = 0;
    const maxAttempts = 100;

    while (!unique && attempts < maxAttempts) {
      attempts++;

      // Generate random serial reference
      const maxSerial = Math.pow(10, serialReferenceLength) - 1;
      const serialReference = Math.floor(Math.random() * maxSerial)
        .toString()
        .padStart(serialReferenceLength, '0');

      // Extension digit (typically 0, but can be 0-9)
      const extensionDigit = '0';

      // Build 17-digit base: Extension + Company Prefix + Serial Reference
      const base = extensionDigit + company_prefix + serialReference;

      if (base.length !== 17) {
        throw new Error(
          `Invalid SSCC base length: ${base.length}. Expected 17 digits.`,
        );
      }

      // Calculate check digit
      const checkDigit = this.calculateCheckDigit(base);

      // Final SSCC = 17-digit base + 1 check digit = 18 digits total
      const fullSSCC = base + checkDigit;

      // Check if SSCC already exists in database (across all entities)
      const exists = await this.isSSCCExists(fullSSCC);
      if (!exists) {
        sscc = fullSSCC;
        unique = true;
      }
    }

    if (!unique) {
      throw new Error(
        `Failed to generate unique SSCC after ${maxAttempts} attempts`,
      );
    }

    this.logger.log(
      `Generated GS1-compliant SSCC: ${sscc} (Company Prefix: ${company_prefix})`,
    );
    return sscc;
  }

  /**
   * Generate SSCC without GS1 prefix (fallback for backward compatibility)
   * Format: 0 + 16 random digits + 1 check digit = 18 digits
   */
  private async generateSSCCWithoutPrefix(): Promise<string> {
    let unique = false;
    let sscc = '';
    let attempts = 0;
    const maxAttempts = 100;

    while (!unique && attempts < maxAttempts) {
      attempts++;

      // Extension digit (0) + 16 random digits = 17 digits
      const extensionDigit = '0';
      const randomPart = Math.floor(Math.random() * 1e16)
        .toString()
        .padStart(16, '0');
      const base = extensionDigit + randomPart;

      // Calculate check digit
      const checkDigit = this.calculateCheckDigit(base);

      // Final SSCC = 17-digit base + 1 check digit = 18 digits total
      const fullSSCC = base + checkDigit;

      // Check if SSCC already exists in database
      const exists = await this.isSSCCExists(fullSSCC);
      if (!exists) {
        sscc = fullSSCC;
        unique = true;
      }
    }

    if (!unique) {
      throw new Error(
        `Failed to generate unique SSCC after ${maxAttempts} attempts`,
      );
    }

    this.logger.log(`Generated SSCC (without prefix): ${sscc}`);
    return sscc;
  }

  /**
   * Check if SSCC already exists in database (across Shipment, Package, and Case tables)
   * 
   * @param sscc The SSCC to check
   * @returns true if SSCC exists, false otherwise
   */
  private async isSSCCExists(sscc: string): Promise<boolean> {
    try {
      // Check in Shipment table
      const shipmentExists = await this.shipmentRepo.findOne({
        where: { sscc_barcode: sscc },
        select: ['id'],
      });

      if (shipmentExists) {
        return true;
      }

      // Check in Package table
      const packageExists = await this.packageRepo.findOne({
        where: { sscc_barcode: sscc },
        select: ['id'],
      });

      if (packageExists) {
        return true;
      }

      // Check in Case table
      const caseExists = await this.caseRepo.findOne({
        where: { sscc_barcode: sscc },
        select: ['id'],
      });

      if (caseExists) {
        return true;
      }

      return false;
    } catch (error: any) {
      this.logger.error(
        `Error checking SSCC uniqueness: ${error?.message}`,
        error?.stack,
      );
      // On error, assume it exists to be safe (prevents duplicates)
      return true;
    }
  }

  /**
   * Format SSCC as EPC URI
   * Format: urn:epc:id:sscc:CompanyPrefix.SerialReference.CheckDigit
   *
   * Extracts company prefix from SSCC if not provided
   */
  formatAsEPCURI(sscc: string, company_prefix?: string): string {
    if (!this.validateSSCC(sscc)) {
      throw new Error(`Invalid SSCC: ${sscc}`);
    }

    if (company_prefix) {
      // Use provided company prefix
    const extension = sscc.substring(0, 1); // Extension digit
      const prefixLength = company_prefix.length;
      const serialReference = sscc.substring(1 + prefixLength, 17); // Serial reference
    const checkDigit = sscc.substring(17); // Check digit

      return `urn:epc:id:sscc:${company_prefix}.${serialReference}${checkDigit}`;
    } else {
      // Try to extract from SSCC (assumes 8-digit prefix for now)
      // This is a fallback - should provide company_prefix when available
      const extension = sscc.substring(0, 1);
      // Default to 8-digit prefix extraction (most common in our system)
      const assumedPrefixLength = 8;
      const extractedPrefix = sscc.substring(1, 1 + assumedPrefixLength);
      const serialReference = sscc.substring(1 + assumedPrefixLength, 17);
      const checkDigit = sscc.substring(17);

      this.logger.warn(
        `No company prefix provided for EPC URI formatting. Using extracted prefix: ${extractedPrefix}`,
      );
      return `urn:epc:id:sscc:${extractedPrefix}.${serialReference}${checkDigit}`;
    }
  }
}

