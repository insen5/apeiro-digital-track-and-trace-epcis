import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Case } from '../../../shared/domain/entities/case.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { CasesProducts } from '../../../shared/domain/entities/cases-products.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { GS1Service, createQuantity, createBizTransaction, UnitOfMeasure } from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../master-data/master-data.service';
import { Package } from '../../../shared/domain/entities/package.entity';

/**
 * Case Service (Shared Module)
 *
 * Creates cases by aggregating batches.
 * Used by manufacturers, distributors, and consignment import.
 * - Validates available quantities (qty - sentQty)
 * - Uses GS1 Service for EPCIS events
 * - Updates batch sentQty
 * - Assigns SSCC to cases (used by both manufacturers and distributors)
 */
@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(CasesProducts)
    private readonly casesProductsRepo: Repository<CasesProducts>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gs1Service: GS1Service,
    private readonly masterDataService: MasterDataService,
  ) {}

  /**
   * Create a case by aggregating batches
   */
  async create(
    userId: string,
    packageId: number,
    dto: CreateCaseDto,
  ): Promise<Case> {
    const batchIds = dto.products.map((p) => p.batch_id);
    const batches = await this.batchRepo.find({
      where: { id: In(batchIds), user_id, is_enabled: true },
    });

    if (batches.length !== batchIds.length) {
      throw new NotFoundException('One or more batches not found');
    }

    // Validate quantities - can do math because qty is NUMERIC!
    for (const product of dto.products) {
      const batch = batches.find((b) => b.id === product.batch_id);
      if (!batch) {
        throw new NotFoundException(
          `Batch with ID ${product.batch_id} not found`,
        );
      }

      const availableQty = Number(batch.qty) - Number(batch.sent_qty);
      if (availableQty < product.qty) {
        throw new BadRequestException(
          `Not enough quantity in batch ${batch.batch_no}. Available: ${availableQty}, requested: ${product.qty}`,
        );
      }
    }

    // Validate SSCC format (required for manufacturer case creation)
    if (!dto.sscc) {
      throw new BadRequestException('SSCC is required for case creation');
    }

    if (!this.gs1Service.validateSSCC(dto.sscc)) {
      throw new BadRequestException(`Invalid SSCC format: ${dto.sscc}`);
    }

    // Check if SSCC already exists
    const existingCase = await this.caseRepo.findOne({
      where: { sscc_barcode: dto.sscc },
    });
    if (existingCase) {
      throw new BadRequestException(
        `SSCC ${dto.sscc} is already assigned to case ${existingCase.id}`,
      );
    }

    // Get user's organization to retrieve GS1 prefix (for validation context)
    const user = await this.userRepo.findOne({ where: { id: userId } });
    let company_prefix: string | undefined;

    if (user?.organization) {
      const supplier = await this.masterDataService.getSupplierByEntityId(
        user.organization,
      );
      if (supplier?.gs1Prefix) {
        company_prefix = supplier.gs1Prefix;
      }
    }

    // Create case with SSCC (mandatory)
    const newCase = this.caseRepo.create({
      label: dto.label,
      package_id: packageId,
      user_id: userId,
      is_dispatched: false,
      sscc_barcode: dto.sscc, // SSCC is mandatory
      sscc_generated_at: new Date(),
    });

    const savedCase = await this.caseRepo.save(newCase);

    // Create case-products relationships
    const caseProducts = dto.products.map((p, index) => {
      const batch = batches.find((b) => b.id === p.batch_id);
      return this.casesProductsRepo.create({
        case_id: savedCase.id,
        product_id: p.product_id,
        batch_id: p.batch_id,
        qty: p.qty, // NUMERIC type
        from_number: index + 1,
        count: 1,
      });
    });

    await this.casesProductsRepo.save(caseProducts);

    // Update batch sentQty
    for (const product of dto.products) {
      const batch = batches.find((b) => b.id === product.batch_id);
      if (batch) {
        batch.sent_qty = Number(batch.sent_qty) + product.qty;
        await this.batchRepo.save(batch);
      }
    }

    // Create EPCIS AggregationEvent using GS1 Service
    const batchEPCs = batches.map((b) =>
      this.gs1Service.formatBatchNumberAsEPCURI(b.batch_no),
    );
    // Use SSCC for case EPC (mandatory now)
    const caseEPC = `urn:epc:id:sscc:${savedCase.sscc_barcode}`;

    try {
      // User already fetched above

      // Build quantity list from products
      const quantityList = await Promise.all(
        dto.products.map(async (product) => {
          const batch = batches.find((b) => b.id === product.batch_id);
          if (!batch) return null;

          // Get product GTIN from master data
          try {
            const productData = await this.masterDataService.findOne(product.product_id);
            if (!productData?.gtin) return null;

            const epcClass = `urn:epc:class:lgtin:${productData.gtin}.${batch.batch_no}`;
            return createQuantity(epcClass, product.qty, UnitOfMeasure.EACH);
          } catch (error) {
            // If product not found, skip this quantity entry
            this.logger.warn(`Product ${product.product_id} not found, skipping quantity entry`);
            return null;
          }
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
          biz_transaction_list: [createBizTransaction('CASE', `CASE-${savedCase.id}`)],
          // Actor context (P0 - Critical for L5 TNT)
          actor_type: 'manufacturer',
          actor_user_id: userId,
          actor_gln: user?.gln_number,
          actor_organization: user?.organization,
          source_entity_type: 'case',
          source_entity_id: savedCase.id,
        },
      );

      savedCase.event_id = eventId;
      await this.caseRepo.save(savedCase);
    } catch (error: any) {
      this.logger.error(
        `Failed to create EPCIS event for case ${savedCase.id}`,
        error?.message,
      );
      // Don't fail case creation if EPCIS event fails
    }

    this.logger.log(`Case created: ${savedCase.id} - ${savedCase.label}`);
    return savedCase;
  }

  /**
   * Get all cases for a user
   */
  async findAll(userId: string): Promise<Case[]> {
    return this.caseRepo.find({
      where: { user_id: userId },
      relations: ['products', 'products.batch', 'products.product'],
      order: { id: 'DESC' },
    });
  }

  /**
   * Get case by ID
   */
  async findOne(id: number, userId: string): Promise<Case> {
    const caseEntity = await this.caseRepo.findOne({
      where: { id, userId },
      relations: ['products', 'products.batch', 'products.product'],
    });

    if (!caseEntity) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return caseEntity;
  }

  /**
   * Assign SSCC to a case (carton)
   * Generates a new SSCC if not provided
   */
  async assignSSCC(
    id: number,
    userId: string,
    sscc?: string,
  ): Promise<Case> {
    const caseEntity = await this.caseRepo.findOne({
      where: { id, userId },
    });

    if (!caseEntity) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    if (caseEntity.sscc_barcode) {
      throw new BadRequestException(
        `Case ${id} already has an SSCC: ${caseEntity.sscc_barcode}`,
      );
    }

    // Get user's organization to retrieve GS1 prefix
    const user = await this.userRepo.findOne({ where: { id: userId } });
    let company_prefix: string | undefined;

    if (user?.organization) {
      const supplier = await this.masterDataService.getSupplierByEntityId(
        user.organization,
      );
      if (supplier?.gs1Prefix) {
        company_prefix = supplier.gs1Prefix;
        this.logger.log(
          `Using GS1 prefix ${company_prefix} for organization ${user.organization}`,
        );
      } else {
        this.logger.warn(
          `No GS1 prefix found for organization ${user.organization}`,
        );
      }
    }

    // Generate SSCC if not provided
    const finalSSCC =
      sscc ||
      (await this.gs1Service.generateSSCC(
        company_prefix ? { company_prefix } : undefined,
      ));

    // Validate SSCC format
    if (!this.gs1Service.validateSSCC(finalSSCC)) {
      throw new BadRequestException(`Invalid SSCC format: ${finalSSCC}`);
    }

    // Check if SSCC already exists
    const existingCase = await this.caseRepo.findOne({
      where: { sscc_barcode: finalSSCC },
    });
    if (existingCase) {
      throw new BadRequestException(
        `SSCC ${finalSSCC} is already assigned to case ${existingCase.id}`,
      );
    }

    caseEntity.sscc_barcode = finalSSCC;
    caseEntity.sscc_generated_at = new Date();
    await this.caseRepo.save(caseEntity);

    this.logger.log(`SSCC ${finalSSCC} assigned to case ${id}`);
    return caseEntity;
  }
}

