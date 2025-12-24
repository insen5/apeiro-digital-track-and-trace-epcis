import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HierarchyChange, HierarchyOperationType } from '../../../shared/domain/entities/hierarchy-change.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { CasesProducts } from '../../../shared/domain/entities/cases-products.entity';
import { GS1Service } from '../../../shared/gs1/gs1.service';
import { PackDto, PackLiteDto, PackLargeDto, UnpackAllDto } from './dto/pack.dto';

@Injectable()
export class HierarchyService {
  private readonly logger = new Logger(HierarchyService.name);

  constructor(
    @InjectRepository(HierarchyChange)
    private readonly hierarchyChangeRepo: Repository<HierarchyChange>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(CasesProducts)
    private readonly casesProductsRepo: Repository<CasesProducts>,
    private readonly gs1Service: GS1Service,
  ) {}

  /**
   * Pack operation: Create new package from cases
   */
  async pack(userId: string, dto: PackDto): Promise<Package> {
    this.logger.log(`Packing ${dto.case_ids.length} cases into new package for user ${userId}`);

    // Validate cases exist and belong to user
    const cases = await this.caseRepo.find({
      where: { id: In(dto.case_ids), user_id: userId },
      relations: ['casesProducts'],
    });

    if (cases.length !== dto.case_ids.length) {
      throw new NotFoundException('Some cases not found or do not belong to user');
    }

    // Check if cases are already packed
    const alreadyPacked = cases.filter(c => c.package_id !== null);
    if (alreadyPacked.length > 0) {
      throw new BadRequestException(
        `Cases ${alreadyPacked.map(c => c.id).join(', ')} are already packed`
      );
    }

    // Generate new SSCC (GenerateSSCCDto only accepts company_prefix, not userId)
    const newSSCC = await this.gs1Service.generateSSCC({});

    // Create new package
    const newPackage = this.packageRepo.create({
      label: dto.label || `Package-${new Date().getTime()}`,
      shipment_id: dto.shipment_id,
      user_id: userId,
      sscc_barcode: newSSCC,
      sscc_generated_at: new Date(),
      is_dispatched: false,
    });

    const savedPackage = await this.packageRepo.save(newPackage);

    // Update cases to belong to this package
    await this.caseRepo.update(
      { id: In(dto.case_ids) },
      { package_id: savedPackage.id }
    );

    // Log hierarchy change
    await this.logHierarchyChange({
      operation_type: HierarchyOperationType.PACK,
      new_sscc: newSSCC,
      actor_user_id: userId,
      actor_type: 'manufacturer', // Default, can be enhanced
      notes: dto.notes,
    });

    this.logger.log(`Successfully packed ${cases.length} cases into package ID ${savedPackage.id} with SSCC ${newSSCC}`);

    return savedPackage;
  }

  /**
   * Pack Lite: Small repackaging operation
   */
  async packLite(userId: string, dto: PackLiteDto): Promise<Package> {
    this.logger.log(`Pack Lite operation for user ${userId}`);
    
    const result = await this.pack(user_id, dto);
    
    // Update hierarchy change to PACK_LITE
    await this.hierarchyChangeRepo.update(
      { new_sscc: result.sscc_barcode },
      { operation_type: HierarchyOperationType.PACK_LITE }
    );
    
    return result;
  }

  /**
   * Pack Large: Large repackaging operation
   */
  async packLarge(userId: string, dto: PackLargeDto): Promise<Package> {
    this.logger.log(`Pack Large operation for user ${userId}`);
    
    const result = await this.pack(user_id, dto);
    
    // Update hierarchy change to PACK_LARGE
    await this.hierarchyChangeRepo.update(
      { new_sscc: result.sscc_barcode },
      { operation_type: HierarchyOperationType.PACK_LARGE }
    );
    
    return result;
  }

  /**
   * Unpack: Break package into cases
   */
  async unpack(userId: string, packageId: number): Promise<Case[]> {
    this.logger.log(`Unpacking package ID ${packageId} for user ${userId}`);

    // Find package
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, userId },
      relations: ['cases'],
    });

    if (!pkg) {
      throw new NotFoundException(`Package ${packageId} not found or does not belong to user`);
    }

    if (!pkg.cases || pkg.cases.length === 0) {
      throw new BadRequestException('Package has no cases to unpack');
    }

    if (pkg.is_dispatched) {
      throw new BadRequestException('Cannot unpack a dispatched package');
    }

    const oldSSCC = pkg.sscc_barcode;

    // Release cases from package
    await this.caseRepo.update(
      { packageId },
      { packageId: null }
    );

    // Log hierarchy change
    await this.logHierarchyChange({
      operation_type: HierarchyOperationType.UNPACK,
      oldSscc: oldSSCC,
      actor_user_id: userId,
      actor_type: 'distributor', // Default
      notes: `Unpacked package ${packageId}`,
    });

    // Get released cases
    const cases = await this.caseRepo.find({
      where: { id: In(pkg.cases.map(c => c.id)) },
    });

    this.logger.log(`Successfully unpacked package ${packageId}, released ${cases.length} cases`);

    return cases;
  }

  /**
   * Unpack All: Bulk unpacking operation
   */
  async unpackAll(userId: string, dto: UnpackAllDto): Promise<Case[]> {
    this.logger.log(`Unpacking ${dto.package_ids.length} packages for user ${userId}`);

    const allCases: Case[] = [];

    for (const packageId of dto.package_ids) {
      try {
        const cases = await this.unpack(user_id, packageId);
        allCases.push(...cases);
      } catch (error) {
        this.logger.error(`Failed to unpack package ${packageId}:`, error.message);
        // Continue with other packages
      }
    }

    // Log bulk unpack
    await this.logHierarchyChange({
      operation_type: HierarchyOperationType.UNPACK_ALL,
      actor_user_id: userId,
      actor_type: 'distributor',
      notes: dto.notes || `Bulk unpacked ${dto.package_ids.length} packages`,
    });

    this.logger.log(`Bulk unpack complete: ${allCases.length} total cases released`);

    return allCases;
  }

  /**
   * Repack: Unpack and then repack with new SSCC
   * Used when package needs reorganization
   */
  async repack(userId: string, packageId: number, newShipmentId: number): Promise<Package> {
    this.logger.log(`Repacking package ${packageId}`);

    // Get old package
    const oldPackage = await this.packageRepo.findOne({
      where: { id: packageId, userId },
      relations: ['cases'],
    });

    if (!oldPackage) {
      throw new NotFoundException(`Package ${packageId} not found`);
    }

    const oldSSCC = oldPackage.sscc_barcode;

    // Unpack
    const cases = await this.unpack(user_id, packageId);

    // Pack into new package
    const newPackage = await this.pack(user_id, {
      caseIds: cases.map(c => c.id),
      shipmentId: newShipmentId,
      label: oldPackage.label + ' (Repacked)',
      notes: `Repacked from package ${packageId}`,
    });

    // Update old package to track reassignment
    await this.packageRepo.update(packageId, {
      previousSscc: oldSSCC,
      reassignedAt: new Date(),
    });

    this.logger.log(`Repacked package ${packageId}: ${oldSSCC} → ${newPackage.sscc_barcode}`);

    return newPackage;
  }

  /**
   * Get hierarchy change history
   */
  async getHierarchyHistory(
    userId?: string,
    operationType?: HierarchyOperationType,
    limit: number = 50
  ): Promise<HierarchyChange[]> {
    const where: any = {};
    if (userId) where.actorUserId = userId;
    if (operationType) where.operationType = operationType;

    return this.hierarchyChangeRepo.find({
      where,
      relations: ['actor'],
      order: { changeDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get hierarchy changes by SSCC
   */
  async getHistoryBySSCC(sscc: string): Promise<HierarchyChange[]> {
    return this.hierarchyChangeRepo.find({
      where: [
        { parentSscc: sscc },
        { new_sscc: sscc },
        { oldSscc: sscc },
      ],
      relations: ['actor'],
      order: { changeDate: 'DESC' },
    });
  }

  /**
   * Log hierarchy change for audit trail
   */
  private async logHierarchyChange(data: {
    operation_type: HierarchyOperationType;
    parentSscc?: string;
    newSscc?: string;
    oldSscc?: string;
    actor_user_id: string;
    actorType?: string;
    notes?: string;
  }): Promise<HierarchyChange> {
    const change = this.hierarchyChangeRepo.create({
      ...data,
      changeDate: new Date(),
    });

    return this.hierarchyChangeRepo.save(change);
  }
}
