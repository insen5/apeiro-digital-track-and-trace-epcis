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
  manufacturer_gln?: string;
  manufacturer_ppb_id?: string;
  user_id?: string;
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
        relations: ['consignment_batches'],
      });

      if (!consignment) {
        throw new NotFoundException(`Consignment ${consignmentId} not found`);
      }

      this.logger.log(`Backfilling serial numbers for consignment ${consignment.consignment_id} (ID: ${consignmentId})`);

      // Get all batches for this consignment
      const consignment_batches = consignment.consignment_batches || [];
      const batchIds = consignment_batches.map(cb => cb.batch_id).filter((id): id is number => Boolean(id));

      if (batchIds.length === 0) {
        this.logger.warn(`No batches found for consignment ${consignment.consignment_id}`);
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
            where: { batchNumber: batch.batch_no },
          });

          if (!ppbBatch || !ppbBatch.serializationRange || ppbBatch.serializationRange.length === 0) {
            this.logger.debug(`No serializationRange found for batch ${batch.batch_no}`);
            continue;
          }

          this.logger.log(`Processing batch ${batch.batch_no} with ${ppbBatch.serializationRange.length} serialization ranges`);

          // Parse serialization range
          const parsedSerialization = this.parseSerializationRange(ppbBatch.serializationRange);

          // Expand to individual serial numbers
          const serialNumbers = this.expandSerialization(parsedSerialization);

          if (serialNumbers.length === 0) {
            this.logger.warn(`No serial numbers expanded for batch ${batch.batch_no}`);
            continue;
          }

          this.logger.log(`Expanded ${serialNumbers.length} serial numbers for batch ${batch.batch_no}`);

          // Create serial number records using injected repository
          let createdForBatch = 0;
          
          for (const serial of serialNumbers) {
            // Check if serial already exists
            const existing = await this.serialNumberRepo.findOne({
              where: { batch_id: batch.id, serial_number: serial },
            });

            if (!existing) {
              const serialNumber = this.serialNumberRepo.create({
                batch_id: batch.id,
                consignment_id: consignment.id,
                serial_number: serial,
              });
              await this.serialNumberRepo.save(serialNumber);
              createdForBatch++;
              serialNumbersCreated++;
            }
          }

          batchesProcessed++;
          this.logger.log(`Created ${createdForBatch} serial numbers for batch ${batch.batch_no}`);

        } catch (error: any) {
          const errorMsg = `Error processing batch ${batch.batch_no}: ${error.message}`;
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
        where: { event_id: dto.header.event_id },
      });

      if (existing) {
        throw new BadRequestException(
          `Consignment with event ID ${dto.header.event_id} already exists`,
        );
      }

      // Handle both new (parties object) and legacy formats
      // Priority: parties object > top-level manufacturer/mah > legacy flat fields
      const manufacturer_ppb_id = 
        dto.consignment.parties?.manufacturer_party?.ppb_id ||
        dto.consignment.manufacturer?.ppb_id || 
        dto.consignment.manufacturer_ppb_id;
      const mah_ppb_id = 
        dto.consignment.parties?.mah_party?.ppb_id ||
        dto.consignment.mah?.ppb_id || 
        dto.consignment.mah_ppb_id;
      const manufacturer_gln = 
        dto.consignment.parties?.manufacturer_party?.gln ||
        dto.consignment.manufacturer?.gln || 
        dto.consignment.manufacturer_gln;
      const mah_gln = 
        dto.consignment.parties?.mah_party?.gln ||
        dto.consignment.mah?.gln || 
        dto.consignment.mah_gln;
      const total_quantity = dto.consignment.total_quantity || 0;

      // Create consignment record
      const consignment = this.consignmentRepo.create({
        event_id: dto.header.event_id,
        eventType: dto.header.event_type,
        eventTimestamp: new Date(dto.header.event_timestamp),
        sourceSystem: dto.header.source_system,
        destinationSystem: dto.header.destinationSystem,
        consignment_id: dto.consignment.consignment_id,
        manufacturer_ppb_id,
        mah_ppb_id,
        manufacturer_gln,
        mah_gln,
          registration_no: dto.consignment.registration_no,
          shipment_date: new Date(dto.consignment.shipment_date),
          country_of_origin: dto.consignment.country_of_origin,
          destination_country: dto.consignment.destination_country,
          total_quantity: totalQuantity,
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
          pickup_date: new Date(dto.consignment.shipment_date),
          expected_delivery_date: new Date(dto.consignment.shipment_date),
          pickup_location: logistics.origin || metadata.pickup_location || dto.consignment.country_of_origin,
          destination_address: logistics.final_destination_address || metadata.destination_address || dto.consignment.destination_country,
          carrier: logistics.carrier || metadata.carrier || 'Unknown',
          userId,
          isDispatched: true, // Already shipped from manufacturer
          ssccBarcode: item.sscc || '', // Will be set if SSCC exists
          is_deleted: false,
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
              where: { id: parentPkg.shipment_id },
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
              where: { id: parentCase.package_id },
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
          uniqueLabel = `${item.label}-${savedConsignment.consignment_id}-${item.sscc.slice(-8)}`;
        } else {
          // Use consignment ID and counter
          uniqueLabel = `${item.label}-${savedConsignment.consignment_id}-${labelCount}`;
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
            where: { user_id: userId, label: finalLabel },
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
          `Creating case with unique label: ${uniqueLabel} (original: ${item.label}, consignment: ${savedConsignment.consignment_id})`,
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
            where: { batch_id: batch.id },
            order: { statusDate: 'DESC' },
          });

          // Only create if no status exists or if existing status is not ACTIVE
          if (!existingStatus || existingStatus.status !== 'ACTIVE') {
            const productStatus = productStatusRepo.create({
              product_id: product.id,
              batch_id: batch.id,
              status: 'ACTIVE',
              actor_user_id: userId,
              actor_type: 'manufacturer',
              notes: `Initial status from PPB import - Consignment ${dto.consignment.consignment_id}`,
            });
            await productStatusRepo.save(productStatus);
            this.logger.log(`Created ACTIVE product status for batch ${batch.batch_no}`);
          }
        } catch (error) {
          // Log but don't fail - product status is optional for analytics
          this.logger.warn(
            `Failed to create product status for batch ${batch.batch_no}: ${error.message}`,
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
          case_id: parentCase.id,
          product_id: product.id,
          batch_id: batch.id,
          qty: quantity,
          from_number: 1,
          count: item.serial_numbers?.length || 1,
        });
        await queryRunner.manager.save(caseProduct);

        // Process serialization: expand ranges and merge with explicit serials
        let allSerials: string[] = [];
        
        // First, get explicit serials from serialNumbers (legacy) or serialization.explicit
        if (item.serial_numbers && item.serial_numbers.length > 0) {
          allSerials.push(...item.serial_numbers);
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
              where: { batch_id: batch.id, serialNumber: serial },
            });

            if (!existingSerial) {
              const serialNumber = this.serialNumberRepo.create({
                batch_id: batch.id,
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
          batch_id: batch.id,
          sscc: item.sscc,
        });
        await queryRunner.manager.save(consignmentBatch);

        // Collect batch EPCs for EPCIS ObjectEvent
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(batch.batch_no);
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
          where: { case_id: caseEntity.id },
          relations: ['batch'],
        });

        if (caseProducts.length > 0) {
          const batchEPCs = caseProducts.map((cp) =>
            this.gs1Service.formatBatchNumberAsEPCURI(cp.batch.batch_no),
          );
          const caseEPC = caseEntity.sscc_barcode
            ? `urn:epc:id:sscc:${caseEntity.sscc_barcode}`
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
                  where: { id: cp.product_id },
                });
                if (!product?.gtin) return null;

                const epcClass = `urn:epc:class:lgtin:${product.gtin}.${cp.batch.batch_no}`;
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
                quantity_list: quantityList.length > 0 ? quantityList : undefined,
                // Business transaction: Link to consignment
                biz_transaction_list: savedConsignment.consignment_id
                  ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignment_id)]
                  : undefined,
                // Actor context (P0 - Critical for L5 TNT)
                actor_type: 'manufacturer', // Determine from user role or context
                actor_user_id: userId,
                actor_gln: user?.gln_number || manufacturerGLN,
                actor_organization: user?.organization,
                source_entity_type: 'consignment',
                source_entity_id: savedConsignment.id,
              },
            );
            caseEntity.event_id = eventId;
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
          where: { package_id: pkg.id },
        });

        if (cases.length > 0) {
          const caseEPCs = cases.map((c) =>
            c.sscc_barcode
              ? `urn:epc:id:sscc:${c.sscc_barcode}`
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
                  where: { case_id: caseEntity.id },
                  relations: ['batch'],
                })
              )
            ).then(results => results.flat());

            // Group by product/batch and sum quantities
            const quantityMap = new Map<string, number>();
            for (const cp of allCaseProducts) {
              const product = await queryRunner.manager.findOne(PPBProduct, {
                where: { id: cp.product_id },
              });
              if (!product?.gtin) continue;

              const key = `${product.gtin}.${cp.batch.batch_no}`;
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
                quantity_list: quantityList.length > 0 ? quantityList : undefined,
                // Business transaction: Link to consignment
                biz_transaction_list: savedConsignment.consignment_id
                  ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignment_id)]
                  : undefined,
                // Actor context (P0 - Critical for L5 TNT)
                actor_type: 'manufacturer',
                actor_user_id: userId,
                actor_gln: user?.gln_number || manufacturerGLN,
                actor_organization: user?.organization,
                source_entity_type: 'consignment',
                source_entity_id: savedConsignment.id,
              },
            );
            pkg.event_id = eventId;
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
          where: { shipment_id: shipment.id },
        });

        if (packages.length > 0) {
          const packageEPCs = packages.map((p) =>
            p.sscc_barcode
              ? `urn:epc:id:sscc:${p.sscc_barcode}`
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
                queryRunner.manager.find(Case, { where: { package_id: pkg.id } })
                  .then(cases => Promise.all(
                    cases.map(caseEntity =>
                      queryRunner.manager.find(CasesProducts, {
                        where: { case_id: caseEntity.id },
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
                where: { id: cp.product_id },
              });
              if (!product?.gtin) continue;

              const key = `${product.gtin}.${cp.batch.batch_no}`;
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
                quantity_list: quantityList.length > 0 ? quantityList : undefined,
                // Business transaction: Link to consignment
                biz_transaction_list: savedConsignment.consignment_id
                  ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignment_id)]
                  : undefined,
                // Actor context (P0 - Critical for L5 TNT)
                actor_type: 'manufacturer',
                actor_user_id: userId,
                actor_gln: user?.gln_number || manufacturerGLN,
                actor_organization: user?.organization,
                source_entity_type: 'consignment',
                source_entity_id: savedConsignment.id,
              },
            );
            shipment.event_id = eventId;
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

          const kenyaGLN = dto.consignment.manufacturer_gln || '0000000000000';
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
            biz_transaction_list: savedConsignment.consignment_id
              ? [createBizTransaction('CONSIGNMENT', savedConsignment.consignment_id)]
              : undefined,
            // Actor context (P0 - Critical for L5 TNT)
            actor_type: 'manufacturer',
            actor_user_id: userId,
            actor_gln: user?.gln_number || manufacturerGLN,
            actor_organization: user?.organization,
            source_entity_type: 'consignment',
            source_entity_id: savedConsignment.id,
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
        `Consignment imported: ${savedConsignment.id} - ${savedConsignment.consignment_id}`,
      );

      // Return consignment with relations
      return await this.consignmentRepo.findOne({
        where: { id: savedConsignment.id },
        relations: ['consignment_batches', 'consignment_batches.batch'],
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
        .leftJoinAndSelect('consignment.consignment_batches', 'consignment_batches')
        .leftJoinAndSelect('consignment_batches.batch', 'batch')
        .leftJoinAndSelect('batch.product', 'product')
        .orderBy('consignment.id', 'DESC');

    // Apply filters if provided
    if (filter) {
      const orConditions: string[] = [];
      const params: any = {};
      
      if (filter.manufacturer_ppb_id) {
        orConditions.push('consignment.manufacturer_ppb_id = :ppbCode');
        params.ppbCode = filter.manufacturer_ppb_id;
      }
      
      if (filter.manufacturer_gln) {
        orConditions.push('consignment.manufacturer_gln = :supplierGLN');
        params.supplierGLN = filter.manufacturer_gln;
      }
      
      if (filter.user_id) {
        orConditions.push('consignment.user_id = :userId');
        params.user_id = filter.user_id;
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
    const consignment_batches = consignmentIds.length > 0 
      ? await this.consignmentBatchRepo.find({
          where: { consignment_id: In(consignmentIds) },
          relations: ['batch', 'batch.product'],
        })
      : [];

    // Get all case products that link to these batches
    const batchIds = consignment_batches.map(cb => cb.batch_id).filter((id): id is number => Boolean(id));
    const caseProducts = batchIds.length > 0
      ? await this.casesProductsRepo.find({
          where: { batch_id: In(batchIds) },
          relations: ['case', 'batch', 'product'],
        })
      : [];

    // Group case products by case ID
    const caseProductsByCaseId = new Map<number, typeof caseProducts>();
    for (const cp of caseProducts) {
      if (cp.case_id) {
        if (!caseProductsByCaseId.has(cp.case_id)) {
          caseProductsByCaseId.set(cp.case_id, []);
        }
        caseProductsByCaseId.get(cp.case_id)!.push(cp);
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
    const packageIds = cases.map(c => c.package_id).filter((id): id is number => Boolean(id));
    const packages = packageIds.length > 0
      ? await this.packageRepo.find({
          where: { id: In(packageIds) },
          relations: ['shipment'],
        })
      : [];

    // Get all shipments
    const shipmentIds = packages.map(p => p.shipment_id).filter((id): id is number => Boolean(id));
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
      if (caseItem.package_id) {
        if (!casesByPackageId.has(caseItem.package_id)) {
          casesByPackageId.set(caseItem.package_id, []);
        }
        casesByPackageId.get(caseItem.package_id)!.push(caseItem);
      }
    }

    // Group packages by shipment
    const packagesByShipmentId = new Map<number, typeof packages>();
    for (const pkg of packages) {
      if (pkg.shipment_id) {
        if (!packagesByShipmentId.has(pkg.shipment_id)) {
          packagesByShipmentId.set(pkg.shipment_id, []);
        }
        packagesByShipmentId.get(pkg.shipment_id)!.push(pkg);
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
              batch_id: number;
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
              batch_id: number;
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
      const consignmentBatchIds = consignment_batches
        .filter(cb => cb.consignment_id === consignment.id)
        .map(cb => cb.batch_id);

      // Find all case products that link to these batches
      const relevantCaseProducts = caseProducts.filter(cp => 
        consignmentBatchIds.includes(cp.batch_id)
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
        if (!caseProduct || !caseProduct.case_id) {
          this.logger.warn('Skipping case product - missing caseId');
          continue;
        }
        
        const caseItem = caseMap.get(caseProduct.case_id);
        if (!caseItem) {
          this.logger.warn(`Case ${caseProduct.case_id} not found in caseMap`);
          continue;
        }

        if (!caseItem.package_id) {
          this.logger.warn(`Case ${caseItem.id} has no packageId`);
          continue;
        }
        
        const pkg = packageMap.get(caseItem.package_id);
        if (!pkg) {
          this.logger.warn(`Package ${caseItem.package_id} not found in packageMap`);
          continue;
        }

        if (!pkg.shipment_id) {
          this.logger.warn(`Package ${pkg.id} has no shipmentId`);
          continue;
        }
        
        const shipment = shipmentMap.get(pkg.shipment_id);
        if (!shipment) {
          this.logger.warn(`Shipment ${pkg.shipment_id} not found in shipmentMap`);
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
        if (shipment.sscc_barcode && !ssccData.shipmentSSCCs.includes(shipment.sscc_barcode)) {
          ssccData.shipmentSSCCs.push(shipment.sscc_barcode);
        }
        if (pkg.sscc_barcode && !ssccData.packageSSCCs.includes(pkg.sscc_barcode)) {
          ssccData.packageSSCCs.push(pkg.sscc_barcode);
        }
        if (caseItem.sscc_barcode && !ssccData.caseSSCCs.includes(caseItem.sscc_barcode)) {
          ssccData.caseSSCCs.push(caseItem.sscc_barcode);
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
                batch_id: number;
                gtin: string;
                productName: string;
                quantity: number;
              }>;
            }>;
          }>;
        } = {
          shipmentSSCC: shipmentData.shipment?.sscc_barcode || '',
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
                batch_id: number;
                gtin: string;
                productName: string;
                quantity: number;
              }>;
            }>;
          } = {
            packageSSCC: packageData.package?.sscc_barcode || '',
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
                batch_id: number;
                gtin: string;
                productName: string;
                quantity: number;
              }>;
            } = {
              caseSSCC: caseData.case?.sscc_barcode || '',
              batches: (caseData.batches || []).filter(cp => cp != null).map(cp => ({
                batchNumber: cp.batch?.batch_no || '',
                batch_id: cp.batch_id || 0,
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
      for (const cb of c.consignment_batches || []) {
        if (cb.batch_id && !allBatchIds.includes(cb.batch_id)) {
          allBatchIds.push(cb.batch_id);
        }
      }
    }
    
    let serialCounts: any[] = [];
    
    if (allBatchIds.length > 0) {
      try {
        serialCounts = await this.serialNumberRepo
          .createQueryBuilder('sn')
          .select('sn.batch_id', 'batchId')
          .addSelect('COUNT(sn.id)', 'count')
          .where('sn.batch_id IN (:...batch_ids)', {
            batchIds: allBatchIds,
          })
          .groupBy('sn.batch_id')
          .getRawMany();
      } catch (error: any) {
        this.logger.warn(`Failed to get serial number counts: ${error?.message}`);
        // Continue with empty serial counts
      }
    }

    const serialCountMap = new Map<number, number>();
    for (const sc of serialCounts) {
      serialCountMap.set(sc.batch_id, parseInt(sc.count));
    }

    // Transform to include rich GS1 data with full batch details
    return consignments.map((c) => {
      const batches = c.consignment_batches || [];
      this.logger.debug(`Processing consignment ${c.id} (${c.consignment_id}): ${batches.length} consignment_batches found`);
      
      const uniqueGTINs = new Set<string>();
      const uniqueProducts = new Set<string>();
      let totalSerialNumbers = 0;

      // Build full batch details array
      const batchDetails = batches.map((cb) => {
        const batch = cb.batch;
        // Ensure product is loaded - if not, fetch it
        let product = batch?.product;
        if (!product && batch?.product_id) {
          // Product relation might not be loaded, but we have productId
          // The product should already be loaded via the query, but if not, we'll handle it
        }
        
        const serialCount = serialCountMap.get(cb.batch_id) || 0;
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
          batchNumber: batch?.batch_no,
          expiryDate: batch?.expiry,
          quantity: batch?.qty,
          sentQuantity: batch?.sent_qty,
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
        eventID: c.event_id,
        eventType: c.event_type,
        eventTimestamp: c.event_timestamp,
        sourceSystem: c.source_system,
        destinationSystem: c.destinationSystem,
        consignmentID: c.consignment_id,
        registrationNo: c.registration_no,
        manufacturerPPBID: c.manufacturer_ppb_id,
        manufacturerGLN: c.manufacturer_gln,
        MAHPPBID: c.mah_ppb_id,
        MAHGLN: c.mah_gln,
        shipmentDate: c.shipment_date,
        countryOfOrigin: c.country_of_origin,
        destinationCountry: c.destination_country,
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
        createdAt: c.created_at,
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
        'consignment_batches',
        'consignment_batches.batch',
        'consignment_batches.batch.product',
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
        'consignment_batches',
        'consignment_batches.batch',
        'consignment_batches.batch.product',
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
        filter.manufacturer_ppb_id = supplier.ppbCode; // For now, filter by PPBID
      }
      if (supplier.legalEntityGLN) {
        filter.manufacturer_gln = supplier.legalEntityGLN; // For now, filter by GLN
      }
    }
    
    if (user.gln_number) {
      filter.manufacturer_gln = user.gln_number;
    }
    
    // Fallback to userId if no supplier/GLN found
    if (!filter.manufacturer_ppb_id && !filter.manufacturer_gln) {
      filter.user_id = userId;
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
        filter.manufacturer_ppb_id = supplier.ppbCode;
      }
      if (supplier.legalEntityGLN) {
        filter.manufacturer_gln = supplier.legalEntityGLN;
      }
    }
    
    if (user.gln_number) {
      filter.manufacturer_gln = user.gln_number;
    }
    
    // Fallback to userId if no supplier/GLN found
    if (!filter.manufacturer_ppb_id && !filter.manufacturer_gln) {
      filter.user_id = userId;
    }

    return this.findAll(filter);
  }
}

