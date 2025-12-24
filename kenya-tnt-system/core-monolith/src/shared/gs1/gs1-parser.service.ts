import { Injectable, Logger } from '@nestjs/common';

/**
 * GS1 Barcode Parser Service
 * Parses GS1 Data Matrix, Digital Link, and plain barcodes (GTIN, SSCC)
 * Based on medic-scan-fetch application GS1 parsing logic
 */

export interface GS1ParsedData {
  gtin?: string;
  sscc?: string;
  serial_number?: string;
  expiry_date?: string;
  batch_number?: string;
  production_date?: string;
  best_before_date?: string;
  packaging_date?: string;
  net_weight?: string;
  trade_item_count?: string;
  gdti?: string;
  gsin?: string;
  gln?: string;
  gln_ship_to?: string;
  gln_bill_to?: string;
  gln_purchase_from?: string;
  gln_ship_for?: string;
  gln_physical?: string;
  gln_invoicing?: string;
  raw_data: string;
  code_type?: 'GTIN' | 'SSCC' | 'GDTI' | 'GSIN' | 'GLN';
  format?: 'Traditional' | 'Digital Link' | 'Plain';
  validation_warnings?: string[];
}

@Injectable()
export class GS1ParserService {
  private readonly logger = new Logger(GS1ParserService.name);

  // GS1 AI length constraints per specification
  private readonly AI_MAX_LENGTHS: Record<string, number> = {
    '10': 20,  // Batch/Lot Number: X..20
    '21': 20,  // Serial Number: X..20
    '37': 8,   // Trade Item Count: N..8
    '253': 30, // GDTI: N13 + X..17
    '402': 17, // GSIN: N17
  };

  /**
   * Parse any GS1 barcode format
   * Supports: Traditional Data Matrix, Digital Link, Plain GTIN, Plain SSCC
   */
  parseGS1Barcode(data: string): GS1ParsedData {
    this.logger.log(`Parsing GS1 barcode: ${data.substring(0, 50)}...`);

    // Try GS1 Digital Link format first (URLs starting with http/https)
    if (data.startsWith('http://') || data.startsWith('https://')) {
      const digitalLinkResult = this.parseDigitalLink(data);
      if (digitalLinkResult) {
        this.logger.log('Parsed as Digital Link format');
        return digitalLinkResult;
      }
    }

    // Check if input is plain SSCC (18 digits)
    const plainSsccMatch = data.match(/^(\d{18})$/);
    if (plainSsccMatch) {
      this.logger.log('Parsed as plain SSCC');
      return {
        sscc: plainSsccMatch[1],
        code_type: 'SSCC',
        format: 'Plain',
        raw_data: data,
      };
    }

    // Check if input is just a plain GTIN (8, 12, 13, or 14 digits)
    const plainGtinMatch = data.match(/^(\d{8}|\d{12}|\d{13}|\d{14})$/);
    if (plainGtinMatch) {
      const gtin = plainGtinMatch[1].padStart(14, '0');
      this.logger.log('Parsed as plain GTIN');
      return {
        gtin: gtin,
        code_type: 'GTIN',
        format: 'Plain',
        raw_data: data,
      };
    }

    // Parse traditional GS1 Data Matrix format
    const traditionalResult = this.parseTraditionalFormat(data);
    this.logger.log('Parsed as Traditional format');
    return traditionalResult;
  }

  /**
   * Parse GS1 Digital Link URL format
   */
  private parseDigitalLink(url: string): GS1ParsedData | null {
    try {
      const urlObj = new URL(url);
      
      // GS1 Digital Link must use id.gs1.org domain or contain /01/ or /00/ paths
      if (!urlObj.hostname.includes('gs1.org') && !url.includes('/01/') && !url.includes('/00/')) {
        return null;
      }

      const result: GS1ParsedData = {
        raw_data: url,
        format: 'Digital Link',
      };

      // Parse path segments: /AI/value/AI/value...
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      for (let i = 0; i < pathParts.length; i += 2) {
        const ai = pathParts[i];
        const value = pathParts[i + 1];
        
        if (!value) continue;

        this.parseAIValue(ai, value, result);
      }

      return result;
    } catch (error) {
      this.logger.warn(`Failed to parse Digital Link: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse traditional GS1 Data Matrix format with application identifiers
   */
  private parseTraditionalFormat(data: string): GS1ParsedData {
    const result: GS1ParsedData = {
      raw_data: data,
      format: 'Traditional',
    };

    // Try patterns with parentheses first (human-readable format)
    const patternsWithParens = {
      sscc: /\(00\)(\d{18})/,
      gtin: /\(01\)(\d{8,14})/,
      serialNumber: /\(21\)([^\(]+)/,
      expiryDate: /\(17\)(\d{6})/,
      batchNumber: /\(10\)([^\(]+)/,
      productionDate: /\(11\)(\d{6})/,
      bestBeforeDate: /\(15\)(\d{6})/,
      packagingDate: /\(13\)(\d{6})/,
      netWeight: /\(310(\d)\)(\d+)/,
      tradeItemCount: /\(37\)(\d+)/,
      gdti: /\(253\)(\d{13})([^\(]{0,17})/,
      gsin: /\(402\)(\d{17})/,
      glnShipTo: /\(410\)(\d{13})/,
      glnBillTo: /\(411\)(\d{13})/,
      glnPurchaseFrom: /\(412\)(\d{13})/,
      glnShipFor: /\(413\)(\d{13})/,
      glnPhysical: /\(414\)(\d{13})/,
      glnInvoicing: /\(415\)(\d{13})/,
    };

    // FNC1 format patterns - uses GS (\x1D), RS (\x1E), or US (\x1F) as separators
    const patternsWithoutParens = {
      sscc: /(?:^|[\x1D\x1E\x1F])00(\d{18})/,
      gtin: /(?:^|[\x1D\x1E\x1F])01(\d{14})/,
      serialNumber: /(?:^|[\x1D\x1E\x1F])21([^\x1D\x1E\x1F]+?)(?=[\x1D\x1E\x1F]|$|\d{2}[A-Z0-9])/,
      expiryDate: /(?:^|[\x1D\x1E\x1F])17(\d{6})/,
      batchNumber: /(?:^|[\x1D\x1E\x1F])10([^\x1D\x1E\x1F]+?)(?=[\x1D\x1E\x1F]|$|\d{2}[A-Z0-9])/,
      productionDate: /(?:^|[\x1D\x1E\x1F])11(\d{6})/,
      bestBeforeDate: /(?:^|[\x1D\x1E\x1F])15(\d{6})/,
      packagingDate: /(?:^|[\x1D\x1E\x1F])13(\d{6})/,
      netWeight: /(?:^|[\x1D\x1E\x1F])310(\d)(\d{6})/,
      tradeItemCount: /(?:^|[\x1D\x1E\x1F])37(\d+?)(?=[\x1D\x1E\x1F]|$)/,
      gdti: /(?:^|[\x1D\x1E\x1F])253(\d{13})([^\x1D\x1E\x1F]{0,17})/,
      gsin: /(?:^|[\x1D\x1E\x1F])402(\d{17})/,
      glnShipTo: /(?:^|[\x1D\x1E\x1F])410(\d{13})/,
      glnBillTo: /(?:^|[\x1D\x1E\x1F])411(\d{13})/,
      glnPurchaseFrom: /(?:^|[\x1D\x1E\x1F])412(\d{13})/,
      glnShipFor: /(?:^|[\x1D\x1E\x1F])413(\d{13})/,
      glnPhysical: /(?:^|[\x1D\x1E\x1F])414(\d{13})/,
      glnInvoicing: /(?:^|[\x1D\x1E\x1F])415(\d{13})/,
    };

    // Extract all fields using helper method
    this.extractAllFields(data, result, patternsWithParens, patternsWithoutParens);

    return result;
  }

  /**
   * Extract all GS1 fields from barcode data
   */
  private extractAllFields(
    data: string,
    result: GS1ParsedData,
    patternsWithParens: any,
    patternsWithoutParens: any
  ): void {
    // Extract SSCC (00)
    let match = data.match(patternsWithParens.sscc) || data.match(patternsWithoutParens.sscc);
    if (match) {
      result.sscc = match[1];
      result.code_type = 'SSCC';
    }

    // Extract GTIN (01)
    match = data.match(patternsWithParens.gtin) || data.match(patternsWithoutParens.gtin);
    if (match) {
      result.gtin = match[1].padStart(14, '0');
      if (!result.code_type) result.code_type = 'GTIN';
    }

    // Extract Serial Number (21)
    match = data.match(patternsWithParens.serial_number) || data.match(patternsWithoutParens.serial_number);
    if (match) {
      const warnings: string[] = [];
      result.serial_number = this.validateFieldLength(match[1].trim(), '21', warnings);
      if (warnings.length) result.validation_warnings = [...(result.validation_warnings || []), ...warnings];
    }

    // Extract dates
    this.extractDates(data, result, patternsWithParens, patternsWithoutParens);

    // Extract Batch Number (10)
    match = data.match(patternsWithParens.batchNumber) || data.match(patternsWithoutParens.batchNumber);
    if (match) {
      const warnings: string[] = [];
      result.batch_number = this.validateFieldLength(match[1].trim(), '10', warnings);
      if (warnings.length) result.validation_warnings = [...(result.validation_warnings || []), ...warnings];
    }

    // Extract Net Weight (310n)
    match = data.match(patternsWithParens.netWeight) || data.match(patternsWithoutParens.netWeight);
    if (match) {
      const decimals = parseInt(match[1]);
      const weight = parseFloat(match[2]) / Math.pow(10, decimals);
      result.net_weight = `${weight} kg`;
    }

    // Extract Trade Item Count (37)
    match = data.match(patternsWithParens.tradeItemCount) || data.match(patternsWithoutParens.tradeItemCount);
    if (match) {
      result.trade_item_count = match[1];
    }

    // Extract GDTI (253)
    match = data.match(patternsWithParens.gdti) || data.match(patternsWithoutParens.gdti);
    if (match) {
      result.gdti = match[1] + (match[2] || '');
      result.code_type = 'GDTI';
    }

    // Extract GSIN (402)
    match = data.match(patternsWithParens.gsin) || data.match(patternsWithoutParens.gsin);
    if (match) {
      result.gsin = match[1];
      result.code_type = 'GSIN';
    }

    // Extract GLN variants
    this.extractGLNs(data, result, patternsWithParens, patternsWithoutParens);
  }

  /**
   * Extract date fields from barcode data
   */
  private extractDates(
    data: string,
    result: GS1ParsedData,
    patternsWithParens: any,
    patternsWithoutParens: any
  ): void {
    // Expiry Date (17)
    let match = data.match(patternsWithParens.expiryDate) || data.match(patternsWithoutParens.expiryDate);
    if (match) result.expiry_date = this.formatDate(match[1]);

    // Production Date (11)
    match = data.match(patternsWithParens.productionDate) || data.match(patternsWithoutParens.productionDate);
    if (match) result.production_date = this.formatDate(match[1]);

    // Best Before Date (15)
    match = data.match(patternsWithParens.bestBeforeDate) || data.match(patternsWithoutParens.bestBeforeDate);
    if (match) result.best_before_date = this.formatDate(match[1]);

    // Packaging Date (13)
    match = data.match(patternsWithParens.packagingDate) || data.match(patternsWithoutParens.packagingDate);
    if (match) result.packaging_date = this.formatDate(match[1]);
  }

  /**
   * Parse AI value based on application identifier
   */
  private parseAIValue(ai: string, value: string, result: GS1ParsedData): void {
    const warnings: string[] = [];

    switch (ai) {
      case '01': // GTIN
        result.gtin = value.padStart(14, '0');
        result.code_type = 'GTIN';
        break;
      case '00': // SSCC
        result.sscc = value;
        result.code_type = 'SSCC';
        break;
      case '253': // GDTI
        result.gdti = value;
        result.code_type = 'GDTI';
        break;
      case '402': // GSIN
        result.gsin = value;
        result.code_type = 'GSIN';
        break;
      case '410': result.gln_ship_to = value; if (!result.code_type) result.code_type = 'GLN'; break;
      case '411': result.gln_bill_to = value; if (!result.code_type) result.code_type = 'GLN'; break;
      case '412': result.gln_purchase_from = value; if (!result.code_type) result.code_type = 'GLN'; break;
      case '413': result.gln_ship_for = value; if (!result.code_type) result.code_type = 'GLN'; break;
      case '414': result.gln_physical = value; if (!result.code_type) result.code_type = 'GLN'; break;
      case '415': result.gln_invoicing = value; if (!result.code_type) result.code_type = 'GLN'; break;
      case '21': // Serial Number
        result.serial_number = this.validateFieldLength(decodeURIComponent(value), '21', warnings);
        if (warnings.length) result.validation_warnings = [...(result.validation_warnings || []), ...warnings];
        break;
      case '10': // Batch/Lot
        result.batch_number = this.validateFieldLength(decodeURIComponent(value), '10', warnings);
        if (warnings.length) result.validation_warnings = [...(result.validation_warnings || []), ...warnings];
        break;
      case '17': result.expiry_date = this.formatDate(value); break;
      case '11': result.production_date = this.formatDate(value); break;
      case '15': result.best_before_date = this.formatDate(value); break;
      case '13': result.packaging_date = this.formatDate(value); break;
      case '310': case '3100': case '3101': case '3102': case '3103': 
      case '3104': case '3105': // Net Weight
        const decimals = ai.length === 4 ? parseInt(ai.charAt(3)) : 0;
        const weight = parseFloat(value) / Math.pow(10, decimals);
        result.net_weight = `${weight} kg`;
        break;
      case '37': result.trade_item_count = value; break;
    }
  }

  /**
   * Extract GLN values from barcode data
   */
  private extractGLNs(
    data: string,
    result: GS1ParsedData,
    patternsWithParens: any,
    patternsWithoutParens: any
  ): void {
    const glnFields = [
      { key: 'gln_ship_to', pattern: 'glnShipTo' },
      { key: 'gln_bill_to', pattern: 'glnBillTo' },
      { key: 'gln_purchase_from', pattern: 'glnPurchaseFrom' },
      { key: 'gln_ship_for', pattern: 'glnShipFor' },
      { key: 'gln_physical', pattern: 'glnPhysical' },
      { key: 'gln_invoicing', pattern: 'glnInvoicing' },
    ];

    for (const { key, pattern } of glnFields) {
      const match = data.match(patternsWithParens[pattern]) || data.match(patternsWithoutParens[pattern]);
      if (match) {
        result[key] = match[1];
        if (!result.code_type) result.code_type = 'GLN';
      }
    }
  }

  /**
   * Validate and truncate field to max length
   */
  private validateFieldLength(value: string, ai: string, warnings: string[]): string {
    const maxLength = this.AI_MAX_LENGTHS[ai];
    if (!maxLength) return value;
    
    if (value.length > maxLength) {
      warnings.push(`AI (${ai}) value exceeds max length ${maxLength}: "${value.substring(0, 10)}..." (${value.length} chars)`);
      return value.substring(0, maxLength);
    }
    return value;
  }

  /**
   * Format GS1 date (YYMMDD) to ISO format (YYYY-MM-DD)
   */
  private formatDate(dateStr: string): string {
    if (dateStr.length !== 6) return dateStr;
    const year = `20${dateStr.substring(0, 2)}`;
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    return `${year}-${month}-${day}`;
  }

  /**
   * Validate SSCC check digit using GS1 algorithm
   */
  validateSSCC(sscc: string): boolean {
    if (!/^\d{18}$/.test(sscc)) return false;

    const digits = sscc.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    digits.reverse().forEach((digit, index) => {
      sum += digit * (index % 2 === 0 ? 3 : 1);
    });
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Format GTIN for display
   */
  formatGTIN(gtin: string): string {
    if (!gtin) return '';
    return `${gtin.substring(0, 1)}-${gtin.substring(1, 5)}-${gtin.substring(5, 9)}-${gtin.substring(9, 13)}-${gtin.substring(13)}`;
  }

  /**
   * Format SSCC for display
   */
  formatSSCC(sscc: string): string {
    if (!sscc || sscc.length !== 18) return sscc;
    return `${sscc.slice(0, 1)}-${sscc.slice(1, 10)}-${sscc.slice(10, 17)}-${sscc.slice(17)}`;
  }

  /**
   * Check if parsed data is valid (has at least one identifier)
   */
  isValidGS1Data(data: GS1ParsedData): boolean {
    // More lenient check - accept if we have ANY primary identifier or batch/serial info
    return !!(
      data.gtin || 
      data.sscc || 
      data.serial_number || 
      data.batch_number || 
      data.gdti || 
      data.gsin || 
      data.gln_ship_to || 
      data.gln_bill_to || 
      data.gln_purchase_from || 
      data.gln_ship_for || 
      data.gln_physical || 
      data.gln_invoicing ||
      data.gln
    );
  }
}
