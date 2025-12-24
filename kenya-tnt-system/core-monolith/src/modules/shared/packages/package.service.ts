import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { GS1Service } from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../master-data/master-data.service';

/**
 * Package Service (Shared Module)
 *
 * Creates packages by aggregating cases.
 * Used by manufacturers (create packages) and distributors (repackage, assign SSCC).
 * - Uses GS1 Service for EPCIS events
 * - Supports SSCC assignment for tracking
 */
@Injectable()
export class PackageService {
  private readonly logger = new Logger(PackageService.name);

  constructor(
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gs1Service: GS1Service,
    private readonly masterDataService: MasterDataService,
  ) {}

  /**
   * Create a package by aggregating cases
   */
  async create(
    userId: string,
    shipmentId: number,
    dto: CreatePackageDto,
  ): Promise<Package> {
    const caseEntities = await this.caseRepo.find({
      where: { id: In(dto.case_ids), user_id: userId },
      relations: ['package'],
    });

    if (caseEntities.length !== dto.case_ids.length) {
      throw new NotFoundException('One or more cases not found');
    }

    // Check if cases are already in a package
    for (const c of caseEntities) {
      if (c.package) {
        throw new BadRequestException(
          `Case ${c.label} is already packed in package ${c.package.label}`,
        );
      }
    }

    // Create package
    const pkg = this.packageRepo.create({
      label: dto.label,
      shipment_id: shipmentId,
      user_id: userId,
      is_dispatched: false,
      cases: caseEntities,
    });

    const savedPackage = await this.packageRepo.save(pkg);

    // Update cases to reference this package
    for (const c of caseEntities) {
      c.package_id = savedPackage.id;
      c.is_dispatched = true;
      await this.caseRepo.save(c);
    }

    // Create EPCIS AggregationEvent using GS1 Service
    const caseEPCs = caseEntities.map(
      (c) => `https://example.com/cases/${c.label.replace(/\s+/g, '')}`,
    );
    const packageEPC = `https://example.com/packages/${savedPackage.label.replace(/\s+/g, '')}`;

    try {
      // Get user for actor context
      const user = await this.userRepo.findOne({ where: { id: userId } });

      const eventId = await this.gs1Service.createAggregationEvent(
        packageEPC,
        caseEPCs,
        {
          bizStep: 'packing',
          disposition: 'in_progress',
          // Actor context (P0 - Critical for L5 TNT)
          actor_type: 'manufacturer',
          actor_user_id: userId,
          actor_gln: user?.gln_number,
          actor_organization: user?.organization,
          source_entity_type: 'package',
          source_entity_id: savedPackage.id,
        },
      );

      savedPackage.event_id = eventId;
      await this.packageRepo.save(savedPackage);
    } catch (error: any) {
      this.logger.error(
        `Failed to create EPCIS event for package ${savedPackage.id}`,
        error?.message,
      );
    }

    this.logger.log(`Package created: ${savedPackage.id} - ${savedPackage.label}`);
    return savedPackage;
  }

  /**
   * Get all packages for a user
   */
  async findAll(userId: string): Promise<Package[]> {
    return this.packageRepo.find({
      where: { user_id: userId },
      relations: ['cases', 'cases.products', 'cases.products.batch'],
      order: { id: 'DESC' },
    });
  }

  /**
   * Get package by ID
   */
  async findOne(id: number, userId: string): Promise<Package> {
    const pkg = await this.packageRepo.findOne({
      where: { id, userId },
      relations: ['cases', 'cases.products', 'cases.products.batch'],
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return pkg;
  }

  /**
   * Assign SSCC to a package (pallet)
   * Generates a new SSCC if not provided
   */
  async assignSSCC(
    id: number,
    userId: string,
    sscc?: string,
  ): Promise<Package> {
    const pkg = await this.packageRepo.findOne({
      where: { id, userId },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    if (pkg.sscc_barcode) {
      throw new BadRequestException(
        `Package ${id} already has an SSCC: ${pkg.sscc_barcode}`,
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
    const existingPackage = await this.packageRepo.findOne({
      where: { sscc_barcode: finalSSCC },
    });
    if (existingPackage) {
      throw new BadRequestException(
        `SSCC ${finalSSCC} is already assigned to package ${existingPackage.id}`,
      );
    }

    pkg.sscc_barcode = finalSSCC;
    pkg.sscc_generated_at = new Date();
    await this.packageRepo.save(pkg);

    this.logger.log(`SSCC ${finalSSCC} assigned to package ${id}`);
    return pkg;
  }
}

