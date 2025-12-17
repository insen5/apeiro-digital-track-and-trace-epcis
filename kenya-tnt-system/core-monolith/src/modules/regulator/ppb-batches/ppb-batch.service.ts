import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PPBBatch } from '../../../shared/domain/entities/ppb-batch.entity';
import { PPBBatchValidationService, ValidationResult } from './ppb-batch-validation.service';

@Injectable()
export class PPBBatchService {
  private readonly logger = new Logger(PPBBatchService.name);

  constructor(
    @InjectRepository(PPBBatch)
    private readonly ppbBatchRepo: Repository<PPBBatch>,
    private readonly validationService: PPBBatchValidationService,
  ) {}

  /**
   * Process batch data received from Kafka
   * 
   * @deprecated PPB no longer sends individual batch updates via Kafka.
   * All PPB data comes as full consignment JSON via ppb.consignment.instantiation topic.
   * This method is kept for backward compatibility but is no longer called.
   * Use ConsignmentService.importFromPPB() instead.
   */
  async processBatchFromKafka(batchData: any): Promise<PPBBatch> {
    let validationResult: ValidationResult | null = null;

    try {
      // Perform comprehensive validation
      validationResult = await this.validationService.validateBatchData(batchData);

      // If validation fails, reject the batch
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.map(e => e.message).join('; ');
        this.logger.error(
          `Batch validation failed for ${batchData.batch?.batch_number || 'unknown'}: ${errorMessages}`,
        );

        // Store validation errors in database if batch number exists
        if (batchData.batch?.batch_number) {
          await this.markBatchAsError(
            batchData.batch.batch_number,
            `Validation failed: ${errorMessages}`,
            validationResult,
          );
        }

        throw new Error(`Batch validation failed: ${errorMessages}`);
      }

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        this.logger.warn(
          `Batch ${batchData.batch?.batch_number || 'unknown'} has ${validationResult.warnings.length} validation warnings`,
        );
      }

      // Check if batch already exists
      const existing = await this.ppbBatchRepo.findOne({
        where: { batchNumber: batchData.batch.batch_number },
      });

      // Handle serialization range (convert to array if needed)
      const serializationRanges = this.normalizeSerializationRange(
        batchData.serialization?.range,
      );

      const batchEntity = {
        gtin: batchData.gtin,
        productName: batchData.product_name,
        productCode: batchData.product_code,
        batchNumber: batchData.batch.batch_number,
        status: batchData.batch.status || 'active',
        expirationDate: batchData.batch.expiration_date
          ? new Date(batchData.batch.expiration_date)
          : null,
        manufactureDate: batchData.batch.manufacture_date
          ? new Date(batchData.batch.manufacture_date)
          : null,
        permitId: batchData.batch.permit_id,
        consignmentRefNumber: batchData.batch.consignment_ref_number,
        approvalStatus:
          batchData.batch.Approval_Status === 'True' ||
          batchData.batch.Approval_Status === true ||
          batchData.batch.approval_status === true,
        approvalDateStamp: batchData.batch.Approval_DateStamp || batchData.batch.approval_date_stamp,
        declaredTotal: batchData.batch.quantities?.declared_total,
        declaredSent: batchData.batch.quantities?.declared_sent,
        serializationRange: serializationRanges,
        isPartialApproval: batchData.serialization?.is_partial_approval || false,
        manufacturerName: batchData.parties?.manufacturer?.name,
        manufacturerGln: batchData.parties?.manufacturer?.gln,
        manufacturingSiteSgln: batchData.parties?.manufacturing_site?.sgln,
        manufacturingSiteLabel: batchData.parties?.manufacturing_site?.label,
        importerName: batchData.parties?.importer?.name,
        importerCountry: batchData.parties?.importer?.country,
        importerGln: batchData.parties?.importer?.gln,
        carrier: batchData.logistics?.carrier,
        origin: batchData.logistics?.origin,
        portOfEntry: batchData.logistics?.port_of_entry,
        finalDestinationSgln: batchData.logistics?.final_destination_sgln,
        finalDestinationAddress: batchData.logistics?.final_destination_address,
        processedStatus: validationResult.warnings.length > 0 ? 'WARNING' : 'PROCESSED',
        processingError: null,
        validationErrors: validationResult.errors.length > 0 ? JSON.parse(JSON.stringify(validationResult.errors)) : null,
        validationWarnings: validationResult.warnings.length > 0 ? JSON.parse(JSON.stringify(validationResult.warnings)) : null,
        validationInfo: validationResult.info.length > 0 ? JSON.parse(JSON.stringify(validationResult.info)) : null,
      };

      if (existing) {
        // Update existing batch
        await this.ppbBatchRepo.update(existing.id, batchEntity);
        this.logger.log(
          `Updated PPB batch: ${batchData.batch.batch_number}`,
        );
        return await this.ppbBatchRepo.findOne({ where: { id: existing.id } });
      } else {
        // Create new batch
        const newBatch = this.ppbBatchRepo.create(batchEntity);
        const saved = await this.ppbBatchRepo.save(newBatch);
        this.logger.log(
          `Created PPB batch: ${batchData.batch.batch_number}`,
        );
        return saved;
      }
    } catch (error) {
      this.logger.error(
        `Error processing batch from Kafka: ${error.message}`,
        error.stack,
      );
      // Mark as error in database
      await this.markBatchAsError(
        batchData.batch?.batch_number,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Normalize serialization range to array format
   */
  private normalizeSerializationRange(
    range: string | string[] | undefined,
  ): string[] {
    if (!range) {
      return [];
    }

    if (Array.isArray(range)) {
      return range;
    }

    // Single string - return as array
    return [range];
  }

  /**
   * Mark batch as error
   */
  private async markBatchAsError(
    batchNumber: string | undefined,
    errorMessage: string,
    validationResult?: ValidationResult,
  ): Promise<void> {
    if (!batchNumber) {
      return;
    }

    try {
      const existing = await this.ppbBatchRepo.findOne({
        where: { batchNumber: batchNumber },
      });

      if (existing) {
        await this.ppbBatchRepo.update(existing.id, {
          processedStatus: 'ERROR',
          processingError: errorMessage,
          validationErrors: validationResult?.errors ? JSON.parse(JSON.stringify(validationResult.errors)) : null,
          validationWarnings: validationResult?.warnings ? JSON.parse(JSON.stringify(validationResult.warnings)) : null,
          validationInfo: validationResult?.info ? JSON.parse(JSON.stringify(validationResult.info)) : null,
        } as any);
      } else {
        // Create a new batch record with error status
        const errorBatch = this.ppbBatchRepo.create({
          batchNumber: batchNumber,
          gtin: 'UNKNOWN',
          productName: 'UNKNOWN',
          productCode: 'UNKNOWN',
          status: 'inactive',
          processedStatus: 'ERROR',
          processingError: errorMessage,
          validationErrors: validationResult?.errors ? JSON.parse(JSON.stringify(validationResult.errors)) : null,
          validationWarnings: validationResult?.warnings ? JSON.parse(JSON.stringify(validationResult.warnings)) : null,
          validationInfo: validationResult?.info ? JSON.parse(JSON.stringify(validationResult.info)) : null,
        } as any);
        await this.ppbBatchRepo.save(errorBatch);
      }
    } catch (error) {
      this.logger.error(
        `Failed to mark batch as error: ${error.message}`,
      );
    }
  }

  /**
   * Get batches for a manufacturer (by GLN or name)
   */
  async getBatchesForManufacturer(
    manufacturerGLN?: string,
    manufacturerName?: string,
  ): Promise<PPBBatch[]> {
    const queryBuilder = this.ppbBatchRepo.createQueryBuilder('batch');

    if (manufacturerGLN) {
      queryBuilder.where('batch.manufacturer_gln = :gln', { gln: manufacturerGLN });
    } else if (manufacturerName) {
      queryBuilder.where('batch.manufacturer_name = :name', { name: manufacturerName });
    }

    return queryBuilder
      .orderBy('batch.created_date', 'DESC')
      .getMany();
  }

  /**
   * Get all batches with pagination
   */
  async getAllBatches(
    page: number = 1,
    limit: number = 50,
    search?: string,
  ): Promise<{ batches: PPBBatch[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.ppbBatchRepo.createQueryBuilder('batch');

    if (search) {
      queryBuilder.where(
        '(batch.batch_number ILIKE :search OR batch.product_name ILIKE :search OR batch.manufacturer_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [batches, total] = await queryBuilder
      .orderBy('batch.created_date', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      batches,
      total,
      page,
      limit,
    };
  }

  /**
   * Get batch by ID
   */
  async getBatchById(id: number): Promise<PPBBatch> {
    return this.ppbBatchRepo.findOne({ where: { id } });
  }
}

