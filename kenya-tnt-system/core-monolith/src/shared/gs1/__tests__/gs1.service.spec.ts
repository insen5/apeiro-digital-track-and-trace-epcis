import { Test, TestingModule } from '@nestjs/testing';
import { GS1Service } from '../gs1.service';
import { SSCCService } from '../sscc.service';
import { SGTINService } from '../sgtin.service';
import { BatchNumberService } from '../batch-number.service';
import { EPCISEventService } from '../epcis-event.service';
import { BarcodeService } from '../barcode.service';
import { GLNService } from '../gln.service';
import { GCPService } from '../gcp.service';

describe('GS1Service', () => {
  let service: GS1Service;
  let ssccService: jest.Mocked<SSCCService>;
  let sgtinService: jest.Mocked<SGTINService>;
  let batchNumberService: jest.Mocked<BatchNumberService>;
  let epcisEventService: jest.Mocked<EPCISEventService>;
  let barcodeService: jest.Mocked<BarcodeService>;
  let glnService: jest.Mocked<GLNService>;
  let gcpService: jest.Mocked<GCPService>;

  const mockCompanyPrefix = '0614141';
  const mockSSCC = '006141411234567895';
  const mockSGTIN = '00614141123456789012';
  const mockGTIN = '06141411234567';
  const mockBatchNumber = 'LOT12345';
  const mockGLN = '0614141123452';

  beforeEach(async () => {
    // Create mocks
    ssccService = {
      generateSSCC: jest.fn(),
      validateSSCC: jest.fn(),
      formatAsEPCURI: jest.fn(),
    } as any;

    sgtinService = {
      generateSGTIN: jest.fn(),
      validateSGTIN: jest.fn(),
      parseSGTIN: jest.fn(),
      validateGTIN: jest.fn(),
    } as any;

    batchNumberService = {
      generateBatchNumber: jest.fn(),
      validateBatchNumber: jest.fn(),
      formatAsEPCURI: jest.fn(),
    } as any;

    epcisEventService = {
      createAggregationEvent: jest.fn(),
      createObjectEvent: jest.fn(),
    } as any;

    barcodeService = {
      generateBarcode: jest.fn(),
      generateBarcodeBase64: jest.fn(),
      generateQRCode: jest.fn(),
    } as any;

    glnService = {
      validateGLN: jest.fn(),
      generateGLN: jest.fn(),
      generateHQGLN: jest.fn(),
      generateLocationGLN: jest.fn(),
    } as any;

    gcpService = {
      validate: jest.fn(),
      lookup: jest.fn(),
      extractFromIdentifier: jest.fn(),
      clearCache: jest.fn(),
      getCacheStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GS1Service,
        { provide: SSCCService, useValue: ssccService },
        { provide: SGTINService, useValue: sgtinService },
        { provide: BatchNumberService, useValue: batchNumberService },
        { provide: EPCISEventService, useValue: epcisEventService },
        { provide: BarcodeService, useValue: barcodeService },
        { provide: GLNService, useValue: glnService },
        { provide: GCPService, useValue: gcpService },
      ],
    }).compile();

    service = module.get<GS1Service>(GS1Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SSCC Operations', () => {
    it('should generate SSCC', async () => {
      ssccService.generateSSCC.mockResolvedValue(mockSSCC);

      const result = await service.generateSSCC({ companyPrefix: mockCompanyPrefix });

      expect(result).toBe(mockSSCC);
      expect(ssccService.generateSSCC).toHaveBeenCalledWith({ companyPrefix: mockCompanyPrefix });
    });

    it('should validate valid SSCC', () => {
      ssccService.validateSSCC.mockReturnValue(true);

      const result = service.validateSSCC(mockSSCC);

      expect(result).toBe(true);
      expect(ssccService.validateSSCC).toHaveBeenCalledWith(mockSSCC);
    });

    it('should reject invalid SSCC', () => {
      ssccService.validateSSCC.mockReturnValue(false);

      const result = service.validateSSCC('123456789012345678');

      expect(result).toBe(false);
    });

    it('should format SSCC as EPC URI', () => {
      const mockEPCURI = 'urn:epc:id:sscc:0614141.1234567895';
      ssccService.formatAsEPCURI.mockReturnValue(mockEPCURI);

      const result = service.formatSSCCAsEPCURI(mockSSCC, mockCompanyPrefix);

      expect(result).toBe(mockEPCURI);
      expect(ssccService.formatAsEPCURI).toHaveBeenCalledWith(mockSSCC, mockCompanyPrefix);
    });
  });

  describe('SGTIN Operations', () => {
    it('should generate SGTIN', () => {
      sgtinService.generateSGTIN.mockReturnValue(mockSGTIN);

      const dto = {
        gtin: mockGTIN,
        serialNumber: '789012',
        companyPrefix: mockCompanyPrefix,
      };
      const result = service.generateSGTIN(dto);

      expect(result).toBe(mockSGTIN);
      expect(sgtinService.generateSGTIN).toHaveBeenCalledWith(dto);
    });

    it('should validate valid SGTIN', () => {
      sgtinService.validateSGTIN.mockReturnValue(true);

      const result = service.validateSGTIN(mockSGTIN);

      expect(result).toBe(true);
      expect(sgtinService.validateSGTIN).toHaveBeenCalledWith(mockSGTIN);
    });

    it('should parse SGTIN', () => {
      const mockParsed = {
        companyPrefix: mockCompanyPrefix,
        itemRef: '123456',
        serialNumber: '789012',
      };
      sgtinService.parseSGTIN.mockReturnValue(mockParsed);

      const result = service.parseSGTIN(mockSGTIN);

      expect(result).toEqual(mockParsed);
      expect(sgtinService.parseSGTIN).toHaveBeenCalledWith(mockSGTIN);
    });
  });

  describe('Batch Number Operations', () => {
    it('should generate batch number', async () => {
      batchNumberService.generateBatchNumber.mockResolvedValue(mockBatchNumber);

      const dto = { productId: 12345, userId: 'user-123', prefix: 'LOT' };
      const result = await service.generateBatchNumber(dto);

      expect(result).toBe(mockBatchNumber);
      expect(batchNumberService.generateBatchNumber).toHaveBeenCalledWith(dto);
    });

    it('should validate batch number', () => {
      batchNumberService.validateBatchNumber.mockReturnValue(true);

      const result = service.validateBatchNumber(mockBatchNumber);

      expect(result).toBe(true);
      expect(batchNumberService.validateBatchNumber).toHaveBeenCalledWith(mockBatchNumber);
    });

    it('should format batch number as EPC URI', () => {
      const mockEPCURI = 'urn:epc:id:lgtin:0614141.123456.LOT12345';
      batchNumberService.formatAsEPCURI.mockReturnValue(mockEPCURI);

      const result = service.formatBatchNumberAsEPCURI(mockBatchNumber);

      expect(result).toBe(mockEPCURI);
    });
  });

  describe('EPCIS Event Operations', () => {
    it('should create aggregation event', async () => {
      const mockEventId = 'event-12345';
      epcisEventService.createAggregationEvent.mockResolvedValue(mockEventId);

      const parentId = mockSSCC;
      const childEPCs = [mockSGTIN, mockSGTIN + '1'];
      const options = {
        bizStep: 'packing',
        disposition: 'in_progress',
        action: 'ADD' as const,
      };

      const result = await service.createAggregationEvent(parentId, childEPCs, options);

      expect(result).toBe(mockEventId);
      expect(epcisEventService.createAggregationEvent).toHaveBeenCalledWith(
        parentId,
        childEPCs,
        options
      );
    });

    it('should create object event', async () => {
      const mockEventId = 'event-67890';
      epcisEventService.createObjectEvent.mockResolvedValue(mockEventId);

      const epcList = [mockSGTIN];
      const options = {
        bizStep: 'shipping',
        disposition: 'in_transit',
        action: 'OBSERVE' as const,
      };

      const result = await service.createObjectEvent(epcList, options);

      expect(result).toBe(mockEventId);
      expect(epcisEventService.createObjectEvent).toHaveBeenCalledWith(epcList, options);
    });
  });

  describe('Barcode Operations', () => {
    it('should generate barcode as buffer', async () => {
      const mockBuffer = Buffer.from('barcode-data');
      barcodeService.generateBarcode.mockResolvedValue(mockBuffer);

      const dto = { data: mockGTIN, format: 'code128' as const };
      const result = await service.generateBarcode(dto);

      expect(result).toBe(mockBuffer);
      expect(barcodeService.generateBarcode).toHaveBeenCalledWith(dto);
    });

    it('should generate barcode as base64', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANS...';
      barcodeService.generateBarcodeBase64.mockResolvedValue(mockBase64);

      const dto = { data: mockGTIN, format: 'code128' as const };
      const result = await service.generateBarcodeBase64(dto);

      expect(result).toBe(mockBase64);
      expect(barcodeService.generateBarcodeBase64).toHaveBeenCalledWith(dto);
    });

    it('should generate QR code', async () => {
      const mockQRBuffer = Buffer.from('qr-code-data');
      barcodeService.generateQRCode.mockResolvedValue(mockQRBuffer);

      const data = 'https://id.gs1.org/01/06141411234567';
      const options = { width: 200, height: 200 };
      const result = await service.generateQRCode(data, options);

      expect(result).toBe(mockQRBuffer);
      expect(barcodeService.generateQRCode).toHaveBeenCalledWith(data, options);
    });
  });

  describe('GLN Operations', () => {
    it('should validate GLN', () => {
      glnService.validateGLN.mockReturnValue(true);

      const result = service.validateGLN(mockGLN);

      expect(result).toBe(true);
      expect(glnService.validateGLN).toHaveBeenCalledWith(mockGLN);
    });

    it('should generate GLN', () => {
      glnService.generateGLN.mockReturnValue(mockGLN);

      const result = service.generateGLN(mockCompanyPrefix, 12345);

      expect(result).toBe(mockGLN);
      expect(glnService.generateGLN).toHaveBeenCalledWith(mockCompanyPrefix, 12345);
    });

    it('should generate HQ GLN', () => {
      const mockHQGLN = '0614141000009';
      glnService.generateHQGLN.mockReturnValue(mockHQGLN);

      const result = service.generateHQGLN(mockCompanyPrefix);

      expect(result).toBe(mockHQGLN);
      expect(glnService.generateHQGLN).toHaveBeenCalledWith(mockCompanyPrefix);
    });

    it('should generate location GLN', () => {
      const locationGLN = '0614141000108';
      glnService.generateLocationGLN.mockReturnValue(locationGLN);

      const result = service.generateLocationGLN(mockCompanyPrefix, 10);

      expect(result).toBe(locationGLN);
      expect(glnService.generateLocationGLN).toHaveBeenCalledWith(mockCompanyPrefix, 10);
    });
  });

  describe('GS1 Identifier Validation', () => {
    it('should validate SSCC identifier', () => {
      ssccService.validateSSCC.mockReturnValue(true);

      const result = service.validateGS1Identifier({
        type: 'SSCC',
        identifier: mockSSCC,
      });

      expect(result).toBe(true);
      expect(ssccService.validateSSCC).toHaveBeenCalledWith(mockSSCC);
    });

    it('should validate SGTIN identifier', () => {
      sgtinService.validateSGTIN.mockReturnValue(true);

      const result = service.validateGS1Identifier({
        type: 'SGTIN',
        identifier: mockSGTIN,
      });

      expect(result).toBe(true);
    });

    it('should validate GTIN identifier', () => {
      sgtinService.validateGTIN.mockReturnValue(true);

      const result = service.validateGS1Identifier({
        type: 'GTIN',
        identifier: mockGTIN,
      });

      expect(result).toBe(true);
    });

    it('should validate GLN identifier', () => {
      glnService.validateGLN.mockReturnValue(true);

      const result = service.validateGS1Identifier({
        type: 'GLN',
        identifier: mockGLN,
      });

      expect(result).toBe(true);
    });

    it('should validate batch number identifier', () => {
      batchNumberService.validateBatchNumber.mockReturnValue(true);

      const result = service.validateGS1Identifier({
        type: 'BATCH',
        identifier: mockBatchNumber,
      });

      expect(result).toBe(true);
    });

    it('should return false for unknown identifier type', () => {
      const result = service.validateGS1Identifier({
        type: 'UNKNOWN' as any,
        identifier: '12345',
      });

      expect(result).toBe(false);
    });
  });

  describe('GCP Operations', () => {
    it('should validate GCP', () => {
      const mockValidation = { isValid: true };
      gcpService.validate.mockReturnValue(mockValidation);

      const dto = { prefix: mockCompanyPrefix };
      const result = service.validateGCP(dto);

      expect(result).toEqual(mockValidation);
      expect(gcpService.validate).toHaveBeenCalledWith(dto);
    });

    it('should return validation error for invalid GCP', () => {
      const mockValidation = {
        isValid: false,
        message: 'Company prefix must be 7-12 digits',
      };
      gcpService.validate.mockReturnValue(mockValidation);

      const result = service.validateGCP({ prefix: '123' });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('7-12 digits');
    });

    it('should lookup GCP', async () => {
      const mockLookup = {
        prefix: mockCompanyPrefix,
        companyName: 'Test Company Ltd',
        country: 'KE',
      };
      gcpService.lookup.mockResolvedValue(mockLookup as any);

      const dto = { prefix: mockCompanyPrefix };
      const result = await service.lookupGCP(dto);

      expect(result).toEqual(mockLookup);
      expect(gcpService.lookup).toHaveBeenCalledWith(dto);
    });

    it('should return null for GCP not found', async () => {
      gcpService.lookup.mockResolvedValue(null);

      const result = await service.lookupGCP({ prefix: '9999999' });

      expect(result).toBeNull();
    });

    it('should extract GCP from identifier', () => {
      gcpService.extractFromIdentifier.mockReturnValue(mockCompanyPrefix);

      const dto = { identifier: mockSSCC, prefixLength: 7 };
      const result = service.extractGCPFromIdentifier(dto);

      expect(result).toBe(mockCompanyPrefix);
      expect(gcpService.extractFromIdentifier).toHaveBeenCalledWith(dto);
    });

    it('should clear GCP cache', () => {
      service.clearGCPCache();

      expect(gcpService.clearCache).toHaveBeenCalled();
    });

    it('should get GCP cache stats', () => {
      const mockStats = {
        size: 5,
        entries: [
          { prefix: '0614141', cachedAt: Date.now() },
          { prefix: '0614142', cachedAt: Date.now() },
        ],
      };
      gcpService.getCacheStats.mockReturnValue(mockStats);

      const result = service.getGCPCacheStats();

      expect(result).toEqual(mockStats);
      expect(result.size).toBe(5);
      expect(result.entries).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty SSCC generation', async () => {
      ssccService.generateSSCC.mockResolvedValue('');

      const result = await service.generateSSCC();

      expect(result).toBe('');
    });

    it('should handle null validation results', () => {
      ssccService.validateSSCC.mockReturnValue(false);

      const result = service.validateSSCC('');

      expect(result).toBe(false);
    });

    it('should handle barcode generation errors', async () => {
      barcodeService.generateBarcode.mockRejectedValue(
        new Error('Invalid barcode format')
      );

      await expect(
        service.generateBarcode({ data: '', format: 'code128' })
      ).rejects.toThrow('Invalid barcode format');
    });

    it('should handle EPCIS event creation errors', async () => {
      epcisEventService.createObjectEvent.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.createObjectEvent([])).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
