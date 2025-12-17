import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../domain/entities/supplier.entity';
import { LogisticsProvider } from '../domain/entities/logistics-provider.entity';
import {
  ValidateGCPDto,
  LookupGCPDto,
  GCPLookupResult,
  ExtractGCPFromIdentifierDto,
} from './dto/gs1.dto';

/**
 * GCP (Global Company Prefix) Service
 *
 * Provides validation and lookup services for GS1 Company Prefixes.
 * Note: This service does NOT assign prefixes - GS1 assigns these.
 * This service only validates and looks up existing prefixes.
 */
@Injectable()
export class GCPService {
  private readonly logger = new Logger(GCPService.name);
  private readonly prefixCache = new Map<string, GCPLookupResult | null>();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour
  private readonly cacheTimestamps = new Map<string, number>();

  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(LogisticsProvider)
    private readonly logisticsProviderRepo: Repository<LogisticsProvider>,
  ) {}

  /**
   * Validate company prefix format
   * GS1 Company Prefix must be 6-12 digits
   *
   * @param prefix Company prefix to validate
   * @returns true if format is valid, false otherwise
   */
  validateFormat(prefix: string): boolean {
    if (!prefix || typeof prefix !== 'string') {
      return false;
    }

    // Must be 6-12 digits
    return /^\d{6,12}$/.test(prefix);
  }

  /**
   * Validate company prefix (format validation)
   *
   * @param dto Validation request
   * @returns Validation result
   */
  validate(dto: ValidateGCPDto): { isValid: boolean; message?: string } {
    const isValid = this.validateFormat(dto.prefix);

    if (!isValid) {
      return {
        isValid: false,
        message: `Invalid company prefix format: ${dto.prefix}. Must be 6-12 digits.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Lookup company information from prefix
   * Searches in suppliers and logistics_providers tables
   * Uses caching for performance
   *
   * @param dto Lookup request
   * @returns Company information or null if not found
   */
  async lookup(dto: LookupGCPDto): Promise<GCPLookupResult | null> {
    // Validate format first
    if (!this.validateFormat(dto.prefix)) {
      this.logger.warn(`Invalid prefix format for lookup: ${dto.prefix}`);
      return null;
    }

    // Check cache first
    if (!dto.forceRefresh) {
      const cached = this.getCached(dto.prefix);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Lookup in database
    let result: GCPLookupResult | null = null;

    // Search in suppliers table
    const supplier = await this.supplierRepo.findOne({
      where: { gs1Prefix: dto.prefix },
    });

    if (supplier) {
      result = {
        prefix: dto.prefix,
        companyName: supplier.legalEntityName,
        entityId: supplier.entityId,
        entityType: supplier.actorType,
        gln: supplier.legalEntityGLN || supplier.hqGLN || undefined,
        contactEmail: supplier.contactEmail || undefined,
        contactPhone: supplier.contactPhone || undefined,
        status: supplier.status,
        source: 'supplier',
      };
    } else {
      // Search in logistics_providers table
      const logisticsProvider = await this.logisticsProviderRepo.findOne({
        where: { gs1Prefix: dto.prefix },
      });

      if (logisticsProvider) {
        result = {
          prefix: dto.prefix,
          companyName: logisticsProvider.name,
          entityId: logisticsProvider.lspId,
          entityType: 'logistics_provider',
          gln: logisticsProvider.gln || undefined,
          contactEmail: logisticsProvider.contactEmail || undefined,
          contactPhone: logisticsProvider.contactPhone || undefined,
          status: logisticsProvider.status,
          source: 'logistics_provider',
        };
      }
    }

    // Cache result (even if null)
    this.setCached(dto.prefix, result);

    if (result) {
      this.logger.log(
        `Found company for prefix ${dto.prefix}: ${result.companyName} (${result.entityType})`,
      );
    } else {
      this.logger.debug(`No company found for prefix: ${dto.prefix}`);
    }

    return result;
  }

  /**
   * Extract company prefix from a GS1 identifier
   * Supports: GTIN, GLN, SSCC, SGTIN (EPC URI format)
   *
   * @param dto Identifier and expected prefix length
   * @returns Extracted prefix or null if extraction fails
   */
  extractFromIdentifier(
    dto: ExtractGCPFromIdentifierDto,
  ): string | null {
    const { identifier, prefixLength } = dto;

    if (!identifier || !prefixLength) {
      return null;
    }

    // Validate prefix length
    if (prefixLength < 6 || prefixLength > 12) {
      this.logger.warn(
        `Invalid prefix length: ${prefixLength}. Must be 6-12 digits.`,
      );
      return null;
    }

    try {
      // Handle EPC URI formats
      if (identifier.startsWith('urn:epc:id:')) {
        return this.extractFromEPCURI(identifier, prefixLength);
      }

      // Handle numeric identifiers (GTIN, GLN, SSCC)
      if (/^\d+$/.test(identifier)) {
        return this.extractFromNumeric(identifier, prefixLength);
      }

      this.logger.warn(`Unsupported identifier format: ${identifier}`);
      return null;
    } catch (error: any) {
      this.logger.error(
        `Error extracting prefix from identifier: ${error?.message}`,
      );
      return null;
    }
  }

  /**
   * Extract prefix from EPC URI format
   * Examples:
   * - urn:epc:id:sgtin:61640040.12345.67890
   * - urn:epc:id:sscc:61640040.123456789
   * - urn:epc:id:sgln:61640040.0000.0
   */
  private extractFromEPCURI(epcUri: string, prefixLength: number): string | null {
    // Remove urn:epc:id: prefix
    const withoutPrefix = epcUri.replace('urn:epc:id:', '');
    const parts = withoutPrefix.split(':');

    if (parts.length !== 2) {
      return null;
    }

    const [, components] = parts;
    const componentParts = components.split('.');

    if (componentParts.length === 0) {
      return null;
    }

    // First component is the company prefix
    const extractedPrefix = componentParts[0];

    // Validate extracted prefix length matches expected
    if (extractedPrefix.length !== prefixLength) {
      this.logger.warn(
        `Extracted prefix length (${extractedPrefix.length}) does not match expected (${prefixLength})`,
      );
      // Still return it, but log warning
    }

    return this.validateFormat(extractedPrefix) ? extractedPrefix : null;
  }

  /**
   * Extract prefix from numeric identifier
   * For GTIN-14: Skip indicator digit (position 0), then take prefixLength
   * For GLN: Take first prefixLength digits
   * For SSCC: Skip extension digit (position 0), then take prefixLength
   */
  private extractFromNumeric(
    identifier: string,
    prefixLength: number,
  ): string | null {
    // For GTIN-14 (14 digits), skip indicator digit
    if (identifier.length === 14) {
      const prefix = identifier.substring(1, 1 + prefixLength);
      return this.validateFormat(prefix) ? prefix : null;
    }

    // For GLN (13 digits), take first prefixLength digits
    if (identifier.length === 13) {
      const prefix = identifier.substring(0, prefixLength);
      return this.validateFormat(prefix) ? prefix : null;
    }

    // For SSCC (18 digits), skip extension digit
    if (identifier.length === 18) {
      const prefix = identifier.substring(1, 1 + prefixLength);
      return this.validateFormat(prefix) ? prefix : null;
    }

    // For other lengths, try to extract from start
    if (identifier.length >= prefixLength) {
      const prefix = identifier.substring(0, prefixLength);
      return this.validateFormat(prefix) ? prefix : null;
    }

    return null;
  }

  /**
   * Get cached lookup result
   */
  private getCached(prefix: string): GCPLookupResult | null | undefined {
    const timestamp = this.cacheTimestamps.get(prefix);
    if (!timestamp) {
      return undefined; // Not in cache
    }

    // Check if cache expired
    const now = Date.now();
    if (now - timestamp > this.CACHE_TTL_MS) {
      this.prefixCache.delete(prefix);
      this.cacheTimestamps.delete(prefix);
      return undefined; // Cache expired
    }

    return this.prefixCache.get(prefix);
  }

  /**
   * Set cached lookup result
   */
  private setCached(prefix: string, result: GCPLookupResult | null): void {
    this.prefixCache.set(prefix, result);
    this.cacheTimestamps.set(prefix, Date.now());
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.prefixCache.clear();
    this.cacheTimestamps.clear();
    this.logger.log('GCP lookup cache cleared');
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ prefix: string; cachedAt: number }>;
  } {
    const entries = Array.from(this.cacheTimestamps.entries()).map(
      ([prefix, timestamp]) => ({
        prefix,
        cachedAt: timestamp,
      }),
    );

    return {
      size: this.prefixCache.size,
      entries,
    };
  }
}

