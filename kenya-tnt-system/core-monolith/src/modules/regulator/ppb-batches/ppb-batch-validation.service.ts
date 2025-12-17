import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../../shared/domain/entities/supplier.entity';
import { PPBProduct } from '../../../shared/domain/entities/ppb-product.entity';
import { Premise } from '../../../shared/domain/entities/premise.entity';
import { GS1Service } from '../../../shared/gs1/gs1.service';
import { SGTINService } from '../../../shared/gs1/sgtin.service';
import { GLNService } from '../../../shared/gs1/gln.service';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  severity: 'warning';
}

export interface ValidationInfo {
  field: string;
  code: string;
  message: string;
  severity: 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

@Injectable()
export class PPBBatchValidationService {
  private readonly logger = new Logger(PPBBatchValidationService.name);

  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(PPBProduct)
    private readonly productRepo: Repository<PPBProduct>,
    @InjectRepository(Premise)
    private readonly premiseRepo: Repository<Premise>,
    private readonly gs1Service: GS1Service,
    private readonly sgtinService: SGTINService,
    private readonly glnService: GLNService,
  ) {}

  /**
   * Validate PPB batch data
   */
  async validateBatchData(batchData: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
    };

    // 1. Schema Validation
    this.validateSchema(batchData, result);

    // If schema validation fails, stop early
    if (result.errors.length > 0) {
      result.isValid = false;
      return result;
    }

    // 2. GS1 Identifier Format Validation
    this.validateGS1Identifiers(batchData, result);

    // If GS1 format validation fails, stop early
    if (result.errors.length > 0) {
      result.isValid = false;
      return result;
    }

    // 3. Master Data Existence Checks (async)
    await this.validateMasterData(batchData, result);

    // 4. Business Logic Validation
    this.validateBusinessLogic(batchData, result);

    // 5. Data Consistency Checks
    await this.validateDataConsistency(batchData, result);

    // 6. Duplicate Detection
    await this.validateDuplicates(batchData, result);

    // 7. Data Quality Warnings
    this.validateDataQuality(batchData, result);

    // Final validation status
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * 1. Schema Validation
   */
  private validateSchema(batchData: any, result: ValidationResult): void {
    // Required root fields
    if (!batchData.gtin) {
      result.errors.push({
        field: 'gtin',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'GTIN is required',
        severity: 'error',
      });
    }

    if (!batchData.product_name) {
      result.errors.push({
        field: 'product_name',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Product name is required',
        severity: 'error',
      });
    }

    if (!batchData.product_code) {
      result.errors.push({
        field: 'product_code',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Product code is required',
        severity: 'error',
      });
    }

    // Required batch object
    if (!batchData.batch) {
      result.errors.push({
        field: 'batch',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Batch object is required',
        severity: 'error',
      });
      return; // Can't continue without batch object
    }

    // Required batch fields
    if (!batchData.batch.batch_number) {
      result.errors.push({
        field: 'batch.batch_number',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Batch number is required',
        severity: 'error',
      });
    }

    if (!batchData.batch.status) {
      result.errors.push({
        field: 'batch.status',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Batch status is required',
        severity: 'error',
      });
    }

    if (!batchData.batch.expiration_date) {
      result.errors.push({
        field: 'batch.expiration_date',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Expiration date is required',
        severity: 'error',
      });
    }

    if (!batchData.batch.manufacture_date) {
      result.errors.push({
        field: 'batch.manufacture_date',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Manufacture date is required',
        severity: 'error',
      });
    }

    if (batchData.batch.Approval_Status === undefined && batchData.batch.approval_status === undefined) {
      result.errors.push({
        field: 'batch.Approval_Status',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Approval status is required',
        severity: 'error',
      });
    }

    if (!batchData.batch.quantities) {
      result.errors.push({
        field: 'batch.quantities',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Quantities object is required',
        severity: 'error',
      });
    } else {
      if (batchData.batch.quantities.declared_total === undefined || batchData.batch.quantities.declared_total === null) {
        result.errors.push({
          field: 'batch.quantities.declared_total',
          code: 'SCHEMA_MISSING_FIELD',
          message: 'Declared total is required',
          severity: 'error',
        });
      }
    }

    // Required serialization object
    if (!batchData.serialization) {
      result.errors.push({
        field: 'serialization',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Serialization object is required',
        severity: 'error',
      });
    } else {
      if (!batchData.serialization.range) {
        result.errors.push({
          field: 'serialization.range',
          code: 'SERIALIZATION_MISSING',
          message: 'Serialization range is required',
          severity: 'error',
        });
      } else if (!Array.isArray(batchData.serialization.range)) {
        result.errors.push({
          field: 'serialization.range',
          code: 'SCHEMA_INVALID_TYPE',
          message: 'Serialization range must be an array',
          severity: 'error',
        });
      } else if (batchData.serialization.range.length === 0) {
        result.errors.push({
          field: 'serialization.range',
          code: 'SERIALIZATION_MISSING',
          message: 'Serialization range array cannot be empty',
          severity: 'error',
        });
      }
    }

    // Required parties object
    if (!batchData.parties) {
      result.errors.push({
        field: 'parties',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Parties object is required',
        severity: 'error',
      });
      return; // Can't continue without parties
    }

    // Required manufacturer
    if (!batchData.parties.manufacturer) {
      result.errors.push({
        field: 'parties.manufacturer',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Manufacturer is required',
        severity: 'error',
      });
    } else {
      if (!batchData.parties.manufacturer.name) {
        result.errors.push({
          field: 'parties.manufacturer.name',
          code: 'SCHEMA_MISSING_FIELD',
          message: 'Manufacturer name is required',
          severity: 'error',
        });
      }
      if (!batchData.parties.manufacturer.gln) {
        result.errors.push({
          field: 'parties.manufacturer.gln',
          code: 'SCHEMA_MISSING_FIELD',
          message: 'Manufacturer GLN is required',
          severity: 'error',
        });
      }
    }

    // Required importer
    if (!batchData.parties.importer) {
      result.errors.push({
        field: 'parties.importer',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Importer is required',
        severity: 'error',
      });
    } else {
      if (!batchData.parties.importer.name) {
        result.errors.push({
          field: 'parties.importer.name',
          code: 'SCHEMA_MISSING_FIELD',
          message: 'Importer name is required',
          severity: 'error',
        });
      }
      if (!batchData.parties.importer.country) {
        result.errors.push({
          field: 'parties.importer.country',
          code: 'SCHEMA_MISSING_FIELD',
          message: 'Importer country is required',
          severity: 'error',
        });
      }
      if (!batchData.parties.importer.gln) {
        result.errors.push({
          field: 'parties.importer.gln',
          code: 'SCHEMA_MISSING_FIELD',
          message: 'Importer GLN is required',
          severity: 'error',
        });
      }
    }

    // Validate data types
    if (batchData.batch.quantities?.declared_total !== undefined) {
      if (typeof batchData.batch.quantities.declared_total !== 'number' || isNaN(batchData.batch.quantities.declared_total)) {
        result.errors.push({
          field: 'batch.quantities.declared_total',
          code: 'SCHEMA_INVALID_TYPE',
          message: 'Declared total must be a valid number',
          severity: 'error',
        });
      }
    }

    if (batchData.batch.quantities?.declared_sent !== undefined) {
      if (typeof batchData.batch.quantities.declared_sent !== 'number' || isNaN(batchData.batch.quantities.declared_sent)) {
        result.errors.push({
          field: 'batch.quantities.declared_sent',
          code: 'SCHEMA_INVALID_TYPE',
          message: 'Declared sent must be a valid number',
          severity: 'error',
        });
      }
    }

    // Validate batch status enum
    if (batchData.batch.status) {
      const validStatuses = ['active', 'recalled', 'inactive', 'quarantined', 'expired'];
      if (!validStatuses.includes(batchData.batch.status.toLowerCase())) {
        result.errors.push({
          field: 'batch.status',
          code: 'STATUS_INVALID',
          message: `Batch status must be one of: ${validStatuses.join(', ')}`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * 2. GS1 Identifier Format Validation
   */
  private validateGS1Identifiers(batchData: any, result: ValidationResult): void {
    // Validate GTIN
    if (batchData.gtin) {
      if (!this.sgtinService.validateGTIN(batchData.gtin)) {
        result.errors.push({
          field: 'gtin',
          code: 'GTIN_INVALID_CHECK_DIGIT',
          message: 'Invalid GTIN format or check digit',
          severity: 'error',
        });
      }
    }

    // Validate Manufacturer GLN
    if (batchData.parties?.manufacturer?.gln) {
      const manufacturerGLN = this.extractGLNFromEPC(batchData.parties.manufacturer.gln);
      if (!this.glnService.validateGLN(manufacturerGLN)) {
        result.errors.push({
          field: 'parties.manufacturer.gln',
          code: 'GLN_INVALID_CHECK_DIGIT',
          message: 'Invalid manufacturer GLN format or check digit',
          severity: 'error',
        });
      }
    }

    // Validate Importer GLN
    if (batchData.parties?.importer?.gln) {
      const importerGLN = this.extractGLNFromEPC(batchData.parties.importer.gln);
      if (!this.glnService.validateGLN(importerGLN)) {
        result.errors.push({
          field: 'parties.importer.gln',
          code: 'GLN_INVALID_CHECK_DIGIT',
          message: 'Invalid importer GLN format or check digit',
          severity: 'error',
        });
      }
    }

    // Validate Manufacturing Site SGLN
    if (batchData.parties?.manufacturing_site?.sgln) {
      const siteGLN = this.extractGLNFromSGLN(batchData.parties.manufacturing_site.sgln);
      if (siteGLN && !this.glnService.validateGLN(siteGLN)) {
        result.errors.push({
          field: 'parties.manufacturing_site.sgln',
          code: 'SGLN_INVALID_CHECK_DIGIT',
          message: 'Invalid manufacturing site SGLN format or check digit',
          severity: 'error',
        });
      }
    }

    // Validate Final Destination SGLN
    if (batchData.logistics?.final_destination_sgln) {
      const destGLN = this.extractGLNFromSGLN(batchData.logistics.final_destination_sgln);
      if (destGLN && !this.glnService.validateGLN(destGLN)) {
        result.warnings.push({
          field: 'logistics.final_destination_sgln',
          code: 'SGLN_INVALID_CHECK_DIGIT',
          message: 'Invalid final destination SGLN format or check digit',
          severity: 'warning',
        });
      }
    }
  }

  /**
   * 3. Master Data Existence Checks
   */
  private async validateMasterData(batchData: any, result: ValidationResult): Promise<void> {
    // Check product exists
    if (batchData.gtin) {
      const product = await this.productRepo.findOne({
        where: { gtin: batchData.gtin },
      });

      if (!product) {
        result.errors.push({
          field: 'gtin',
          code: 'GTIN_NOT_FOUND',
          message: `Product with GTIN ${batchData.gtin} not found in catalog`,
          severity: 'error',
        });
      } else {
        // Check product name consistency
        const productName = product.brandDisplayName || product.genericDisplayName;
        if (productName && batchData.product_name && productName !== batchData.product_name) {
          result.warnings.push({
            field: 'product_name',
            code: 'PRODUCT_NAME_MISMATCH',
            message: `Product name mismatch. Catalog: "${productName}", Batch: "${batchData.product_name}"`,
            severity: 'warning',
          });
        }

        // Check product code consistency
        if (product.ppbRegistrationCode && batchData.product_code && product.ppbRegistrationCode !== batchData.product_code) {
          result.warnings.push({
            field: 'product_code',
            code: 'PRODUCT_CODE_MISMATCH',
            message: `Product code mismatch. Catalog: "${product.ppbRegistrationCode}", Batch: "${batchData.product_code}"`,
            severity: 'warning',
          });
        }
      }
    }

    // Check manufacturer exists
    if (batchData.parties?.manufacturer) {
      const manufacturerGLN = this.extractGLNFromEPC(batchData.parties.manufacturer.gln);
      const manufacturer = await this.supplierRepo.findOne({
        where: [
          { legalEntityGLN: manufacturerGLN },
          { hqGLN: manufacturerGLN },
          { legalEntityName: batchData.parties.manufacturer.name },
        ],
      });

      if (!manufacturer) {
        result.errors.push({
          field: 'parties.manufacturer',
          code: 'MANUFACTURER_NOT_FOUND',
          message: `Manufacturer "${batchData.parties.manufacturer.name}" not found in master data`,
          severity: 'error',
        });
      } else {
        // Check manufacturer is active
        if (manufacturer.status !== 'Active') {
          result.errors.push({
            field: 'parties.manufacturer',
            code: 'MANUFACTURER_INACTIVE',
            message: `Manufacturer "${manufacturer.legalEntityName}" is not active`,
            severity: 'error',
          });
        }

        // Check manufacturer type
        if (manufacturer.actorType !== 'manufacturer') {
          result.errors.push({
            field: 'parties.manufacturer',
            code: 'MANUFACTURER_INVALID_TYPE',
            message: `Entity "${manufacturer.legalEntityName}" is not a manufacturer`,
            severity: 'error',
          });
        }

        // Check GLN match
        if (manufacturer.legalEntityGLN !== manufacturerGLN && manufacturer.hqGLN !== manufacturerGLN) {
          result.warnings.push({
            field: 'parties.manufacturer.gln',
            code: 'MANUFACTURER_GLN_MISMATCH',
            message: `Manufacturer GLN mismatch with master data`,
            severity: 'warning',
          });
        }

        // Check company prefix consistency with GTIN
        if (manufacturer.gs1Prefix && batchData.gtin) {
          const gtinPrefix = batchData.gtin.substring(0, manufacturer.gs1Prefix.length);
          if (gtinPrefix !== manufacturer.gs1Prefix) {
            result.warnings.push({
              field: 'gtin',
              code: 'COMPANY_PREFIX_MISMATCH',
              message: `GTIN company prefix does not match manufacturer's GS1 prefix`,
              severity: 'warning',
            });
          }
        }
      }
    }

    // Check importer exists
    if (batchData.parties?.importer) {
      const importerGLN = this.extractGLNFromEPC(batchData.parties.importer.gln);
      const importer = await this.supplierRepo.findOne({
        where: [
          { legalEntityGLN: importerGLN },
          { hqGLN: importerGLN },
          { legalEntityName: batchData.parties.importer.name },
        ],
      });

      if (!importer) {
        result.errors.push({
          field: 'parties.importer',
          code: 'IMPORTER_NOT_FOUND',
          message: `Importer "${batchData.parties.importer.name}" not found in master data`,
          severity: 'error',
        });
      } else {
        // Check importer is active
        if (importer.status !== 'Active') {
          result.errors.push({
            field: 'parties.importer',
            code: 'IMPORTER_INACTIVE',
            message: `Importer "${importer.legalEntityName}" is not active`,
            severity: 'error',
          });
        }
      }

      // Validate country code
      if (batchData.parties.importer.country && batchData.parties.importer.country.length !== 2) {
        result.warnings.push({
          field: 'parties.importer.country',
          code: 'INVALID_COUNTRY_CODE',
          message: 'Country code should be 2-letter ISO code',
          severity: 'warning',
        });
      }
    }

    // Check final destination premise exists
    if (batchData.logistics?.final_destination_sgln) {
      const destGLN = this.extractGLNFromSGLN(batchData.logistics.final_destination_sgln);
      if (destGLN) {
        const premise = await this.premiseRepo.findOne({
          where: { gln: destGLN },
        });

        if (!premise) {
          result.warnings.push({
            field: 'logistics.final_destination_sgln',
            code: 'PREMISE_NOT_FOUND',
            message: `Final destination premise not found in master data`,
            severity: 'warning',
          });
        } else if (premise.status !== 'Active') {
          result.warnings.push({
            field: 'logistics.final_destination_sgln',
            code: 'PREMISE_INACTIVE',
            message: `Final destination premise is not active`,
            severity: 'warning',
          });
        }
      }
    }
  }

  /**
   * 4. Business Logic Validation
   */
  private validateBusinessLogic(batchData: any, result: ValidationResult): void {
    // Date validation
    if (batchData.batch?.manufacture_date) {
      const manufactureDate = new Date(batchData.batch.manufacture_date);
      if (isNaN(manufactureDate.getTime())) {
        result.errors.push({
          field: 'batch.manufacture_date',
          code: 'DATE_INVALID_FORMAT',
          message: 'Invalid manufacture date format',
          severity: 'error',
        });
      } else {
        // Check manufacture date is not in future
        if (manufactureDate > new Date()) {
          result.errors.push({
            field: 'batch.manufacture_date',
            code: 'DATE_MANUFACTURE_FUTURE',
            message: 'Manufacture date cannot be in the future',
            severity: 'error',
          });
        }
      }
    }

    if (batchData.batch?.expiration_date) {
      const expirationDate = new Date(batchData.batch.expiration_date);
      if (isNaN(expirationDate.getTime())) {
        result.errors.push({
          field: 'batch.expiration_date',
          code: 'DATE_INVALID_FORMAT',
          message: 'Invalid expiration date format',
          severity: 'error',
        });
      } else if (batchData.batch?.manufacture_date) {
        const manufactureDate = new Date(batchData.batch.manufacture_date);
        if (!isNaN(manufactureDate.getTime()) && expirationDate <= manufactureDate) {
          result.errors.push({
            field: 'batch.expiration_date',
            code: 'DATE_EXPIRATION_BEFORE_MANUFACTURE',
            message: 'Expiration date must be after manufacture date',
            severity: 'error',
          });
        }
      }
    }

    // Approval date validation
    const approvalStatus = batchData.batch?.Approval_Status === 'True' || batchData.batch?.Approval_Status === true || batchData.batch?.approval_status === true;
    if (approvalStatus && !batchData.batch?.Approval_DateStamp && !batchData.batch?.approval_date_stamp) {
      result.errors.push({
        field: 'batch.Approval_DateStamp',
        code: 'SCHEMA_MISSING_FIELD',
        message: 'Approval date stamp is required when approval status is true',
        severity: 'error',
      });
    }

    // Quantity validation
    if (batchData.batch?.quantities?.declared_total !== undefined) {
      const declaredTotal = batchData.batch.quantities.declared_total;
      if (declaredTotal <= 0 || !Number.isInteger(declaredTotal)) {
        result.errors.push({
          field: 'batch.quantities.declared_total',
          code: 'QUANTITY_INVALID',
          message: 'Declared total must be a positive integer',
          severity: 'error',
        });
      }
    }

    if (batchData.batch?.quantities?.declared_sent !== undefined) {
      const declaredSent = batchData.batch.quantities.declared_sent;
      if (declaredSent < 0 || !Number.isInteger(declaredSent)) {
        result.errors.push({
          field: 'batch.quantities.declared_sent',
          code: 'QUANTITY_INVALID',
          message: 'Declared sent must be a non-negative integer',
          severity: 'error',
        });
      } else if (batchData.batch?.quantities?.declared_total !== undefined) {
        const declaredTotal = batchData.batch.quantities.declared_total;
        if (declaredSent > declaredTotal) {
          result.errors.push({
            field: 'batch.quantities.declared_sent',
            code: 'QUANTITY_DECLARED_SENT_EXCEEDS_TOTAL',
            message: 'Declared sent cannot exceed declared total',
            severity: 'error',
          });
        }
      }
    }

    // Serialization range validation
    if (batchData.serialization?.range && Array.isArray(batchData.serialization.range)) {
      // Validate range format
      for (const range of batchData.serialization.range) {
        if (typeof range !== 'string' || range.trim().length === 0) {
          result.errors.push({
            field: 'serialization.range',
            code: 'SERIALIZATION_INVALID_FORMAT',
            message: 'Serialization range must be a non-empty string',
            severity: 'error',
          });
        }
      }

      // Check serialization count vs declared total (warning)
      if (batchData.batch?.quantities?.declared_total) {
        // This is a simplified check - in reality, you'd parse ranges to count serial numbers
        // For now, we'll just warn if ranges seem incomplete
        const isPartialApproval = batchData.serialization.is_partial_approval === true;
        if (!isPartialApproval && batchData.serialization.range.length === 0) {
          result.warnings.push({
            field: 'serialization.range',
            code: 'SERIALIZATION_INCOMPLETE',
            message: 'Serialization ranges appear incomplete for non-partial approval',
            severity: 'warning',
          });
        }
      }
    }
  }

  /**
   * 5. Data Consistency Checks
   */
  private async validateDataConsistency(batchData: any, result: ValidationResult): Promise<void> {
    // Check manufacturing site company prefix matches manufacturer
    if (batchData.parties?.manufacturing_site?.sgln && batchData.parties?.manufacturer?.gln) {
      const manufacturerGLN = this.extractGLNFromEPC(batchData.parties.manufacturer.gln);
      const siteGLN = this.extractGLNFromSGLN(batchData.parties.manufacturing_site.sgln);

      if (siteGLN && manufacturerGLN) {
        // Extract company prefixes (first 6-12 digits)
        // This is simplified - in reality, you'd need to know the prefix length
        const manufacturerPrefix = manufacturerGLN.substring(0, 8); // Assuming 8-digit prefix
        const sitePrefix = siteGLN.substring(0, 8);

        if (manufacturerPrefix !== sitePrefix) {
          result.warnings.push({
            field: 'parties.manufacturing_site.sgln',
            code: 'COMPANY_PREFIX_MISMATCH',
            message: 'Manufacturing site company prefix does not match manufacturer',
            severity: 'warning',
          });
        }
      }
    }
  }

  /**
   * 6. Duplicate Detection
   */
  private async validateDuplicates(batchData: any, result: ValidationResult): Promise<void> {
    // This would check against existing batches in the database
    // For now, we'll just log info if batch exists
    if (batchData.batch?.batch_number) {
      result.info.push({
        field: 'batch.batch_number',
        code: 'DUPLICATE_CHECK',
        message: 'Duplicate check will be performed during save',
        severity: 'info',
      });
    }
  }

  /**
   * 7. Data Quality Warnings
   */
  private validateDataQuality(batchData: any, result: ValidationResult): void {
    // Check for missing optional but recommended fields
    if (!batchData.parties?.manufacturing_site?.sgln) {
      result.warnings.push({
        field: 'parties.manufacturing_site.sgln',
        code: 'MISSING_RECOMMENDED_FIELD',
        message: 'Manufacturing site SGLN is recommended',
        severity: 'warning',
      });
    }

    if (!batchData.logistics?.carrier) {
      result.warnings.push({
        field: 'logistics.carrier',
        code: 'MISSING_RECOMMENDED_FIELD',
        message: 'Carrier information is recommended',
        severity: 'warning',
      });
    }

    if (!batchData.batch?.permit_id) {
      result.warnings.push({
        field: 'batch.permit_id',
        code: 'MISSING_RECOMMENDED_FIELD',
        message: 'Permit ID is recommended',
        severity: 'warning',
      });
    }
  }

  /**
   * Extract numeric GLN from EPC URI format
   */
  private extractGLNFromEPC(glnOrEPC: string): string {
    if (!glnOrEPC) return '';

    // If it's already numeric, return as-is
    if (/^\d{13}$/.test(glnOrEPC)) {
      return glnOrEPC;
    }

    // If it's EPC URI format: urn:epc:id:sgln:CompanyPrefix.LocationRef.CheckDigit
    const sglnMatch = glnOrEPC.match(/urn:epc:id:sgln:(\d+)\.(\d+)\.(\d+)/);
    if (sglnMatch) {
      const companyPrefix = sglnMatch[1];
      const locationRef = sglnMatch[2];
      const checkDigit = sglnMatch[3];
      // Reconstruct 13-digit GLN
      const base = (companyPrefix + locationRef).padStart(12, '0');
      return base + checkDigit;
    }

    return glnOrEPC;
  }

  /**
   * Extract numeric GLN from SGLN EPC URI
   */
  private extractGLNFromSGLN(sgln: string): string | null {
    if (!sgln) return null;

    const match = sgln.match(/urn:epc:id:sgln:(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      const companyPrefix = match[1];
      const locationRef = match[2];
      const checkDigit = match[3];
      const base = (companyPrefix + locationRef).padStart(12, '0');
      return base + checkDigit;
    }

    return null;
  }
}


