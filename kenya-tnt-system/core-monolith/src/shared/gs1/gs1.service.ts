import { Injectable, Logger } from '@nestjs/common';
import { SSCCService } from './sscc.service';
import { SGTINService } from './sgtin.service';
import { BatchNumberService } from './batch-number.service';
import { EPCISEventService } from './epcis-event.service';
import { BarcodeService } from './barcode.service';
import { GLNService } from './gln.service';
import { GCPService } from './gcp.service';
import {
  GenerateSSCCDto,
  GenerateSGTINDto,
  GenerateBatchNumberDto,
  GenerateBarcodeDto,
  ValidateGS1IdentifierDto,
  ValidateGCPDto,
  LookupGCPDto,
  GCPLookupResult,
  ExtractGCPFromIdentifierDto,
} from './dto/gs1.dto';
import {
  BizTransaction,
  QuantityElement,
  SourceDestination,
  SensorElement,
  ErrorDeclaration,
} from '../infrastructure/epcis/types';

// Re-export helpers for convenience
export * from './epcis-helpers';

/**
 * GS1 Service
 *
 * Main service that provides unified access to all GS1 functionality:
 * - SSCC generation
 * - SGTIN generation
 * - Batch number generation
 * - EPCIS event creation
 * - Barcode/QR code generation
 * - GS1 identifier validation
 */
@Injectable()
export class GS1Service {
  private readonly logger = new Logger(GS1Service.name);

  constructor(
    private readonly ssccService: SSCCService,
    private readonly sgtinService: SGTINService,
    private readonly batchNumberService: BatchNumberService,
    private readonly epcisEventService: EPCISEventService,
    private readonly barcodeService: BarcodeService,
    private readonly glnService: GLNService,
    private readonly gcpService: GCPService,
  ) {}

  // SSCC Methods
  async generateSSCC(dto?: GenerateSSCCDto): Promise<string> {
    return this.ssccService.generateSSCC(dto);
  }

  validateSSCC(sscc: string): boolean {
    return this.ssccService.validateSSCC(sscc);
  }

  formatSSCCAsEPCURI(sscc: string, companyPrefix?: string): string {
    return this.ssccService.formatAsEPCURI(sscc, companyPrefix);
  }

  // SGTIN Methods
  generateSGTIN(dto: GenerateSGTINDto): string {
    return this.sgtinService.generateSGTIN(dto);
  }

  validateSGTIN(sgtin: string): boolean {
    return this.sgtinService.validateSGTIN(sgtin);
  }

  parseSGTIN(sgtin: string) {
    return this.sgtinService.parseSGTIN(sgtin);
  }

  // Batch Number Methods
  async generateBatchNumber(dto: GenerateBatchNumberDto): Promise<string> {
    return this.batchNumberService.generateBatchNumber(dto);
  }

  validateBatchNumber(batchNo: string): boolean {
    return this.batchNumberService.validateBatchNumber(batchNo);
  }

  formatBatchNumberAsEPCURI(batchNo: string): string {
    return this.batchNumberService.formatAsEPCURI(batchNo);
  }

  // EPCIS Event Methods
  async createAggregationEvent(
    parentId: string,
    childEPCs: string[],
    options?: {
      bizStep?: string;
      disposition?: string;
      readPoint?: { id: string };
      bizLocation?: { id: string };
      action?: 'ADD' | 'DELETE' | 'OBSERVE';
      // EPCIS standard fields (1.2 and 2.0)
      bizTransactionList?: BizTransaction[];
      quantityList?: QuantityElement[];
      sourceList?: SourceDestination[];
      destinationList?: SourceDestination[];
      sensorElementList?: SensorElement[];
      errorDeclaration?: ErrorDeclaration;
      eventTimeZoneOffset?: string;
      // Location coordinates
      latitude?: number;
      longitude?: number;
      accuracyMeters?: number;
      // Actor context
      actorType?: string;
      actorUserId?: string;
      actorGLN?: string;
      actorOrganization?: string;
      sourceEntityType?: string;
      sourceEntityId?: number;
      // EPCIS 2.0 - ILMD (Instance/Lot Master Data)
      ilmd?: Record<string, any>;
      // EPCIS 2.0 - Extensions
      extensions?: Record<string, any>;
    },
  ): Promise<string> {
    return this.epcisEventService.createAggregationEvent(
      parentId,
      childEPCs,
      options,
    );
  }

  async createObjectEvent(
    epcList: string[],
    options?: {
      bizStep?: string;
      disposition?: string;
      readPoint?: { id: string };
      bizLocation?: { id: string };
      action?: 'ADD' | 'DELETE' | 'OBSERVE';
      // EPCIS standard fields (1.2 and 2.0)
      bizTransactionList?: BizTransaction[];
      quantityList?: QuantityElement[];
      sourceList?: SourceDestination[];
      destinationList?: SourceDestination[];
      sensorElementList?: SensorElement[];
      errorDeclaration?: ErrorDeclaration;
      eventTimeZoneOffset?: string;
      // Location coordinates
      latitude?: number;
      longitude?: number;
      accuracyMeters?: number;
      // Actor context
      actorType?: string;
      actorUserId?: string;
      actorGLN?: string;
      actorOrganization?: string;
      sourceEntityType?: string;
      sourceEntityId?: number;
      // EPCIS 2.0 - ILMD (Instance/Lot Master Data)
      ilmd?: Record<string, any>;
      // EPCIS 2.0 - Extensions
      extensions?: Record<string, any>;
    },
  ): Promise<string> {
    return this.epcisEventService.createObjectEvent(epcList, options);
  }

  // Barcode Methods
  async generateBarcode(dto: GenerateBarcodeDto): Promise<Buffer | string> {
    return this.barcodeService.generateBarcode(dto);
  }

  async generateBarcodeBase64(dto: GenerateBarcodeDto): Promise<string> {
    return this.barcodeService.generateBarcodeBase64(dto);
  }

  async generateQRCode(
    data: string,
    options?: { width?: number; height?: number },
  ): Promise<Buffer> {
    return this.barcodeService.generateQRCode(data, options);
  }

  // GLN Methods
  validateGLN(gln: string): boolean {
    return this.glnService.validateGLN(gln);
  }

  generateGLN(companyPrefix: string, locationReference?: number | string): string {
    return this.glnService.generateGLN(companyPrefix, locationReference);
  }

  generateHQGLN(companyPrefix: string): string {
    return this.glnService.generateHQGLN(companyPrefix);
  }

  generateLocationGLN(companyPrefix: string, locationNumber: number): string {
    return this.glnService.generateLocationGLN(companyPrefix, locationNumber);
  }

  // Validation Methods
  validateGS1Identifier(dto: ValidateGS1IdentifierDto): boolean {
    switch (dto.type) {
      case 'SSCC':
        return this.validateSSCC(dto.identifier);
      case 'SGTIN':
        return this.validateSGTIN(dto.identifier);
      case 'BATCH':
        return this.validateBatchNumber(dto.identifier);
      case 'GTIN':
        return this.sgtinService.validateGTIN(dto.identifier);
      case 'GLN':
        return this.validateGLN(dto.identifier);
      default:
        return false;
    }
  }

  // GCP (Global Company Prefix) Methods
  validateGCP(dto: ValidateGCPDto): { isValid: boolean; message?: string } {
    return this.gcpService.validate(dto);
  }

  async lookupGCP(dto: LookupGCPDto): Promise<GCPLookupResult | null> {
    return this.gcpService.lookup(dto);
  }

  extractGCPFromIdentifier(
    dto: ExtractGCPFromIdentifierDto,
  ): string | null {
    return this.gcpService.extractFromIdentifier(dto);
  }

  clearGCPCache(): void {
    this.gcpService.clearCache();
  }

  getGCPCacheStats(): {
    size: number;
    entries: Array<{ prefix: string; cachedAt: number }>;
  } {
    return this.gcpService.getCacheStats();
  }
}

