import { Injectable, Logger } from '@nestjs/common';

/**
 * GLN (Global Location Number) Service
 *
 * Generates and validates GS1-compliant GLN identifiers for locations.
 * GLN format: 13 digits
 *   - GS1 Company Prefix (6-12 digits)
 *   - Location Reference (remaining digits to make 12 total)
 *   - Check Digit (1 digit)
 *   Total: 13 digits
 *
 * The check digit is calculated using the GS1 check digit algorithm
 * (same as GTIN-13, EAN-13, etc.)
 */
@Injectable()
export class GLNService {
  private readonly logger = new Logger(GLNService.name);

  /**
   * Calculate GS1 check digit for a 12-digit number (for GLN)
   * Algorithm: Multiply odd positions by 1, even by 3, sum, then calculate check digit
   * Note: For GLN/GTIN-13, positions are counted from right to left
   */
  calculateCheckDigit(number: string): string {
    if (number.length !== 12) {
      throw new Error('GLN base number must be exactly 12 digits');
    }

    const digits = number.split('').map(Number).reverse();
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      // For GTIN-13/GLN: odd positions (from right, 0-indexed) multiply by 1, even by 3
      // This is the opposite of SSCC
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const mod = sum % 10;
    return mod === 0 ? '0' : (10 - mod).toString();
  }

  /**
   * Validate GLN format and check digit
   */
  validateGLN(gln: string): boolean {
    if (!gln || gln.length !== 13) {
      return false;
    }

    if (!/^\d{13}$/.test(gln)) {
      return false;
    }

    const base = gln.substring(0, 12);
    const checkDigit = gln.substring(12);
    const calculatedCheckDigit = this.calculateCheckDigit(base);

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Generate a GLN from company prefix and location reference
   *
   * @param company_prefix GS1 Company Prefix (6-12 digits)
   * @param locationReference Location reference number (will be padded to fit)
   * @returns 13-digit GLN
   */
  generateGLN(
    company_prefix: string,
    locationReference?: number | string,
  ): string {
    // Validate company prefix format (6-12 digits)
    if (!/^\d{6,12}$/.test(company_prefix)) {
      throw new Error(
        `Invalid GS1 Company Prefix: ${company_prefix}. Must be 6-12 digits.`,
      );
    }

    const prefixLength = company_prefix.length;
    // Location reference length = 12 - prefixLength
    const locationRefLength = 12 - prefixLength;

    if (locationRefLength < 1) {
      throw new Error(
        `Company Prefix too long: ${company_prefix}. Maximum length is 12 digits for GLN.`,
      );
    }

    // Generate or use provided location reference
    let locationRef: string;
    if (locationReference !== undefined) {
      const refNum =
        typeof locationReference === 'string'
          ? parseInt(locationReference, 10)
          : locationReference;
      locationRef = refNum.toString().padStart(locationRefLength, '0');
    } else {
      // Generate random location reference
      const maxRef = Math.pow(10, locationRefLength) - 1;
      const randomRef = Math.floor(Math.random() * maxRef);
      locationRef = randomRef.toString().padStart(locationRefLength, '0');
    }

    // Build 12-digit base: Company Prefix + Location Reference
    const base = company_prefix + locationRef;

    if (base.length !== 12) {
      throw new Error(
        `Invalid GLN base length: ${base.length}. Expected 12 digits.`,
      );
    }

    // Calculate check digit
    const checkDigit = this.calculateCheckDigit(base);

    // Final GLN = 12-digit base + 1 check digit = 13 digits total
    const gln = base + checkDigit;

    this.logger.log(
      `Generated GLN: ${gln} (Company Prefix: ${company_prefix}, Location Ref: ${locationRef})`,
    );
    return gln;
  }

  /**
   * Generate HQ GLN (typically uses location reference 0000 or 0001)
   */
  generateHQGLN(company_prefix: string): string {
    return this.generateGLN(company_prefix, 0);
  }

  /**
   * Generate GLN for a specific location (e.g., warehouse, premise)
   */
  generateLocationGLN(
    company_prefix: string,
    locationNumber: number,
  ): string {
    return this.generateGLN(company_prefix, locationNumber);
  }

  /**
   * Extract company prefix from GLN
   * Note: This assumes a standard prefix length. For accurate extraction,
   * you need to know the prefix length or have a lookup table.
   */
  extractCompanyPrefix(gln: string, prefixLength: number): string {
    if (!this.validateGLN(gln)) {
      throw new Error(`Invalid GLN: ${gln}`);
    }

    if (prefixLength < 6 || prefixLength > 12) {
      throw new Error(
        `Invalid prefix length: ${prefixLength}. Must be 6-12 digits.`,
      );
    }

    return gln.substring(0, prefixLength);
  }

  /**
   * Extract location reference from GLN
   */
  extractLocationReference(gln: string, prefixLength: number): string {
    if (!this.validateGLN(gln)) {
      throw new Error(`Invalid GLN: ${gln}`);
    }

    if (prefixLength < 6 || prefixLength > 12) {
      throw new Error(
        `Invalid prefix length: ${prefixLength}. Must be 6-12 digits.`,
      );
    }

    return gln.substring(prefixLength, 12);
  }
}

