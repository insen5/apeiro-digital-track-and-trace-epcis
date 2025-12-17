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
import { CreatePackageDto } from '../dto/create-package.dto';
import { GS1Service } from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../../shared/master-data/master-data.service';

/**
 * Package Service (Manufacturer Module)
 *
 * Creates packages by aggregating cases.
 * - Uses GS1 Service for EPCIS events
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
      where: { id: In(dto.caseIds), userId },
      relations: ['package'],
    });

    if (caseEntities.length !== dto.caseIds.length) {
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
      shipmentId,
      userId,
      isDispatched: false,
      cases: caseEntities,
    });

    const savedPackage = await this.packageRepo.save(pkg);

    // Update cases to reference this package
    for (const c of caseEntities) {
      c.packageId = savedPackage.id;
      c.isDispatched = true;
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
          actorType: 'manufacturer',
          actorUserId: userId,
          actorGLN: user?.glnNumber,
          actorOrganization: user?.organization,
          sourceEntityType: 'package',
          sourceEntityId: savedPackage.id,
        },
      );

      savedPackage.eventId = eventId;
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
      where: { userId },
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

    if (pkg.ssccBarcode) {
      throw new BadRequestException(
        `Package ${id} already has an SSCC: ${pkg.ssccBarcode}`,
      );
    }

    // Get user's organization to retrieve GS1 prefix
    const user = await this.userRepo.findOne({ where: { id: userId } });
    let companyPrefix: string | undefined;

    if (user?.organization) {
      const supplier = await this.masterDataService.getSupplierByEntityId(
        user.organization,
      );
      if (supplier?.gs1Prefix) {
        companyPrefix = supplier.gs1Prefix;
        this.logger.log(
          `Using GS1 prefix ${companyPrefix} for organization ${user.organization}`,
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
        companyPrefix ? { companyPrefix } : undefined,
      ));

    // Validate SSCC format
    if (!this.gs1Service.validateSSCC(finalSSCC)) {
      throw new BadRequestException(`Invalid SSCC format: ${finalSSCC}`);
    }

    // Check if SSCC already exists
    const existingPackage = await this.packageRepo.findOne({
      where: { ssccBarcode: finalSSCC },
    });
    if (existingPackage) {
      throw new BadRequestException(
        `SSCC ${finalSSCC} is already assigned to package ${existingPackage.id}`,
      );
    }

    pkg.ssccBarcode = finalSSCC;
    pkg.ssccGeneratedAt = new Date();
    await this.packageRepo.save(pkg);

    this.logger.log(`SSCC ${finalSSCC} assigned to package ${id}`);
    return pkg;
  }
}

