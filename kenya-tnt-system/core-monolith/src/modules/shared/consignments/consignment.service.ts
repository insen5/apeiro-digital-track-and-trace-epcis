import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Consignment } from '../../../shared/domain/entities/consignment.entity';
import { ConsignmentBatch } from '../../../shared/domain/entities/consignment-batch.entity';
import { SerialNumber } from '../../../shared/domain/entities/serial-number.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { PPBProduct } from '../../../shared/domain/entities/ppb-product.entity';
import { PPBBatch } from '../../../shared/domain/entities/ppb-batch.entity';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { CasesProducts } from '../../../shared/domain/entities/cases-products.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { ProductStatus } from '../../../shared/domain/entities/product-status.entity';
import { ImportPPBConsignmentDto, PPBItemType } from './dto/import-ppb-consignment.dto';
import { MasterDataService } from '../master-data/master-data.service';
import { BatchService } from '../../manufacturer/batches/batch.service';
import { GS1Service, createBizTransaction, createQuantity, BizTransactionType, UnitOfMeasure } from '../../../shared/gs1/gs1.service';

/**
 * Filter options for consignment queries
 */
export interface ConsignmentFilter {
  manufacturerGLN?: string;
  manufacturerPPBID?: string;
  userId?: string;
  // Add more filters as needed
}

interface ProcessedItem {
  item: any;
  shipment?: Shipment;
  package?: Package;
  case?: Case;
  batch?: Batch;
}

@Injectable()
export class ConsignmentService {
  private readonly logger = new Logger(ConsignmentService.name);

  constructor(
    @InjectRepository(Consignment)
    private readonly consignmentRepo: Repository<Consignment>,
    @InjectRepository(ConsignmentBatch)
    private readonly consignmentBatchRepo: Repository<ConsignmentBatch>,
    @InjectRepository(SerialNumber)
    private readonly serialNumberRepo: Repository<SerialNumber>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(PPBProduct)
    private readonly productRepo: Repository<PPBProduct>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(CasesProducts)
    private readonly casesProductsRepo: Repository<CasesProducts>,
    private readonly masterDataService: MasterDataService,
    private readonly batchService: BatchService,
    private readonly gs1Service: GS1Service,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Expand serialization ranges to individual serial numbers
   * Handles both ranges (start-end) and explicit serials
   */
  private expandSerialization(serialization?: {
    ranges?: Array<{ start: string; end: string; count?: number }>;
    explicit?: string[];
  }): string[] {
    const serials: string[] = [];

    // Process explicit serials
    if (serialization?.explicit && serialization.explicit.length > 0) {
      serials.push(...serialization.explicit);
    }

    // Process ranges
    if (serialization?.ranges && serialization.ranges.length > 0) {
      for (const range of serialization.ranges) {
        const start = range.start;
        const end = range.end;

        // Try to extract numeric parts for range expansion
        // Format: "SN-METFORMIN-001" -> extract "001" part
        const startMatch = start.match(/(\d+)$/);
        const endMatch = end.match(/(\d+)$/);
        const prefix = start.replace(/\d+$/, '');

        if (startMatch && endMatch) {
          const startNum = parseInt(startMatch[1], 10);
          const endNum = parseInt(endMatch[1], 10);

          // Generate serials in range
          for (let i = startNum; i <= endNum; i++) {
            const serial = `${prefix}${i.toString().padStart(startMatch[1].length, '0')}`;
            // Only add if not already in explicit list
            if (!serials.includes(serial)) {
              serials.push(serial);
            }
          }
        } else {
          // If we can't parse the range, just add start and end
          if (!serials.includes(start)) serials.push(start);
          if (!serials.includes(end)) serials.push(end);
        }
      }
    }

    return serials;
  }

  /**
   * Parse serialization_range array from ppb_batches format
   * Handles formats like: ["0001-0100", "0101-0200"] or ["SN-001-SN-100"]
   */
  private parseSerializationRange(serializationRange: string[]): {
    ranges: Array<{ start: string; end: string }>;
    explicit: string[];
  } {
    const ranges: Array<{ start: string; end: string }> = [];
    const explicit: string[] = [];

    for (const rangeStr of serializationRange) {
      // Check if it's a range (contains dash)
      if (rangeStr.includes('-')) {
        // Try to split by last dash to get start-end
        const parts = rangeStr.split('-');
        if (parts.length === 2) {
          // Simple format: "0001-0100"
          ranges.push({ start: parts[0], end: parts[1] });
        } else if (parts.length > 2) {
          // Complex format: "SN-BATCH-001-SN-BATCH-100"
          // Find the middle point
          const midPoint = Math.floor(parts.length / 2);
          const start = parts.slice(0, midPoint).join('-');
          const end = parts.slice(midPoint).join('-');
          ranges.push({ start, end });
        }
      } else {
        // Not a range, it's an explicit serial number
        explicit.push(rangeStr);
      }
    }

    return { ranges, explicit };
  }

  /**
   * Backfill serial numbers from ppb_batches.serialization_range for existing consignments
   * This is useful for consignments that were imported before serial number expansion was implemented
   */
  async backfillSerialNumbersFromPPBBatches(consignmentId: number): Promise<{
    batchesProcessed: number;
    serialNumbersCreated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let batchesProcessed = 0;
    let serialNumbersCreated = 0;

    try {
      // Get consignment
      const consignment = await this.consignmentRepo.findOne({
        where: { id: consignmentId },
        relations: ['consignmentBatches'],
      });

      if (!consignment) {
        throw new NotFoundException(`Consignment ${consignmentId} not found`);
      }

      this.logger.log(`Backfilling serial numbers for consignment ${consignment.consignmentID} (ID: ${consignmentId})`);

      // Get all batches for this consignment
      const consignmentBatches = consignment.consignmentBatches || [];
      const batchIds = consignmentBatches.map(cb => cb.batchId).filter((id): id is number => Boolean(id));

      if (batchIds.length === 0) {
        this.logger.warn(`No batches found for consignment ${consignment.consignmentID}`);
        return { batchesProcessed: 0, serialNumbersCreated: 0, errors: [] };
      }

      // Get batches with their PPB batch metadata
      const batches = await this.batchRepo.find({
        where: { id: In(batchIds) },
      });

      // Get PPB batches separately
      const ppbBatchRepo = this.dataSource.getRepository(PPBBatch);

      for (const batch of batches) {
        try {
          // Find corresponding PPB batch record
          const ppbBatch = await ppbBatchRepo.findOne({
            where: { batchNumber: batch.batchno },
          });

          if (!ppbBatch || !ppbBatch.serializationRange || ppbBatch.serializationRange.length === 0) {
            this.logger.debug(`No serializationRange found for batch ${batch.batchno}`);
            continue;
          }

          this.logger.log(`Processing batch ${batch.batchno} with ${ppbBatch.serializationRange.length} serialization ranges`);

          // Parse serialization range
          const parsedSerialization = this.parseSerializationRange(ppbBatch.serializationRange);

          // Expand to individual serial numbers
          const serialNumbers = this.expandSerialization(parsedSerialization);

          if (serialNumbers.length === 0) {
            this.logger.warn(`No serial numbers expanded for batch ${batch.batchno}`);
            continue;
          }

          this.logger.log(`Expanded ${serialNumbers.length} serial numbers for batch ${batch.batchno}`);

          // Create serial number records using injected repository
          let createdForBatch = 0;
          
          for (const serial of serialNumbers) {
            // Check if serial already exists
            const existing = await this.serialNumberRepo.findOne({
              where: { batchId: batch.id, serialNumber: serial },
            });

            if (!existing) {
              const serialNumber = this.serialNumberRepo.create({
                batchId: batch.id,
                consignmentId: consignment.id,
                serialNumber: serial,
              });
              await this.serialNumberRepo.save(serialNumber);
              createdForBatch++;
              serialNumbersCreated++;
            }
          }

          batchesProcessed++;
          this.logger.log(`Created ${createdForBatch} serial numbers for batch ${batch.batchno}`);

        } catch (error: any) {
          const errorMsg = `Error processing batch ${batch.batchno}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
          // Continue with other batches
        }
      }

      this.logger.log(`Backfill complete: ${batchesProcessed} batches processed, ${serialNumbersCreated} serial numbers created`);

      return {
        batchesProcessed,
        serialNumbersCreated,
        errors,
      };

    } catch (error: any) {
      this.logger.error(`Failed to backfill serial numbers for consignment ${consignmentId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Import consignment from PPB JSON with full aggregation hierarchy
   * 
   * This is used by regulator to import approved consignments.
   * 
   * FUTURE: Will add submitForApproval() method for manufacturer pre-approval workflow.
   * See CONSIGNMENT_APPROVAL_WORKFLOW_BACKLOG.md for details.
   */
  async importFromPPB(
    userId: string,
    dto: ImportPPBConsignmentDto,
  ): Promise<Consignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if consignment already exists
      const existing = await this.consignmentRepo.findOne({
        where: { eventID: dto.header.eventID },
      });

      if (existing) {
        throw new BadRequestException(
          `Consignment with event ID ${dto.header.eventID} already exists`,
        );
      }

      // Handle both new (parties object) and legacy formats
      // Priority: parties object > top-level manufacturer/mah > legacy flat fields
      const manufacturerPPBID = 
        dto.consignment.parties?.manufacturer_party?.ppbID ||
        dto.consignment.manufacturer?.ppbID || 
        dto.consignment.manufacturerPPBID;
      const MAHPPBID = 
        dto.consignment.parties?.mah_party?.ppbID ||
        dto.consignment.mah?.ppbID || 
        dto.consignment.MAHPPBID;
      const manufacturerGLN = 
        dto.consignment.parties?.manufacturer_party?.gln ||
        dto.consignment.manufacturer?.gln || 
        dto.consignment.manufacturerGLN;
      const MAHGLN = 
        dto.consignment.parties?.mah_party?.gln ||
        dto.consignment.mah?.gln || 
        dto.consignment.MAHGLN;
      const totalQuantity = dto.consignment.totalQuantity || 0;

      // Create consignment record
      const consignment = this.consignmentRepo.create({
        eventID: dto.header.eventID,
        eventType: dto.header.eventType,
        eventTimestamp: new Date(dto.header.eventTimestamp),
        sourceSystem: dto.header.sourceSystem,
        destinationSystem: dto.header.destinationSystem,
        consignmentID: dto.consignment.consignmentID,
        manufacturerPPBID,
        MAHPPBID,
        manufacturerGLN,
        MAHGLN,
        registrationNo: dto.consignment.registrationNo,
        shipmentDate: new Date(dto.consignment.shipmentDate),
        countryOfOrigin: dto.consignment.countryOfOrigin,
        destinationCountry: dto.consignment.destinationCountry,
        totalQuantity,
        userId,
        // Importer party details
        importerPartyName: dto.consignment.parties?.importer_party?.name,
        importerPartyGLN: dto.consignment.parties?.importer_party?.gln,
        importerPartyCountry: dto.consignment.parties?.importer_party?.country,
        // Destination party details
        destinationPartyName: dto.consignment.parties?.destination_party?.name,
        destinationPartyGLN: dto.consignment.parties?.destination_party?.gln,
        destinationLocationLabel: dto.consignment.parties?.destination_location?.label,
        // Store additional data in metadata JSONB if available (for future use)
        // Note: consignment_ref_number can be stored in a separate field if added to entity
      });

      const savedConsignment = await queryRunner.manager.save(consignment);

      // Build SSCC map and label map for quick lookup
      const ssccMap = new Map<string, ProcessedItem>();
      const labelMap = new Map<string, ProcessedItem>(); // Fallback for items without SSCC
      const itemsByType = {
        shipment: [] as any[],
        package: [] as any[],
        case: [] as any[],
        batch: [] as any[],
      };

      // Group items by type
      for (const item of dto.consignment.items) {
        itemsByType[item.type].push(item);
        if (item.sscc) {
          ssccMap.set(item.sscc, { item });
        }
        // Also index by label for fallback lookup
        labelMap.set(item.label, { item });
      }

      // Step 1: Process shipments (root items - parentSSCC is null)
      const shipmentItems = itemsByType.shipment.filter(
        (item) => !item.parentSSCC,
      );
      const shipmentMap = new Map<string, Shipment>();

      for (const item of shipmentItems) {
        const metadata = item.metadata || {};
        // Use logistics object if available, otherwise fall back to metadata
        const logistics = dto.consignment.logistics || {};
        const shipment = this.shipmentRepo.create({
          customer: metadata.customer || 'PPB Import',
          pickupDate: new Date(dto.consignment.shipmentDate),
          expectedDeliveryDate: new Date(dto.consignment.shipmentDate),
          pickupLocation: logistics.origin || metadata.pickupLocation || dto.consignment.countryOfOrigin,
          destinationAddress: logistics.final_destination_address || metadata.destinationAddress || dto.consignment.destinationCountry,
          carrier: logistics.carrier || metadata.carrier || 'Unknown',
          userId,
          isDispatched: true, // Already shipped from manufacturer
          ssccBarcode: item.sscc || '', // Will be set if SSCC exists
          isDeleted: false,
        });

        const savedShipment = await queryRunner.manager.save(shipment);
        if (item.sscc) {
          shipmentMap.set(item.sscc, savedShipment);
          ssccMap.set(item.sscc, { item, shipment: savedShipment });
        }
        // Update labelMap
        const existingLabel = labelMap.get(item.label);
        labelMap.set(item.label, { item, shipment: savedShipment, ...existingLabel });
      }

      // Step 2: Process packages (parentSSCC references shipment or another package)
      const packageMap = new Map<string, Package>();

      for (const item of itemsByType.package) {
        // Find parent (shipment or package)
        let parentShipment: Shipment | undefined;
        if (item.parentSSCC) {
          const parent = ssccMap.get(item.parentSSCC);
          if (parent?.shipment) {
            parentShipment = parent.shipment;
          } else if (parent?.package) {
            // Package's parent is another package - find the shipment
            const parentPkg = parent.package;
            parentShipment = await queryRunner.manager.findOne(Shipment, {
              where: { id: parentPkg.shipmentId },
            });
          }
        } else {
          // No parentSSCC - package must have a shipment parent in the hierarchy
          // Check if there's a shipment that can be used (first available)
          if (shipmentMap.size > 0) {
            parentShipment = Array.from(shipmentMap.values())[0];
          } else {
            throw new BadRequestException(
              `Package ${item.label} has no parentSSCC and no shipment exists in the consignment. Please provide a shipment item in the consignment data, or specify a parentSSCC for the package.`,
            );
          }
        }

        if (!parentShipment) {
          throw new BadRequestException(
            `Package ${item.label} has invalid parentSSCC: ${item.parentSSCC}`,
          );
        }

        const pkg = this.packageRepo.create({
          label: item.label,
          shipmentId: parentShipment.id,
          userId,
          isDispatched: true,
          ssccBarcode: item.sscc,
          ssccGeneratedAt: item.sscc ? new Date() : undefined,
        });

        const savedPackage = await queryRunner.manager.save(pkg);
        if (item.sscc) {
          packageMap.set(item.sscc, savedPackage);
          const existing = ssccMap.get(item.sscc);
          ssccMap.set(item.sscc, { 
            item, 
            package: savedPackage,
            shipment: existing?.shipment,
          });
        }
        // Update labelMap
        const existingLabel = labelMap.get(item.label);
        labelMap.set(item.label, { 
          item, 
          package: savedPackage,
          shipment: existingLabel?.shipment || parentShipment,
        });
      }

      // Step 3: Process cases (parentSSCC references package or case)
      const caseMap = new Map<string, Case>();
      const createdCaseIds = new Set<number>(); // Track cases created in this import
      const labelCounter = new Map<string, number>(); // Track label usage to ensure uniqueness
      const usedLabels = new Set<string>(); // Track all labels used in this import

      for (const item of itemsByType.case) {
        // Find parent package
        let parentPackage: Package | undefined;
        if (item.parentSSCC) {
          const parent = ssccMap.get(item.parentSSCC);
          if (parent?.package) {
            parentPackage = parent.package;
          } else if (parent?.case) {
            // Case's parent is another case - find the package
            const parentCase = parent.case;
            parentPackage = await queryRunner.manager.findOne(Package, {
              where: { id: parentCase.packageId },
            });
          }
        }

        if (!parentPackage) {
          throw new BadRequestException(
            `Case ${item.label} has invalid parentSSCC: ${item.parentSSCC}`,
          );
        }

        // Ensure label uniqueness - always append consignment ID to make it unique
        // This prevents conflicts with existing cases and duplicates within the same import
        let uniqueLabel = item.label;
        const labelCount = (labelCounter.get(item.label) || 0) + 1;
        labelCounter.set(item.label, labelCount);
        
        // Always make label unique by appending consignment ID and index
        // This ensures no conflicts with existing cases or duplicates in this import
        if (item.sscc) {
          // Use SSCC as part of uniqueness (last 8 chars for readability)
          uniqueLabel = `${item.label}-${savedConsignment.consignmentID}-${item.sscc.slice(-8)}`;
        } else {
          // Use consignment ID and counter
          uniqueLabel = `${item.label}-${savedConsignment.consignmentID}-${labelCount}`;
        }
        
        // Ensure this label hasn't been used in this import AND doesn't exist in database
        let finalLabel = uniqueLabel;
        let suffix = 1;
        while (usedLabels.has(finalLabel)) {
          finalLabel = `${uniqueLabel}-${suffix}`;
          suffix++;
        }
        
        // Also check database to ensure label doesn't already exist
        // Keep checking until we find a unique label
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          const existingCaseWithLabel = await queryRunner.manager.findOne(Case, {
            where: { userId, label: finalLabel },
          });
          
          if (!existingCaseWithLabel && !usedLabels.has(finalLabel)) {
            // Label is unique, break out of loop
            break;
          }
          
          // Label exists, generate a new one
          finalLabel = `${uniqueLabel}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          throw new BadRequestException(
            `Failed to generate unique case label after ${maxAttempts} attempts for ${item.label}`,
          );
        }
        
        usedLabels.add(finalLabel);
        uniqueLabel = finalLabel;

        // Log the label being used for debugging
        this.logger.debug(
          `Creating case with unique label: ${uniqueLabel} (original: ${item.label}, consignment: ${savedConsignment.consignmentID})`,
        );

        const caseEntity = this.caseRepo.create({
          label: uniqueLabel,
          packageId: parentPackage.id,
          userId,
          isDispatched: true,
          ssccBarcode: item.sscc,
          ssccGeneratedAt: item.sscc ? new Date() : undefined,
        });

        const savedCase = await queryRunner.manager.save(caseEntity);
        createdCaseIds.add(savedCase.id);
        if (item.sscc) {
          caseMap.set(item.sscc, savedCase);
          const existing = ssccMap.get(item.sscc);
          ssccMap.set(item.sscc, { 
            item, 
            case: savedCase,
            package: existing?.package,
            shipment: existing?.shipment,
          });
        }
        // Update labelMap
        const existingLabel = labelMap.get(item.label);
        labelMap.set(item.label, { 
          item, 
          case: savedCase,
          package: existingLabel?.package || parentPackage,
          shipment: existingLabel?.shipment,
        });
      }

      // Step 4: Process batches (parentSSCC references case, package, or shipment)
      const batchEPCs: string[] = [];

      for (const item of itemsByType.batch) {
        // Support both quantityApproved (Option A) and quantity (legacy)
        const quantity = item.quantityApproved || item.quantity;
        if (!item.GTIN || !item.batchNo || !quantity) {
          throw new BadRequestException(
            `Batch item ${item.label} is missing required fields (GTIN, batchNo, quantityApproved/quantity)`,
          );
        }

        // Find product by GTIN - must exist in catalog
        const product = await this.masterDataService.findByGTIN(item.GTIN);
        if (!product) {
          throw new BadRequestException(
            `Product with GTIN ${item.GTIN} not found in catalog. Please ensure the product is synced from PPB Terminology API before importing consignment.`,
          );
        }

        // Create batch using BatchService
        const batch = await this.batchService.createFromPPBImport(
          userId,
          product.id,
          item.batchNo,
          new Date(item.expiryDate),
          quantity,
          item.batchStatus === 'Active',
        );

        // Create initial ACTIVE product status for analytics tracking
        try {
          const productStatusRepo = queryRunner.manager.getRepository(ProductStatus);
          // Check if status already exists for this batch
          const existingStatus = await productStatusRepo.findOne({
            where: { batchId: batch.id },
            order: { statusDate: 'DESC' },
          });

          // Only create if no status exists or if existing status is not ACTIVE
          if (!existingStatus || existingStatus.status !== 'ACTIVE') {
            const productStatus = productStatusRepo.create({
              productId: product.id,
              batchId: batch.id,
              status: 'ACTIVE',
              actorUserId: userId,
              actorType: 'manufacturer',
              notes: `Initial status from PPB import - Consignment ${dto.consignment.consignmentID}`,
            });
            await productStatusRepo.save(productStatus);
            this.logger.log(`Created ACTIVE product status for batch ${batch.batchno}`);
          }
        } catch (error) {
          // Log but don't fail - product status is optional for analytics
          this.logger.warn(
            `Failed to create product status for batch ${batch.batchno}: ${error.message}`,
          );
        }

        // Store approval data and additional metadata in PPB batches table if available
        // This links the batch to PPB approval information
        if (item.approval || item.permit_id || item.product_code || dto.consignment.consignment_ref_number) {
          try {
            // Try to find or create PPB batch record
            const ppbBatchRepo = queryRunner.manager.getRepository(PPBBatch);
            const existingPPBBatch = await ppbBatchRepo.findOne({
              where: { batchNumber: item.batchNo },
            });

            const ppbBatchData: any = {
              gtin: item.GTIN,
              productName: item.productName || product.brandDisplayName || product.brandName,
              productCode: item.product_code || product.etcdProductId,
              batchNumber: item.batchNo,
              status: item.batchStatus || 'active',
              expirationDate: item.expiryDate ? new Date(item.expiryDate) : null,
              manufactureDate: item.manufactureDate ? new Date(item.manufactureDate) : null,
              permitId: item.permit_id,
              consignmentRefNumber: dto.consignment.consignment_ref_number,
              approvalStatus: item.approval?.approval_status,
              approvalDateStamp: item.approval?.approval_datestamp,
              declaredTotal: item.approval?.quantities?.declared_total,
              declaredSent: item.approval?.quantities?.declared_sent,
              isPartialApproval: item.serialization?.is_partial_approval || false,
            };

            // Add parties information if available
            if (dto.consignment.parties) {
              ppbBatchData.manufacturerName = dto.consignment.parties.manufacturer_party?.name;
              ppbBatchData.manufacturerGln = dto.consignment.parties.manufacturer_party?.gln;
              ppbBatchData.manufacturingSiteSgln = dto.consignment.parties.manufacturing_site?.sgln;
              ppbBatchData.manufacturingSiteLabel = dto.consignment.parties.manufacturing_site?.label;
              ppbBatchData.importerName = dto.consignment.parties.importer_party?.name;
              ppbBatchData.importerCountry = dto.consignment.parties.importer_party?.country;
              ppbBatchData.importerGln = dto.consignment.parties.importer_party?.gln;
            }

            // Add logistics information if available
            if (dto.consignment.logistics) {
              ppbBatchData.carrier = dto.consignment.logistics.carrier;
              ppbBatchData.origin = dto.consignment.logistics.origin;
              ppbBatchData.portOfEntry = dto.consignment.logistics.port_of_entry;
              ppbBatchData.finalDestinationSgln = dto.consignment.logistics.final_destination_sgln;
              ppbBatchData.finalDestinationAddress = dto.consignment.logistics.final_destination_address;
            }

            // TEMPORARY: Skip PPB batch storage until TypeORM metadata issue is resolved
            this.logger.warn(`[TEMP SKIP] PPB batch storage disabled for ${item.batchNo}`);
            /*
            if (existingPPBBatch) {
              Object.assign(existingPPBBatch, ppbBatchData);
              await queryRunner.manager.save(existingPPBBatch);
            } else {
              const newPPBBatch = ppbBatchRepo.create(ppbBatchData);
              await queryRunner.manager.save(newPPBBatch);
            }
            */
          } catch (error) {
            // Log but don't fail - PPB batch storage is optional
            this.logger.warn(
              `Failed to store PPB batch metadata for ${item.batchNo}: ${error.message}`,
            );
          }
        }

        // Find parent case - must exist in hierarchy (no auto-creation)
        let parentCase: Case | undefined;
        if (item.parentSSCC) {
          const parent = ssccMap.get(item.parentSSCC);
          if (parent?.case) {
            parentCase = parent.case;
          } else if (parent?.package) {
            // Batch's parent is a package - case must exist in hierarchy
            throw new BadRequestException(
              `Batch ${item.batchNo} has parentSSCC ${item.parentSSCC} pointing to a package, but no case exists. Please ensure the complete hierarchy (shipment → package → case → batch) is provided in the consignment data.`,
            );
          } else if (parent?.shipment) {
            // Batch's parent is a shipment - package and case must exist
            throw new BadRequestException(
              `Batch ${item.batchNo} has parentSSCC ${item.parentSSCC} pointing to a shipment, but no package/case exists. Please ensure the complete hierarchy (shipment → package → case → batch) is provided in the consignment data.`,
            );
          } else {
            // Parent SSCC not found - try label lookup as fallback
            const parentByLabel = labelMap.get(item.parentSSCC);
            if (parentByLabel?.case) {
              parentCase = parentByLabel.case;
            } else if (parentByLabel?.package) {
              throw new BadRequestException(
                `Batch ${item.batchNo} has parentSSCC ${item.parentSSCC} pointing to a package, but no case exists. Please ensure the complete hierarchy is provided.`,
              );
            } else {
              throw new BadRequestException(
                `Batch ${item.batchNo} has invalid parentSSCC ${item.parentSSCC}. Parent case must exist in the consignment data.`,
              );
            }
          }
        } else {
          // No parentSSCC - batch must have a parent case in the hierarchy
          throw new BadRequestException(
            `Batch ${item.batchNo} has no parentSSCC. Please provide a complete hierarchy (shipment → package → case → batch) in the consignment data.`,
          );
        }

        if (!parentCase) {
          throw new BadRequestException(
            `Batch ${item.batchNo} could not be linked to a case. Case must exist in the consignment hierarchy.`,
          );
        }

        // Link batch to case via cases_products
        const caseProduct = this.casesProductsRepo.create({
          caseId: parentCase.id,
          productId: product.id,
          batchId: batch.id,
          qty: quantity,
          fromNumber: 1,
          count: item.serialNumbers?.length || 1,
        });
        await queryRunner.manager.save(caseProduct);

        // Process serialization: expand ranges and merge with explicit serials
        let allSerials: string[] = [];
        
        // First, get explicit serials from serialNumbers (legacy) or serialization.explicit
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          allSerials.push(...item.serialNumbers);
        }

        // Expand serialization ranges and explicit
        if (item.serialization) {
          const expandedSerials = this.expandSerialization(item.serialization);
          // Merge, avoiding duplicates
          for (const serial of expandedSerials) {
            if (!allSerials.includes(serial)) {
              allSerials.push(serial);
            }
          }
        }

        // Store serial numbers
        if (allSerials.length > 0) {
          for (const serial of allSerials) {
            const existingSerial = await this.serialNumberRepo.findOne({
              where: { batchId: batch.id, serialNumber: serial },
            });

            if (!existingSerial) {
              const serialNumber = this.serialNumberRepo.create({
                batchId: batch.id,
                consignmentId: savedConsignment.id,
                serialNumber: serial,
              });
              await queryRunner.manager.save(serialNumber);
            }
          }
        }

        // Update caseProduct count based on actual serial numbers
        if (allSerials.length > 0) {
          caseProduct.count = allSerials.length;
          await queryRunner.manager.save(caseProduct);
        }

        // Link batch to consignment
        const consignmentBatch = this.consignmentBatchRepo.create({
          consignmentId: savedConsignment.id,
          batchId: batch.id,
          sscc: item.sscc,
        });
        await queryRunner.manager.save(consignmentBatch);

        // Collect batch EPCs for EPCIS ObjectEvent
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(batch.batchno);
        batchEPCs.push(batchEPC);
      }

      // Step 5: Create EPCIS AggregationEvents for each aggregation level
      // Batches → Cases (process only cases created in this import)
      const processedCases = new Set<number>();

      for (const caseId of createdCaseIds) {
        const caseEntity = await queryRunner.manager.findOne(Case, {
          where: { id: caseId },
        });
        if (!caseEntity) continue;
        if (processedCases.has(caseEntity.id)) continue;
        processedCases.add(caseEntity.id);

        const caseProducts = await queryRunner.manager.find(CasesProducts, {
          where: { caseId: caseEntity.id },
          relations: ['batch'],
        });

        if (caseProducts.length > 0) {
          const batchEPCs = caseProducts.map((cp) =>
            this.gs1Service.formatBatchNumberAsEPCURI(cp.batch.batchno),
          );
          const caseEPC = caseEntity.ssccBarcode
            ? `urn:epc:id:sscc:${caseEntity.ssccBarcode}`
            : `https://example.com/cases/${caseEntity.label.replace(/\s+/g, '')}`;

          try {
            // Get user for actor context
            const user = await queryRunner.manager.findOne(User, {
              where: { id: userId },
            });

            // Build quantity list from case products
            const quantityList = await Promise.all(
              caseProducts.map(async (cp) => {
                // Get product GTIN
                const product = await queryRunner.manager.findOne(PPBProduct, {
                  where: { id: cp.productId },
                });
                if (!product?.gtin) return null;

                const epcClass = `urn:epc:class:lgtin:${product.gtin}.${cp.batch.batchno}`;
                return createQuantity(epcClass, Number(cp.qty), UnitOfMeasure.EACH);
              }),
            ).then((list) => list.filter((q) => q !== null));

            const eventId = await this.gs1Service.createAggregationEvent(
              caseEPC,
              batchEPCs,
              {
                bizStep: 'packing',
                disposition: 'in_progress',
                action: 'ADD', // Explicitly set
                quantityList: quantityList.length > 0 ? quantityList : undefined,
                // Business transaction: Link to consignment
                bizTransactionList: savedConsignment.consignmentID
                  ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignmentID)]
                  : undefined,
                // Actor context (P0 - Critical for L5 TNT)
                actorType: 'manufacturer', // Determine from user role or context
                actorUserId: userId,
                actorGLN: user?.glnNumber || manufacturerGLN,
                actorOrganization: user?.organization,
                sourceEntityType: 'consignment',
                sourceEntityId: savedConsignment.id,
              },
            );
            caseEntity.eventId = eventId;
            await queryRunner.manager.save(caseEntity);
          } catch (error: any) {
            this.logger.error(
              `Failed to create EPCIS AggregationEvent for case ${caseEntity.id}`,
              error?.message,
            );
          }
        }
      }

      // Cases → Packages
      for (const [sscc, pkg] of packageMap.entries()) {
        const cases = await queryRunner.manager.find(Case, {
          where: { packageId: pkg.id },
        });

        if (cases.length > 0) {
          const caseEPCs = cases.map((c) =>
            c.ssccBarcode
              ? `urn:epc:id:sscc:${c.ssccBarcode}`
              : `https://example.com/cases/${c.label.replace(/\s+/g, '')}`,
          );
          const packageEPC = `urn:epc:id:sscc:${sscc}`;

          try {
            // Get user for actor context
            const user = await queryRunner.manager.findOne(User, {
              where: { id: userId },
            });

            // Build quantity list by summing quantities from cases
            // Load case products to get quantities
            const allCaseProducts = await Promise.all(
              cases.map(caseEntity =>
                queryRunner.manager.find(CasesProducts, {
                  where: { caseId: caseEntity.id },
                  relations: ['batch'],
                })
              )
            ).then(results => results.flat());

            // Group by product/batch and sum quantities
            const quantityMap = new Map<string, number>();
            for (const cp of allCaseProducts) {
              const product = await queryRunner.manager.findOne(PPBProduct, {
                where: { id: cp.productId },
              });
              if (!product?.gtin) continue;

              const key = `${product.gtin}.${cp.batch.batchno}`;
              quantityMap.set(key, (quantityMap.get(key) || 0) + Number(cp.qty));
            }

            const quantityList = Array.from(quantityMap.entries()).map(([key, qty]) => {
              const [gtin, batchno] = key.split('.');
              const epcClass = `urn:epc:class:lgtin:${gtin}.${batchno}`;
              return createQuantity(epcClass, qty, UnitOfMeasure.EACH);
            });

            const eventId = await this.gs1Service.createAggregationEvent(
              packageEPC,
              caseEPCs,
              {
                bizStep: 'packing',
                disposition: 'in_progress',
                action: 'ADD', // Explicitly set
                quantityList: quantityList.length > 0 ? quantityList : undefined,
                // Business transaction: Link to consignment
                bizTransactionList: savedConsignment.consignmentID
                  ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignmentID)]
                  : undefined,
                // Actor context (P0 - Critical for L5 TNT)
                actorType: 'manufacturer',
                actorUserId: userId,
                actorGLN: user?.glnNumber || manufacturerGLN,
                actorOrganization: user?.organization,
                sourceEntityType: 'consignment',
                sourceEntityId: savedConsignment.id,
              },
            );
            pkg.eventId = eventId;
            await queryRunner.manager.save(pkg);
          } catch (error: any) {
            this.logger.error(
              `Failed to create EPCIS AggregationEvent for package ${pkg.id}`,
              error?.message,
            );
          }
        }
      }

      // Packages → Shipments
      for (const [sscc, shipment] of shipmentMap.entries()) {
        const packages = await queryRunner.manager.find(Package, {
          where: { shipmentId: shipment.id },
        });

        if (packages.length > 0) {
          const packageEPCs = packages.map((p) =>
            p.ssccBarcode
              ? `urn:epc:id:sscc:${p.ssccBarcode}`
              : `https://example.com/packages/${p.label.replace(/\s+/g, '')}`,
          );
          const shipmentEPC = `urn:epc:id:sscc:${sscc}`;

          try {
            // Get user for actor context
            const user = await queryRunner.manager.findOne(User, {
              where: { id: userId },
            });

            // Build quantity list by summing quantities from packages (via cases)
            // Load all case products from all packages
            const allPackageCaseProducts = await Promise.all(
              packages.map(pkg =>
                queryRunner.manager.find(Case, { where: { packageId: pkg.id } })
                  .then(cases => Promise.all(
                    cases.map(caseEntity =>
                      queryRunner.manager.find(CasesProducts, {
                        where: { caseId: caseEntity.id },
                        relations: ['batch'],
                      })
                    )
                  ).then(results => results.flat()))
              )
            ).then(results => results.flat());

            // Group by product/batch and sum quantities
            const quantityMap = new Map<string, number>();
            for (const cp of allPackageCaseProducts) {
              const product = await queryRunner.manager.findOne(PPBProduct, {
                where: { id: cp.productId },
              });
              if (!product?.gtin) continue;

              const key = `${product.gtin}.${cp.batch.batchno}`;
              quantityMap.set(key, (quantityMap.get(key) || 0) + Number(cp.qty));
            }

            const quantityList = Array.from(quantityMap.entries()).map(([key, qty]) => {
              const [gtin, batchno] = key.split('.');
              const epcClass = `urn:epc:class:lgtin:${gtin}.${batchno}`;
              return createQuantity(epcClass, qty, UnitOfMeasure.EACH);
            });

            const eventId = await this.gs1Service.createAggregationEvent(
              shipmentEPC,
              packageEPCs,
              {
                bizStep: 'shipping',
                disposition: 'in_transit',
                action: 'ADD', // Explicitly set
                quantityList: quantityList.length > 0 ? quantityList : undefined,
                // Business transaction: Link to consignment
                bizTransactionList: savedConsignment.consignmentID
                  ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignmentID)]
                  : undefined,
                // Actor context (P0 - Critical for L5 TNT)
                actorType: 'manufacturer',
                actorUserId: userId,
                actorGLN: user?.glnNumber || manufacturerGLN,
                actorOrganization: user?.organization,
                sourceEntityType: 'consignment',
                sourceEntityId: savedConsignment.id,
              },
            );
            shipment.eventId = eventId;
            await queryRunner.manager.save(shipment);
          } catch (error: any) {
            this.logger.error(
              `Failed to create EPCIS AggregationEvent for shipment ${shipment.id}`,
              error?.message,
            );
          }
        }
      }

      // Step 6: Create EPCIS ObjectEvent for "products entered Kenya"
      if (batchEPCs.length > 0) {
        try {
          // Get user for actor context
          const user = await queryRunner.manager.findOne(User, {
            where: { id: userId },
          });

          const kenyaGLN = dto.consignment.manufacturerGLN || '0000000000000';
          // Note: quantityList for ObjectEvent would require per-batch quantities
          // which aren't readily available here. Can be enhanced later.
          await this.gs1Service.createObjectEvent(batchEPCs, {
            bizStep: 'receiving',
            disposition: 'at_destination',
            bizLocation: {
              id: `urn:epc:id:sgln:${kenyaGLN}.0.0`,
            },
            action: 'ADD', // Explicitly set
            // Business transaction: Link to consignment
            bizTransactionList: savedConsignment.consignmentID
              ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignmentID)]
              : undefined,
            // Actor context (P0 - Critical for L5 TNT)
            actorType: 'manufacturer',
            actorUserId: userId,
            actorGLN: user?.glnNumber || manufacturerGLN,
            actorOrganization: user?.organization,
            sourceEntityType: 'consignment',
            sourceEntityId: savedConsignment.id,
          });
          this.logger.log(
            `EPCIS ObjectEvent created: ${batchEPCs.length} batches entered Kenya`,
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to create EPCIS ObjectEvent for batches entering Kenya`,
            error?.message,
          );
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Consignment imported: ${savedConsignment.id} - ${savedConsignment.consignmentID}`,
      );

      // Return consignment with relations
      return await this.consignmentRepo.findOne({
        where: { id: savedConsignment.id },
        relations: ['consignmentBatches', 'consignmentBatches.batch'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to import consignment: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all consignments with optional filtering
   * @param filter - Optional filter criteria. If not provided, returns all consignments (regulator view)
   * @returns Array of consignments with rich GS1 data
   */
  async findAll(filter?: ConsignmentFilter): Promise<any[]> {
    try {
      this.logger.log('Finding all consignments' + (filter ? ` with filter: ${JSON.stringify(filter)}` : ' (no filter - regulator view)'));
      
      // Build base query
      const queryBuilder = this.consignmentRepo
        .createQueryBuilder('consignment')
        .leftJoinAndSelect('consignment.consignmentBatches', 'consignmentBatches')
        .leftJoinAndSelect('consignmentBatches.batch', 'batch')
        .leftJoinAndSelect('batch.product', 'product')
        .orderBy('consignment.id', 'DESC');

    // Apply filters if provided
    if (filter) {
      const orConditions: string[] = [];
      const params: any = {};
      
      if (filter.manufacturerPPBID) {
        orConditions.push('consignment.manufacturerPPBID = :ppbCode');
        params.ppbCode = filter.manufacturerPPBID;
      }
      
      if (filter.manufacturerGLN) {
        orConditions.push('consignment.manufacturerGLN = :supplierGLN');
        params.supplierGLN = filter.manufacturerGLN;
      }
      
      if (filter.userId) {
        orConditions.push('consignment.userId = :userId');
        params.userId = filter.userId;
      }

      // Apply OR conditions
      if (orConditions.length > 0) {
        queryBuilder.where(`(${orConditions.join(' OR ')})`, params);
      }
    }
    // No filter = return all consignments (regulator view)

    const consignments = await queryBuilder.getMany();
    this.logger.log(`Found ${consignments.length} consignments`);

    // Build hierarchy from actual database relationships created during import
    // Strategy: Start from batches in consignment_batches, trace back to cases → packages → shipments
    
    // Get all batch IDs for these consignments
    const consignmentIds = consignments.map((c) => c.id);
    const consignmentBatches = consignmentIds.length > 0 
      ? await this.consignmentBatchRepo.find({
          where: { consignmentId: In(consignmentIds) },
          relations: ['batch', 'batch.product'],
        })
      : [];

    // Get all case products that link to these batches
    const batchIds = consignmentBatches.map(cb => cb.batchId).filter((id): id is number => Boolean(id));
    const caseProducts = batchIds.length > 0
      ? await this.casesProductsRepo.find({
          where: { batchId: In(batchIds) },
          relations: ['case', 'batch', 'product'],
        })
      : [];

    // Group case products by case ID
    const caseProductsByCaseId = new Map<number, typeof caseProducts>();
    for (const cp of caseProducts) {
      if (cp.caseId) {
        if (!caseProductsByCaseId.has(cp.caseId)) {
          caseProductsByCaseId.set(cp.caseId, []);
        }
        caseProductsByCaseId.get(cp.caseId)!.push(cp);
      }
    }

    // Get all cases with their package relationships
    const caseIds = Array.from(caseProductsByCaseId.keys());
    const cases = caseIds.length > 0
      ? await this.caseRepo.find({
          where: { id: In(caseIds) },
          relations: ['package'],
        })
      : [];

    // Get all packages with their shipment relationships
    const packageIds = cases.map(c => c.packageId).filter((id): id is number => Boolean(id));
    const packages = packageIds.length > 0
      ? await this.packageRepo.find({
          where: { id: In(packageIds) },
          relations: ['shipment'],
        })
      : [];

    // Get all shipments
    const shipmentIds = packages.map(p => p.shipmentId).filter((id): id is number => Boolean(id));
    const shipments = shipmentIds.length > 0
      ? await this.shipmentRepo.find({
          where: { id: In(shipmentIds) },
        })
      : [];

    // Build maps for quick lookup
    const caseMap = new Map<number, typeof cases[0]>();
    for (const caseItem of cases) {
      caseMap.set(caseItem.id, caseItem);
    }

    const packageMap = new Map<number, typeof packages[0]>();
    for (const pkg of packages) {
      packageMap.set(pkg.id, pkg);
    }

    const shipmentMap = new Map<number, typeof shipments[0]>();
    for (const shipment of shipments) {
      shipmentMap.set(shipment.id, shipment);
    }

    // Group cases by package
    const casesByPackageId = new Map<number, typeof cases>();
    for (const caseItem of cases) {
      if (caseItem.packageId) {
        if (!casesByPackageId.has(caseItem.packageId)) {
          casesByPackageId.set(caseItem.packageId, []);
        }
        casesByPackageId.get(caseItem.packageId)!.push(caseItem);
      }
    }

    // Group packages by shipment
    const packagesByShipmentId = new Map<number, typeof packages>();
    for (const pkg of packages) {
      if (pkg.shipmentId) {
        if (!packagesByShipmentId.has(pkg.shipmentId)) {
          packagesByShipmentId.set(pkg.shipmentId, []);
        }
        packagesByShipmentId.get(pkg.shipmentId)!.push(pkg);
      }
    }

    // Build full SSCC hierarchy per consignment with parent-child relationships
    const consignmentSSCCHierarchy = new Map<number, {
      shipmentSSCCs: string[];
      packageSSCCs: string[];
      caseSSCCs: string[];
      hierarchy: Array<{
        shipmentSSCC: string;
        packages: Array<{
          packageSSCC: string;
          cases: Array<{
            caseSSCC: string;
            batches: Array<{
              batchNumber: string;
              batchId: number;
              gtin: string;
              productName: string;
              quantity: number;
            }>;
          }>;
        }>;
      }>;
    }>();

    // Build hierarchy for each consignment from actual database relationships
    for (const consignment of consignments) {
      const hierarchy: Array<{
        shipmentSSCC: string;
        packages: Array<{
          packageSSCC: string;
          cases: Array<{
            caseSSCC: string;
            batches: Array<{
              batchNumber: string;
              batchId: number;
              gtin: string;
              productName: string;
              quantity: number;
            }>;
          }>;
        }>;
      }> = [];

      const ssccData = {
        shipmentSSCCs: [] as string[],
        packageSSCCs: [] as string[],
        caseSSCCs: [] as string[],
      };

      // Get batches for this consignment
      const consignmentBatchIds = consignmentBatches
        .filter(cb => cb.consignmentId === consignment.id)
        .map(cb => cb.batchId);

      // Find all case products that link to these batches
      const relevantCaseProducts = caseProducts.filter(cp => 
        consignmentBatchIds.includes(cp.batchId)
      );

      // Build hierarchy: shipment → package → case → batch
      // Group by shipment first
      const hierarchyByShipment = new Map<number, {
        shipment: typeof shipments[0];
        packages: Map<number, {
          package: typeof packages[0];
          cases: Map<number, {
            case: typeof cases[0];
            batches: Array<typeof caseProducts[0]>;
          }>;
        }>;
      }>();

      for (const caseProduct of relevantCaseProducts) {
        if (!caseProduct || !caseProduct.caseId) {
          this.logger.warn('Skipping case product - missing caseId');
          continue;
        }
        
        const caseItem = caseMap.get(caseProduct.caseId);
        if (!caseItem) {
          this.logger.warn(`Case ${caseProduct.caseId} not found in caseMap`);
          continue;
        }

        if (!caseItem.packageId) {
          this.logger.warn(`Case ${caseItem.id} has no packageId`);
          continue;
        }
        
        const pkg = packageMap.get(caseItem.packageId);
        if (!pkg) {
          this.logger.warn(`Package ${caseItem.packageId} not found in packageMap`);
          continue;
        }

        if (!pkg.shipmentId) {
          this.logger.warn(`Package ${pkg.id} has no shipmentId`);
          continue;
        }
        
        const shipment = shipmentMap.get(pkg.shipmentId);
        if (!shipment) {
          this.logger.warn(`Shipment ${pkg.shipmentId} not found in shipmentMap`);
          continue;
        }

        // Initialize shipment entry
        if (!hierarchyByShipment.has(shipment.id)) {
          hierarchyByShipment.set(shipment.id, {
            shipment,
            packages: new Map(),
          });
        }

        const shipmentEntry = hierarchyByShipment.get(shipment.id);
        if (!shipmentEntry) {
          this.logger.warn(`Shipment entry not found for shipment ${shipment.id}`);
          continue;
        }

        // Initialize package entry
        if (!shipmentEntry.packages.has(pkg.id)) {
          shipmentEntry.packages.set(pkg.id, {
            package: pkg,
            cases: new Map(),
          });
        }

        const packageEntry = shipmentEntry.packages.get(pkg.id);
        if (!packageEntry) {
          this.logger.warn(`Package entry not found for package ${pkg.id}`);
          continue;
        }

        // Initialize case entry
        if (!packageEntry.cases.has(caseItem.id)) {
          packageEntry.cases.set(caseItem.id, {
            case: caseItem,
            batches: [],
          });
        }

        // Add batch to case
        const caseEntry = packageEntry.cases.get(caseItem.id);
        if (caseEntry) {
          caseEntry.batches.push(caseProduct);
        } else {
          this.logger.warn(`Case entry not found for case ${caseItem.id}`);
        }

        // Track SSCCs
        if (shipment.ssccBarcode && !ssccData.shipmentSSCCs.includes(shipment.ssccBarcode)) {
          ssccData.shipmentSSCCs.push(shipment.ssccBarcode);
        }
        if (pkg.ssccBarcode && !ssccData.packageSSCCs.includes(pkg.ssccBarcode)) {
          ssccData.packageSSCCs.push(pkg.ssccBarcode);
        }
        if (caseItem.ssccBarcode && !ssccData.caseSSCCs.includes(caseItem.ssccBarcode)) {
          ssccData.caseSSCCs.push(caseItem.ssccBarcode);
        }
      }

      // Convert hierarchy map to array structure
      for (const [shipmentId, shipmentData] of hierarchyByShipment) {
        if (!shipmentData || !shipmentData.shipment) {
          this.logger.warn(`Skipping shipment ${shipmentId} - missing shipment data`);
          continue;
        }
        
        const shipmentHierarchy: {
          shipmentSSCC: string;
          packages: Array<{
            packageSSCC: string;
            cases: Array<{
              caseSSCC: string;
              batches: Array<{
                batchNumber: string;
                batchId: number;
                gtin: string;
                productName: string;
                quantity: number;
              }>;
            }>;
          }>;
        } = {
          shipmentSSCC: shipmentData.shipment?.ssccBarcode || '',
          packages: [],
        };

        for (const [packageId, packageData] of shipmentData.packages) {
          if (!packageData || !packageData.package) {
            this.logger.warn(`Skipping package ${packageId} - missing package data`);
            continue;
          }
          
          const packageHierarchy: {
            packageSSCC: string;
            cases: Array<{
              caseSSCC: string;
              batches: Array<{
                batchNumber: string;
                batchId: number;
                gtin: string;
                productName: string;
                quantity: number;
              }>;
            }>;
          } = {
            packageSSCC: packageData.package?.ssccBarcode || '',
            cases: [],
          };

          for (const [caseId, caseData] of packageData.cases) {
            if (!caseData || !caseData.case) {
              this.logger.warn(`Skipping case ${caseId} - missing case data`);
              continue;
            }
            
            const caseHierarchy: {
              caseSSCC: string;
              batches: Array<{
                batchNumber: string;
                batchId: number;
                gtin: string;
                productName: string;
                quantity: number;
              }>;
            } = {
              caseSSCC: caseData.case?.ssccBarcode || '',
              batches: (caseData.batches || []).filter(cp => cp != null).map(cp => ({
                batchNumber: cp.batch?.batchno || '',
                batchId: cp.batchId || 0,
                gtin: cp.product?.gtin || '',
                productName: cp.product?.brandDisplayName || cp.product?.brandName || 'Unknown',
                quantity: cp.qty != null ? parseFloat(String(cp.qty)) : 0,
              })),
            };

            packageHierarchy.cases.push(caseHierarchy);
          }

          shipmentHierarchy.packages.push(packageHierarchy);
        }

        if (shipmentHierarchy.packages.length > 0) {
          hierarchy.push(shipmentHierarchy);
        }
      }

      consignmentSSCCHierarchy.set(consignment.id, {
        ...ssccData,
        hierarchy,
      });
    }

    // Get serial number counts per batch
    // Also get all batch IDs from consignment batches
    const allBatchIds: number[] = [];
    for (const c of consignments) {
      for (const cb of c.consignmentBatches || []) {
        if (cb.batchId && !allBatchIds.includes(cb.batchId)) {
          allBatchIds.push(cb.batchId);
        }
      }
    }
    
    let serialCounts: any[] = [];
    
    if (allBatchIds.length > 0) {
      try {
        serialCounts = await this.serialNumberRepo
          .createQueryBuilder('sn')
          .select('sn.batchId', 'batchId')
          .addSelect('COUNT(sn.id)', 'count')
          .where('sn.batchId IN (:...batchIds)', {
            batchIds: allBatchIds,
          })
          .groupBy('sn.batchId')
          .getRawMany();
      } catch (error: any) {
        this.logger.warn(`Failed to get serial number counts: ${error?.message}`);
        // Continue with empty serial counts
      }
    }

    const serialCountMap = new Map<number, number>();
    for (const sc of serialCounts) {
      serialCountMap.set(sc.batchId, parseInt(sc.count));
    }

    // Transform to include rich GS1 data with full batch details
    return consignments.map((c) => {
      const batches = c.consignmentBatches || [];
      this.logger.debug(`Processing consignment ${c.id} (${c.consignmentID}): ${batches.length} consignmentBatches found`);
      
      const uniqueGTINs = new Set<string>();
      const uniqueProducts = new Set<string>();
      let totalSerialNumbers = 0;

      // Build full batch details array
      const batchDetails = batches.map((cb) => {
        const batch = cb.batch;
        // Ensure product is loaded - if not, fetch it
        let product = batch?.product;
        if (!product && batch?.productId) {
          // Product relation might not be loaded, but we have productId
          // The product should already be loaded via the query, but if not, we'll handle it
        }
        
        const serialCount = serialCountMap.get(cb.batchId) || 0;
        totalSerialNumbers += serialCount;

        // Extract GTIN from product (PPBProduct entity has gtin field)
        if (product?.gtin) {
          uniqueGTINs.add(product.gtin);
        }
        if (product) {
          uniqueProducts.add(product.brandDisplayName || product.brandName || 'Unknown');
        }

        return {
          id: batch?.id,
          batchNumber: batch?.batchno,
          expiryDate: batch?.expiry,
          quantity: batch?.qty,
          sentQuantity: batch?.sentQty,
          serialNumberCount: serialCount,
          product: product ? {
            id: product.id,
            gtin: product.gtin || null,
            brandName: product.brandName,
            brandDisplayName: product.brandDisplayName,
            strengthAmount: product.strengthAmount,
            strengthUnit: product.strengthUnit,
            formDescription: product.formDescription,
            ppbRegistrationCode: product.ppbRegistrationCode,
          } : null,
        };
      });

      // Get SSCC hierarchy data for this consignment
      const ssccHierarchyData = consignmentSSCCHierarchy.get(c.id) || {
        shipmentSSCCs: [],
        packageSSCCs: [],
        caseSSCCs: [],
        hierarchy: [],
      };

      this.logger.debug(`Consignment ${c.id} response: ${batchDetails.length} batches, ${ssccHierarchyData.hierarchy.length} hierarchy entries`);

      return {
        id: c.id,
        eventID: c.eventID,
        eventType: c.eventType,
        eventTimestamp: c.eventTimestamp,
        sourceSystem: c.sourceSystem,
        destinationSystem: c.destinationSystem,
        consignmentID: c.consignmentID,
        registrationNo: c.registrationNo,
        manufacturerPPBID: c.manufacturerPPBID,
        manufacturerGLN: c.manufacturerGLN,
        MAHPPBID: c.MAHPPBID,
        MAHGLN: c.MAHGLN,
        shipmentDate: c.shipmentDate,
        countryOfOrigin: c.countryOfOrigin,
        destinationCountry: c.destinationCountry,
        totalQuantity: c.totalQuantity,
        // Summary counts
        batchCount: batches.length,
        productCount: uniqueProducts.size,
        gtinCount: uniqueGTINs.size,
        uniqueGTINs: Array.from(uniqueGTINs),
        serialNumberCount: totalSerialNumbers,
        shipmentSSCCCount: ssccHierarchyData.shipmentSSCCs.length,
        packageSSCCCount: ssccHierarchyData.packageSSCCs.length,
        caseSSCCCount: ssccHierarchyData.caseSSCCs.length,
        // Full SSCC hierarchy with parent-child relationships
        ssccHierarchy: ssccHierarchyData.hierarchy,
        // Full batch details (unified PPB data)
        batches: batchDetails,
        createdAt: c.createdAt,
      };
    });
    } catch (error: any) {
      this.logger.error('Error in findAll():', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        error: error,
      });
      // Re-throw with more context, but ensure it's a proper Error object
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      const enhancedError = new Error(`Failed to fetch consignments: ${errorMessage}`);
      if (error?.stack) {
        enhancedError.stack = error.stack;
      }
      throw enhancedError;
    }
  }

  /**
   * Get consignment by ID (with userId filter for manufacturer/distributor)
   */
  async findOne(id: number, userId: string): Promise<Consignment> {
    const consignment = await this.consignmentRepo.findOne({
      where: { id, userId },
      relations: [
        'consignmentBatches',
        'consignmentBatches.batch',
        'consignmentBatches.batch.product',
      ],
    });

    if (!consignment) {
      throw new NotFoundException(`Consignment with ID ${id} not found`);
    }

    return consignment;
  }

  /**
   * Get consignment by ID for regulator (no userId filter)
   */
  async findOneForRegulator(id: number): Promise<Consignment> {
    const consignment = await this.consignmentRepo.findOne({
      where: { id },
      relations: [
        'consignmentBatches',
        'consignmentBatches.batch',
        'consignmentBatches.batch.product',
      ],
    });

    if (!consignment) {
      throw new NotFoundException(`Consignment with ID ${id} not found`);
    }

    return consignment;
  }

  /**
   * Get all consignments for regulator (no manufacturer filter)
   * This shows all consignments from all manufacturers
   * @deprecated Use findAll() without filter instead
   */
  async findAllForRegulator(): Promise<any[]> {
    return this.findAll(); // No filter = all consignments
  }

  /**
   * Get all consignments for a distributor with rich GS1 data
   * Filters by distributor GLN/PPBID from user's organization
   * Shows consignments where this distributor is the recipient or involved party
   */
  async findAllForDistributor(userId: string): Promise<any[]> {
    // Get user to find their organization/GLN
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      return [];
    }

    // Get supplier/distributor by user's organization (entityId)
    const supplier = await this.masterDataService.getSupplierByEntityId(user.organization);
    
    // Build filter from user/supplier data
    const filter: ConsignmentFilter = {};
    
    if (supplier) {
      if (supplier.ppbCode) {
        filter.manufacturerPPBID = supplier.ppbCode; // For now, filter by PPBID
      }
      if (supplier.legalEntityGLN) {
        filter.manufacturerGLN = supplier.legalEntityGLN; // For now, filter by GLN
      }
    }
    
    if (user.glnNumber) {
      filter.manufacturerGLN = user.glnNumber;
    }
    
    // Fallback to userId if no supplier/GLN found
    if (!filter.manufacturerPPBID && !filter.manufacturerGLN) {
      filter.userId = userId;
    }

    return this.findAll(filter);
  }

  /**
   * Get all consignments for a manufacturer with rich GS1 data
   * Filters by manufacturer GLN/PPBID from user's organization
   * Shows only consignments where this manufacturer is the manufacturer (not MAH)
   */
  async findAllForManufacturer(userId: string): Promise<any[]> {
    // Get user to find their organization/GLN
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      return [];
    }

    // Get supplier/manufacturer by user's organization (entityId)
    const supplier = await this.masterDataService.getSupplierByEntityId(user.organization);
    
    // Build filter from user/supplier data
    const filter: ConsignmentFilter = {};
    
    if (supplier) {
      if (supplier.ppbCode) {
        filter.manufacturerPPBID = supplier.ppbCode;
      }
      if (supplier.legalEntityGLN) {
        filter.manufacturerGLN = supplier.legalEntityGLN;
      }
    }
    
    if (user.glnNumber) {
      filter.manufacturerGLN = user.glnNumber;
    }
    
    // Fallback to userId if no supplier/GLN found
    if (!filter.manufacturerPPBID && !filter.manufacturerGLN) {
      filter.userId = userId;
    }

    return this.findAll(filter);
  }
}

