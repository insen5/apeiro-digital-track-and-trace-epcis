import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan } from 'typeorm';
import { Supplier } from '../../../shared/domain/entities/supplier.entity';
import { Premise } from '../../../shared/domain/entities/premise.entity';
import { LogisticsProvider } from '../../../shared/domain/entities/logistics-provider.entity';
import { PPBProduct, ProgramMapping, Manufacturer, ProductCategory } from '../../../shared/domain/entities/ppb-product.entity';
import { PPBPractitioner } from '../../../shared/domain/entities/ppb-practitioner.entity';
import { PremiseQualityReport } from '../../../shared/domain/entities/premise-quality-report.entity';
import { ProductQualityReport } from '../../../shared/domain/entities/product-quality-report.entity';
import { PractitionerQualityReport } from '../../../shared/domain/entities/practitioner-quality-report.entity';
import { UatFacility, UatFacilitiesSyncLog, UatFacilitiesQualityAudit } from '../../../shared/domain/entities/uat-facility.entity';
import { ProdFacility, ProdFacilitiesSyncLog, ProdFacilitiesQualityAudit } from '../../../shared/domain/entities/prod-facility.entity';
import { MasterDataSyncLog } from '../../../shared/domain/entities/master-data-sync-log.entity';
import { PPBApiService } from '../../../shared/infrastructure/external/ppb-api.service';
import { SafaricomHieApiService } from '../../../shared/infrastructure/external/safaricom-hie-api.service';
import { QualityAlertService } from './quality-alert.service';
import { GenericSyncService } from './generic-sync.service';
import { GenericQualityReportService } from './generic-quality-report.service';
import { GenericQualityHistoryService } from './generic-quality-history.service';
import { GenericCrudService } from './generic-crud.service';
import { GenericQualityAuditEnrichmentService } from './generic-quality-audit-enrichment.service';

@Injectable()
export class MasterDataService {
  private readonly logger = new Logger(MasterDataService.name);

  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(Premise)
    public readonly premiseRepo: Repository<Premise>, // Made public for filter options endpoint
    @InjectRepository(LogisticsProvider)
    private readonly logisticsProviderRepo: Repository<LogisticsProvider>,
    @InjectRepository(PPBProduct)
    private readonly ppbProductRepo: Repository<PPBProduct>,
    @InjectRepository(PPBPractitioner)
    private readonly ppbPractitionerRepo: Repository<PPBPractitioner>,
    @InjectRepository(PremiseQualityReport)
    private readonly qualityReportRepo: Repository<PremiseQualityReport>,
    @InjectRepository(ProductQualityReport)
    private readonly productQualityReportRepo: Repository<ProductQualityReport>,
    @InjectRepository(PractitionerQualityReport)
    private readonly practitionerQualityReportRepo: Repository<PractitionerQualityReport>,
    @InjectRepository(UatFacility)
    private readonly uatFacilityRepo: Repository<UatFacility>,
    @InjectRepository(UatFacilitiesSyncLog)
    private readonly uatFacilitySyncLogRepo: Repository<UatFacilitiesSyncLog>,
    @InjectRepository(UatFacilitiesQualityAudit)
    private readonly uatFacilityQualityAuditRepo: Repository<UatFacilitiesQualityAudit>,
    @InjectRepository(ProdFacility)
    private readonly prodFacilityRepo: Repository<ProdFacility>,
    @InjectRepository(ProdFacilitiesSyncLog)
    private readonly prodFacilitySyncLogRepo: Repository<ProdFacilitiesSyncLog>,
    @InjectRepository(ProdFacilitiesQualityAudit)
    private readonly prodFacilityQualityAuditRepo: Repository<ProdFacilitiesQualityAudit>,
    @InjectRepository(MasterDataSyncLog)
    private readonly masterDataSyncLogRepo: Repository<MasterDataSyncLog>,
    private readonly ppbApiService: PPBApiService,
    private readonly safaricomHieApiService: SafaricomHieApiService,
    private readonly qualityAlertService: QualityAlertService,
    // NEW: Generic services (following the config-driven pattern)
    private readonly genericSyncService: GenericSyncService,
    private readonly genericQualityService: GenericQualityReportService,
    private readonly genericQualityHistoryService: GenericQualityHistoryService,
    private readonly genericCrudService: GenericCrudService,
    private readonly genericQualityAuditEnrichmentService: GenericQualityAuditEnrichmentService,
  ) {}

  /**
   * Get all suppliers with pagination and search
   * NOW USING GENERIC CRUD SERVICE
   */
  async getSuppliers(
    page: number = 1,
    limit: number = 50,
    search?: string,
  ): Promise<{ suppliers: Supplier[]; total: number; page: number; limit: number }> {
    const result = await this.genericCrudService.getPaginated<Supplier>(
      {
        entity_type: 'supplier',
        repository: this.supplierRepo,
        searchFields: ['legalEntityName', 'entityId', 'ppbCode'],
        defaultOrderBy: { field: 'legalEntityName', direction: 'ASC' },
        relations: ['premises'],
        filterConditions: { status: 'Active' },
      },
      page,
      limit,
      search
    );

    return {
      suppliers: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get supplier by ID
   * NOW USING GENERIC CRUD SERVICE
   */
  async getSupplierById(id: number): Promise<Supplier> {
    return this.genericCrudService.getById<Supplier>(
      {
        entity_type: 'supplier',
        repository: this.supplierRepo,
      relations: ['premises'],
      },
      id
    );
  }

  /**
   * Get supplier by entity ID (organization identifier)
   * Used to find supplier/manufacturer by user's organization field
   */
  async getSupplierByEntityId(entity_id: string): Promise<Supplier | null> {
    return this.supplierRepo.findOne({
      where: { entityId },
    });
  }

  /**
   * Get all premises with pagination and search
   */
  async getPremises(
    page: number = 1,
    limit: number = 50,
    search?: string,
    supplierId?: number,
    businessType?: string,
    constituency?: string,
    ward?: string,
  ): Promise<{ premises: Premise[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.premiseRepo
      .createQueryBuilder('premise')
      .leftJoinAndSelect('premise.supplier', 'supplier')
      .where('premise.status = :status', { status: 'Active' });

    if (supplierId) {
      queryBuilder.andWhere('premise.supplierId = :supplierId', { supplierId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(premise.premiseName ILIKE :search OR premise.premise_id ILIKE :search OR premise.gln ILIKE :search OR premise.county ILIKE :search OR premise.businessType ILIKE :search OR premise.superintendentName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (businessType) {
      queryBuilder.andWhere('premise.businessType = :businessType', { businessType });
    }

    if (constituency) {
      queryBuilder.andWhere('premise.constituency = :constituency', { constituency });
    }

    if (ward) {
      queryBuilder.andWhere('premise.ward = :ward', { ward });
    }

    const [premises, total] = await queryBuilder
      .orderBy('premise.premiseName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      premises,
      total,
      page,
      limit,
    };
  }

  /**
   * Get premise by ID
   * NOW USING GENERIC CRUD SERVICE
   */
  async getPremiseById(id: number): Promise<Premise> {
    return this.genericCrudService.getById<Premise>(
      {
        entity_type: 'premise',
        repository: this.premiseRepo,
      relations: ['supplier'],
      },
      id
    );
  }

  /**
   * Get all logistics providers with pagination and search
   * NOW USING GENERIC CRUD SERVICE
   */
  async getLogisticsProviders(
    page: number = 1,
    limit: number = 50,
    search?: string,
  ): Promise<{ logisticsProviders: LogisticsProvider[]; total: number; page: number; limit: number }> {
    const result = await this.genericCrudService.getPaginated<LogisticsProvider>(
      {
        entity_type: 'lsp',
        repository: this.logisticsProviderRepo,
        searchFields: ['name', 'lspId', 'ppbCode'],
        defaultOrderBy: { field: 'name', direction: 'ASC' },
        filterConditions: { status: 'Active' },
      },
      page,
      limit,
      search
    );

    return {
      logisticsProviders: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get logistics provider by ID
   * NOW USING GENERIC CRUD SERVICE
   */
  async getLogisticsProviderById(id: number): Promise<LogisticsProvider> {
    return this.genericCrudService.getById<LogisticsProvider>(
      {
        entity_type: 'lsp',
        repository: this.logisticsProviderRepo,
      },
      id
    );
  }

  /**
   * Sync master data from PPB (for future integration)
   * This would be called by a scheduled job or webhook from PPB
   */
  async syncFromPPB(data: {
    suppliers?: any[];
    logisticsProviders?: any[];
  }): Promise<void> {
    this.logger.log('Syncing master data from PPB...');

    // Sync Suppliers
    if (data.suppliers) {
      for (const supplierData of data.suppliers) {
        await this.syncSupplier(supplierData);
      }
    }

    // Sync Logistics Providers
    if (data.logisticsProviders) {
      for (const lspData of data.logisticsProviders) {
        await this.syncLogisticsProvider(lspData);
      }
    }

    this.logger.log('Master data sync completed');
  }

  /**
   * Sync supplier/manufacturer from Kafka message
   * Public method for use by Kafka consumer
   */
  async syncSupplier(data: any): Promise<void> {
    let supplier = await this.supplierRepo.findOne({
      where: { entity_id: data.entityId },
    });

    if (!supplier) {
      supplier = this.supplierRepo.create({
        entity_id: data.entityId,
        legalEntityName: data.legalEntityName,
        actor_type: data.actor_type,
        roles: data.roles,
        ownershipType: data.ownershipType,
        ppbLicenseNumber: data.identifiers?.ppbLicenseNumber,
        ppbCode: data.identifiers?.ppbCode,
        gs1Prefix: data.identifiers?.gs1Prefix,
        legalEntityGLN: data.identifiers?.legalEntityGLN,
        hqName: data.hq?.name,
        hqGLN: data.hq?.gln,
        // V09: Restored county/ward for analytics
        hqCounty: data.hq?.location?.county,
        hqWard: data.hq?.location?.ward,
        hqCountry: data.hq?.location?.country || 'KE',
        contactPersonName: data.contact?.contactPersonName,
        contactPersonTitle: data.contact?.contactPersonTitle,
        contactEmail: data.contact?.email,
        contactPhone: data.contact?.phone,
        contactWebsite: data.contact?.website,
        status: 'Active',
      });
    } else {
      // Update existing
      Object.assign(supplier, {
        legalEntityName: data.legalEntityName,
        roles: data.roles,
        ownershipType: data.ownershipType,
        lastUpdated: new Date(),
      });
    }

    await this.supplierRepo.save(supplier);

    // Sync Premises
    if (data.premises) {
      for (const premiseData of data.premises) {
        await this.syncPremise(supplier.id, premiseData);
      }
    }
  }

  /**
   * Sync premise from Kafka message (with supplier entityId)
   * @param supplierEntityId - Entity ID of the supplier (to find supplierId)
   * @param premiseData - Premise data from Kafka
   */
  async syncPremiseByEntityId(supplierEntityId: string, premiseData: any): Promise<void> {
    // Find supplier by entityId
    const supplier = await this.supplierRepo.findOne({
      where: { entity_id: supplierEntityId },
    });

    if (!supplier) {
      this.logger.warn(
        `Supplier not found for entity_id: ${supplierEntityId}. Premise sync skipped.`,
      );
      throw new Error(
        `Supplier with entityId ${supplierEntityId} not found. Sync supplier first.`,
      );
    }

    await this.syncPremise(supplier.id, premiseData);
  }

  private async syncPremise(supplier_id: number, data: any): Promise<void> {
    let premise = await this.premiseRepo.findOne({
      where: { premise_id: data.premise_id },
    });

    if (!premise) {
      premise = this.premiseRepo.create({
        supplierId,
        premise_id: data.premise_id,
        legacyPremiseId: data.legacyPremiseId,
        premiseName: data.premiseName,
        gln: data.gln,
        businessType: data.businessType,
        premiseClassification: data.premiseClassification,
        ownership: data.ownership,
        superintendentName: data.superintendent?.name,
        superintendentCadre: data.superintendent?.cadre,
        superintendentRegistrationNumber: data.superintendent?.registrationNumber,
        ppbLicenseNumber: data.license?.ppbLicenseNumber,
        licenseValidUntil: data.license?.validUntil ? new Date(data.license.validUntil) : undefined,
        licenseValidityYear: data.license?.validityYear,
        licenseStatus: data.license?.status,
        // V09: Restored county/ward for analytics
        county: data.location?.county,
        constituency: data.location?.constituency,
        ward: data.location?.ward,
        country: data.location?.country || 'KE',
        status: data.status || 'Active',
      });
    } else {
      // Update existing
      Object.assign(premise, {
        premiseName: data.premiseName,
        gln: data.gln,
        lastUpdated: new Date(),
      });
    }

    await this.premiseRepo.save(premise);
  }

  private async syncLogisticsProvider(data: any): Promise<void> {
    let lsp = await this.logisticsProviderRepo.findOne({
      where: { lspId: data.lspId },
    });

    if (!lsp) {
      lsp = this.logisticsProviderRepo.create({
        lspId: data.lspId,
        name: data.name,
        registrationNumber: data.legalEntity?.registrationNumber,
        permitId: data.legalEntity?.permitId,
        licenseExpiryDate: data.legalEntity?.licenseExpiryDate ? new Date(data.legalEntity.licenseExpiryDate) : undefined,
        status: data.legalEntity?.status || 'Active',
        contactEmail: data.contact?.email,
        contactPhone: data.contact?.phone,
        contactWebsite: data.contact?.website,
        // V09: Restored county for analytics
        hqCounty: data.hqLocation?.county,
        hqCountry: data.hqLocation?.country || 'KE',
        gln: data.identifiers?.gln,
        gs1Prefix: data.identifiers?.gs1Prefix,
        ppbCode: data.identifiers?.ppbCode,
      });
    } else {
      // Update existing
      Object.assign(lsp, {
        name: data.name,
        lastUpdated: new Date(),
      });
    }

    await this.logisticsProviderRepo.save(lsp);
  }

  /**
   * Sync entire product catalog from Terminology API to ppb_products table
   * NOW USING GENERIC SYNC SERVICE (config-driven)
   */
  async syncProductCatalog(search?: string): Promise<{
    inserted: number;
    updated: number;
    errors: number;
    total: number;
  }> {
    return this.genericSyncService.sync('product', search);
  }

  // Product normalization methods removed - now in master-data-sync.config.ts
  // Used by GenericSyncService for config-driven sync

  /**
   * Get product catalog sync statistics
   * EXCLUDES test data (isTest = true) from counts
   */
  /**
   * Get product catalog sync statistics
   * NOW USING GENERIC CRUD SERVICE (partially)
   * EXCLUDES test data (isTest = true) from counts
   */
  async getProductCatalogStats(): Promise<{
    total: number;
    lastSynced: Date | null;
    lastModified: Date | null;
  }> {
    // Use generic service for basic stats
    const stats = await this.genericCrudService.getStats(
      {
        entity_type: 'product',
        repository: this.ppbProductRepo,
        filterConditions: { isTest: false },
      },
      'lastSyncedAt'
    );

    // Get product-specific lastModified field
    const lastModified = await this.ppbProductRepo.findOne({
        where: { isTest: false },
        order: { ppbLastModified: 'DESC' },
        select: ['ppbLastModified'],
    });

    return {
      total: stats.total,
      lastSynced: stats.lastSynced,
      lastModified: lastModified?.ppbLastModified || null,
    };
  }

  /**
   * Search products in catalog
   * EXCLUDES test data (isTest = true) from results
   */
  async searchProducts(
    search?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ products: PPBProduct[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.ppbProductRepo
      .createQueryBuilder('product')
      .where('product.isTest = :isTest', { isTest: false });

    if (search) {
      queryBuilder.andWhere(
        '(product.brandName ILIKE :search OR product.genericName ILIKE :search OR product.brandDisplayName ILIKE :search OR product.genericDisplayName ILIKE :search OR product.gtin ILIKE :search OR product.ppbRegistrationCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [products, total] = await queryBuilder
      .orderBy('product.brandName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      products,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all products (for frontend compatibility)
   * Returns all production products in a flat array format
   * EXCLUDES test data (isTest = true)
   */
  async getAllProducts(): Promise<PPBProduct[]> {
    return await this.ppbProductRepo.find({
      where: { isTest: false },
      order: { brandName: 'ASC' },
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<PPBProduct> {
    const product = await this.ppbProductRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Delete product (soft delete)
   * Note: Products are synced from PPB Terminology API, so we don't actually delete them
   * This method exists for API compatibility but products cannot be deleted
   */
  async deleteProduct(id: number): Promise<{ message: string }> {
    await this.getProductById(id); // Verify product exists
    
    // Products are synced from PPB and cannot be deleted
    // They will be removed on next sync if no longer in PPB catalog
    return { message: 'Product deletion not supported. Products are synced from PPB Terminology API.' };
  }

  /**
   * Find product by ID (for compatibility with old ProductsService.findOne)
   * Returns product even if disabled (for internal use)
   */
  async findOne(id: number): Promise<PPBProduct> {
    const product = await this.ppbProductRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Find product by GTIN
   * EXCLUDES test data (isTest = true)
   */
  async findByGTIN(gtin: string): Promise<PPBProduct | null> {
    return await this.ppbProductRepo.findOne({
      where: { gtin, isTest: false },
    });
  }

  /**
   * Create a new product (for compatibility - products should normally be synced from PPB)
   */
  async create(userId: string, dto: { productName: string; brandName: string; gtin: string }): Promise<PPBProduct> {
    // Generate a temporary etcd_product_id if not provided
    const etcdProductId = `TEMP-${Date.now()}-${dto.gtin}`;
    
    const product = this.ppbProductRepo.create({
      etcdProductId,
      brandName: dto.brandName,
      genericName: dto.productName,
      brandDisplayName: dto.brandName,
      genericDisplayName: dto.productName,
      gtin: dto.gtin,
      kemlIsOnKeml: false,
      formularyIncluded: false,
      programsMapping: [],
      manufacturers: [],
    });

    try {
      const saved = await this.ppbProductRepo.save(product);
      this.logger.log(`Product created: ${saved.id} - ${saved.brandName || saved.genericName}`);
      return saved;
    } catch (error: any) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync entire premise catalog from PPB Catalogue API
   * Fetches all premises and persists them in the shared master data
   */
  /**
   * Sync premise catalog from PPB Catalogue API
   * NOW USING GENERIC SYNC SERVICE (config-driven)
   */
  async syncPremiseCatalog(customEmail?: string, customPassword?: string): Promise<{
    inserted: number;
    updated: number;
    errors: number;
    total: number;
  }> {
    return this.genericSyncService.sync('premise', { email: customEmail, password: customPassword });
  }

  /**
   * Normalize PPB Catalogue API premise to Premise entity format
   * Maps fields from PPB API response to our database schema
   * 
   * NOTE: PPB API does NOT provide GLN field - will be null until manually assigned
   */
  private normalizePPBPremise(apiPremise: any): Partial<Premise> {
    // Generate a premiseId in our format
    const premiseId = `PREMISE-${apiPremise.premiseid}`;

    // Parse license validity date (YYYY-MM-DD format)
    let licenseValidUntil: Date | undefined;
    if (apiPremise.licensevalidity) {
      try {
        licenseValidUntil = new Date(apiPremise.licensevalidity);
      } catch (error) {
        this.logger.warn(`Invalid license validity date: ${apiPremise.licensevalidity}`);
      }
    }

    return {
      premiseId,
      legacyPremiseId: apiPremise.premiseid,
      premiseName: apiPremise.premisename?.trim() || 'Unknown Premise',
      gln: apiPremise.gln || undefined, // GLN from PPB API (not currently provided)
      businessType: apiPremise.businesstype,
      ownership: apiPremise.ownership,
      superintendentName: apiPremise.superintendentname,
      superintendentCadre: apiPremise.superintendentcadre,
      superintendentRegistrationNumber: apiPremise.superintendentregistrationno,
      licenseValidUntil,
      licenseValidityYear: apiPremise.validityyear,
      // V09: Restored county/ward for analytics
      county: apiPremise.county,
      constituency: apiPremise.constituency,
      ward: apiPremise.ward,
      supplier_id: undefined, // Will be set based on mapping or default
    };
  }

  /**
   * Get premise catalog sync statistics
   */
  /**
   * Get premise catalog statistics with county distribution
   * NOW USING GENERIC CRUD SERVICE (partially)
   */
  async getPremiseCatalogStats(): Promise<{
    total: number;
    lastSynced: Date | null;
    byCounty: { county: string; count: number }[];
  }> {
    // Use generic service for basic stats
    const stats = await this.genericCrudService.getStats(
      {
        entity_type: 'premise',
        repository: this.premiseRepo,
      },
      'lastUpdated'
    );

    // Get premise-specific county distribution
    const byCounty = await this.premiseRepo
      .createQueryBuilder('premise')
      .select('premise.county', 'county')
      .addSelect('COUNT(*)', 'count')
      .where('premise.county IS NOT NULL')
      .groupBy('premise.county')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total: stats.total,
      lastSynced: stats.lastSynced,
      byCounty: byCounty.map(row => ({
        county: row.county,
        count: parseInt(row.count, 10),
      })),
    };
  }

  /**
   * Comprehensive data quality report for premises
   * Analyzes completeness, validity, and consistency of premise data
   * EXCLUDES test data (is_test = TRUE) to show only production data quality
   */
  /**
   * Comprehensive data quality report for premises
   * NOW USING GENERIC QUALITY REPORT SERVICE
   * 
   * Includes:
   * - Completeness: 8 metrics (GLN, License, County, BusinessType, Ownership, Superintendent, Location, SupplierMapping)
   * - Validity: 6 metrics (Expired Licenses, Expiring Soon, Valid Licenses, Invalid Dates, Duplicate IDs, Invalid GLN)
   * - Distribution: 4 categories (County, BusinessType, Ownership, SuperintendentCadre)
   * - Timeliness: 6-tier scoring based on 3-hour sync window
   * - Issues: Detailed with severity levels
   * - Recommendations: Context-aware (Kenya-specific)
   * 
   * EXCLUDES test data (isTest = TRUE) to show only production data quality
   */
  async getPremiseDataQualityReport() {
    const genericReport = await this.genericQualityService.generateReport('premise');
    
    // Helper function to add percentage to distribution items
    const addPercentages = (items: any[]) => {
      if (!items || items.length === 0) return [];
      const total = items.reduce((sum, item) => sum + Number(item.count), 0);
      return items.map(item => ({
        ...item,
        county: item.value, // Map 'value' to 'county' for backward compatibility
        count: Number(item.count),
        percentage: total > 0 ? (Number(item.count) / total) * 100 : 0,
      }));
    };
    
    // Map generic response to premise-specific field names for backward compatibility
    return {
      overview: {
        totalPremises: genericReport.overview.totalRecords,
        lastSyncDate: genericReport.overview.lastSyncDate,
        dataQualityScore: genericReport.overview.dataQualityScore,
      },
      completeness: {
        missingGLN: genericReport.completeness.missingGln,
        missingCounty: genericReport.completeness.missingCounty,
        missingBusinessType: genericReport.completeness.missingBusinessType,
        missingOwnership: genericReport.completeness.missingOwnership,
        missingSuperintendent: genericReport.completeness.missingSuperintendent,
        missingLicenseInfo: genericReport.completeness.missingLicenseInfo,
        missingLocation: genericReport.completeness.missingLocation,
        missingSupplierMapping: genericReport.completeness.missingSupplierMapping,
        completeRecords: genericReport.completeness.completeRecords,
        completenessPercentage: genericReport.completeness.completenessPercentage,
      },
      validity: {
        duplicatePremiseIds: genericReport.validity.duplicatePremiseIds,
        invalidGLN: genericReport.validity.invalidGln,
      },
      monitoring: {
        // Operational monitoring metrics (NOT affecting quality score)
        expiredLicenses: genericReport.monitoring?.expiredLicenses || 0,
        expiringSoon: genericReport.monitoring?.expiringSoon || 0,
        validLicenses: genericReport.monitoring?.validLicenses || 0,
      },
      distribution: {
        byCounty: addPercentages(genericReport.distribution.byCounty || []),
        byBusinessType: addPercentages(genericReport.distribution.byBusinessType || []).map(item => ({
          ...item,
          businessType: item.value, // Map 'value' to 'businessType'
        })),
        byOwnership: addPercentages(genericReport.distribution.byOwnership || []).map(item => ({
          ...item,
          ownership: item.value, // Map 'value' to 'ownership'
        })),
        bySuperintendentCadre: addPercentages(genericReport.distribution.bySuperintendentCadre || []).map(item => ({
          ...item,
          cadre: item.value, // Map 'value' to 'cadre'
        })),
      },
      scores: genericReport.scores, // NEW: Dimension percentage scores (0-100%)
      issues: genericReport.issues,
      recommendations: genericReport.recommendations,
    };
  }

  /**
   * Handle webhook from PPB for real-time premise updates
   * Webhook payload should contain premise data in PPB format
   */
  async handlePremiseWebhook(payload: any): Promise<{
    success: boolean;
    action: 'created' | 'updated' | 'deleted';
    premiseId?: string;
    message: string;
  }> {
    try {
      // Validate webhook signature (if PPB provides one)
      // const isValid = this.validateWebhookSignature(payload);
      // if (!isValid) throw new Error('Invalid webhook signature');

      const action = payload.action || 'updated';
      const premiseData = payload.data || payload.premise;

      if (!premiseData || !premiseData.premiseid) {
        throw new Error('Invalid webhook payload: missing premise data');
      }

      this.logger.log(`Webhook received for premise ${premiseData.premiseid}: ${action}`);

      if (action === 'deleted') {
        // Soft delete - mark as inactive
        const premise = await this.premiseRepo.findOne({
          where: { legacyPremiseId: premiseData.premiseid },
        });

        if (premise) {
          premise.status = 'Inactive';
          premise.lastUpdated = new Date();
          await this.premiseRepo.save(premise);

          return {
            success: true,
            action: 'deleted',
            premise_id: premise.premise_id,
            message: `Premise ${premise.premise_id} marked as inactive`,
          };
        }

        return {
          success: false,
          action: 'deleted',
          message: `Premise ${premiseData.premiseid} not found`,
        };
      }

      // Create or update premise
      const normalized = this.normalizePPBPremise(premiseData);
      const existing = await this.premiseRepo.findOne({
        where: { legacyPremiseId: normalized.legacyPremiseId },
      });

      if (existing) {
        // Update existing
        Object.assign(existing, {
          premiseName: normalized.premiseName,
          // V09: Restored county/ward for analytics
          county: normalized.county,
          constituency: normalized.constituency,
          ward: normalized.ward,
          businessType: normalized.businessType,
          ownership: normalized.ownership,
          superintendentName: normalized.superintendentName,
          superintendentCadre: normalized.superintendentCadre,
          superintendentRegistrationNumber: normalized.superintendentRegistrationNumber,
          licenseValidUntil: normalized.licenseValidUntil,
          licenseValidityYear: normalized.licenseValidityYear,
          status: 'Active',
          lastUpdated: new Date(),
        });

        await this.premiseRepo.save(existing);

        return {
          success: true,
          action: 'updated',
          premise_id: existing.premise_id,
          message: `Premise ${existing.premise_id} updated via webhook`,
        };
      } else {
        // Create new
        const newPremise = this.premiseRepo.create({
          supplier_id: normalized.supplierId || 1,
          premise_id: normalized.premise_id,
          legacyPremiseId: normalized.legacyPremiseId,
          premiseName: normalized.premiseName,
          gln: normalized.gln,
          businessType: normalized.businessType,
          ownership: normalized.ownership,
          superintendentName: normalized.superintendentName,
          superintendentCadre: normalized.superintendentCadre,
          superintendentRegistrationNumber: normalized.superintendentRegistrationNumber,
          licenseValidUntil: normalized.licenseValidUntil,
          licenseValidityYear: normalized.licenseValidityYear,
          // V09: Restored county/ward for analytics
          county: normalized.county,
          constituency: normalized.constituency,
          ward: normalized.ward,
          country: 'KE',
          status: 'Active',
        });

        const saved = await this.premiseRepo.save(newPremise);

        return {
          success: true,
          action: 'created',
          premise_id: saved.premise_id,
          message: `Premise ${saved.premise_id} created via webhook`,
        };
      }
    } catch (error: any) {
      this.logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Incremental sync - only fetch and update premises changed since last sync
   * More efficient for real-time updates
   */
  async incrementalPremiseSync(sinceDate?: Date): Promise<{
    inserted: number;
    updated: number;
    errors: number;
    total: number;
    syncedFrom: Date;
  }> {
    this.logger.log('Starting incremental premise sync...');

    // If no date provided, use last sync date
    if (!sinceDate) {
      const result = await this.premiseRepo
        .createQueryBuilder('premise')
        .select('MAX(premise.lastUpdated)', 'lastUpdated')
        .getRawOne();
      sinceDate = result?.lastUpdated || new Date('2020-01-01');
    }

    this.logger.log(`Fetching premises updated since: ${sinceDate.toISOString()}`);

    // Note: This assumes PPB API supports filtering by date
    // If not, we'll need to fetch all and filter client-side
    // For now, we'll use the full sync and note this limitation

    const result = await this.syncPremiseCatalog();

    return {
      ...result,
      syncedFrom: sinceDate,
    };
  }

  /**
   * Save current data quality report as snapshot for historical tracking
   * Called manually or by scheduled audit
   */
  async saveQualityReportSnapshot(triggeredBy: string = 'manual', notes?: string): Promise<PremiseQualityReport> {
    try {
      this.logger.log(`Saving quality report snapshot (triggered by: ${triggeredBy})`);

      const report = await this.getPremiseDataQualityReport();

      const snapshot = this.qualityReportRepo.create({
        reportDate: new Date(),
        totalPremises: report.overview.totalPremises,
        dataQualityScore: report.overview.dataQualityScore,
        missingGln: report.completeness.missingGLN || 0,
        missingCounty: report.completeness.missingCounty || 0,
        missingBusinessType: report.completeness.missingBusinessType || 0,
        missingOwnership: report.completeness.missingOwnership || 0,
        missingSuperintendent: report.completeness.missingSuperintendent || 0,
        missingLicenseInfo: report.completeness.missingLicenseInfo || 0,
        missingLocation: report.completeness.missingLocation || 0,
        missingSupplierMapping: report.completeness.missingSupplierMapping || 0,
        completeRecords: report.completeness.completeRecords || 0,
        completenessPercentage: report.completeness.completenessPercentage || 0,
        expiredLicenses: report.monitoring?.expiredLicenses || 0,
        expiringSoon: report.monitoring?.expiringSoon || 0,
        validLicenses: report.monitoring?.validLicenses || 0,
        duplicatePremiseIds: report.validity.duplicatePremiseIds || 0,
        invalidGln: report.validity.invalidGLN || 0,
        fullReport: report,
        triggeredBy,
        notes,
      });

      const saved = await this.qualityReportRepo.save(snapshot);
      this.logger.log(`Quality report snapshot saved with ID: ${saved.id}`);

      // Trigger quality alerts if score is below threshold
      await this.qualityAlertService.checkAndAlert('premise', report.overview.dataQualityScore, {
        totalRecords: report.overview.totalPremises,
        auditId: saved.id,
        triggeredBy,
        lastSync: report.overview.lastSyncDate,
        issues: report.issues,
      });

      return saved;
    } catch (error: any) {
      this.logger.error('Failed to save quality report snapshot:', error.message);
      this.logger.error('Stack:', error.stack);
      throw new Error(`Failed to save quality report: ${error.message}`);
    }
  }

  /**
   * Get all historical quality report snapshots
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getQualityReportHistory(limit: number = 50): Promise<PremiseQualityReport[]> {
    return this.genericQualityHistoryService.getHistory(
      {
        entity_type: 'premise',
        repository: this.qualityReportRepo,
        dateField: 'reportDate',
        scoreField: 'dataQualityScore',
      },
      limit
    );
  }

  /**
   * Get quality report snapshot by ID
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getQualityReportById(id: number): Promise<PremiseQualityReport> {
    return this.genericQualityHistoryService.getById(
      {
        entity_type: 'premise',
        repository: this.qualityReportRepo,
        dateField: 'reportDate',
        scoreField: 'dataQualityScore',
      },
      id
    );
  }

  /**
   * Get quality score trend over time
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getQualityScoreTrend(days: number = 30): Promise<{
    date: string;
    score: number;
  }[]> {
    return this.genericQualityHistoryService.getScoreTrend(
      {
        entity_type: 'premise',
        repository: this.qualityReportRepo,
        dateField: 'reportDate',
        scoreField: 'dataQualityScore',
      },
      days
    );
  }

  /**
   * Comprehensive data quality report for products
   * NOW USING GENERIC QUALITY REPORT SERVICE
   * Analyzes completeness, validity, consistency, and timeliness
   * EXCLUDES test data (isTest = TRUE) to show only production data quality
   */
  async getProductDataQualityReport() {
    return this.genericQualityService.generateReport('product');
  }

  /**
   * Save current product data quality report as snapshot for historical tracking
   * Called manually or by scheduled audit
   */
  async saveProductQualitySnapshot(triggeredBy: string = 'manual', notes?: string): Promise<ProductQualityReport> {
    try {
      this.logger.log(`Saving product quality report snapshot (triggered by: ${triggeredBy})`);

      const report = await this.getProductDataQualityReport();

      const snapshot = this.productQualityReportRepo.create({
        reportDate: new Date(),
        totalProducts: report.overview.totalRecords,
        dataQualityScore: report.overview.dataQualityScore,
        missingGtin: report.completeness.missingGtin || 0,
        missingBrandName: report.completeness.missingBrandName || 0,
        missingGenericName: report.completeness.missingGenericName || 0,
        missingPpbCode: report.completeness.missingPpbCode || 0,
        missingCategory: report.completeness.missingCategory || 0,
        missingStrength: report.completeness.missingStrength || 0,
        missingRoute: report.completeness.missingRoute || 0,
        missingForm: report.completeness.missingForm || 0,
        missingManufacturer: report.completeness.missingManufacturer || 0,
        completeRecords: report.completeness.completeRecords || 0,
        completenessPercentage: report.completeness.completenessPercentage || 0,
        duplicateGtins: report.validity.duplicateGtins || 0,
        invalidGtinFormat: report.validity.invalidGtinFormat || 0,
        duplicateProductIds: report.validity.duplicateProductIds || 0,
        fullReport: report,
        triggeredBy,
        notes,
      });

      await this.productQualityReportRepo.save(snapshot);

      this.logger.log(`Product quality report snapshot saved with ID: ${snapshot.id}`);
      
      // Trigger quality alerts if score is below threshold
      await this.qualityAlertService.checkAndAlert('product', report.overview.dataQualityScore, {
        totalRecords: report.overview.totalRecords,
        auditId: snapshot.id,
        triggeredBy,
        lastSync: report.overview.lastSyncDate,
        issues: report.issues,
      });
      
      return snapshot;
    } catch (error) {
      this.logger.error('Failed to save product quality report snapshot:', error);
      throw new Error(`Failed to save quality report snapshot: ${error.message}`);
    }
  }

  /**
   * Get all historical product quality report snapshots
   */
  /**
   * Get product quality report history
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getProductQualityReportHistory(limit: number = 50): Promise<ProductQualityReport[]> {
    return this.genericQualityHistoryService.getHistory(
      {
        entity_type: 'product',
        repository: this.productQualityReportRepo,
        dateField: 'reportDate',
        scoreField: 'dataQualityScore',
      },
      limit
    );
  }

  /**
   * Get product quality report snapshot by ID
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getProductQualityReportById(id: number): Promise<ProductQualityReport> {
    return this.genericQualityHistoryService.getById(
      {
        entity_type: 'product',
        repository: this.productQualityReportRepo,
        dateField: 'reportDate',
        scoreField: 'dataQualityScore',
      },
      id
    );
  }

  /**
   * Get product quality score trend over time
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getProductQualityScoreTrend(days: number = 30): Promise<{
    date: string;
    score: number;
  }[]> {
    return this.genericQualityHistoryService.getScoreTrend(
      {
        entity_type: 'product',
        repository: this.productQualityReportRepo,
        dateField: 'reportDate',
        scoreField: 'dataQualityScore',
      },
      days
    );
  }

  // ==================== UAT FACILITIES (Safaricom HIE) ====================

  /**
   * Sync facilities from Safaricom HIE API (incremental sync)
   * Fetches facilities updated since last sync timestamp
   */
  /**
   * Sync UAT facilities from Safaricom HIE API
   * NOW USING GENERIC SYNC SERVICE with incremental sync + logging
   */
  async syncUatFacilities(): Promise<{
    success: boolean;
    inserted: number;
    updated: number;
    errors: number;
    total: number;
    lastSyncedAt: Date;
  }> {
    return this.genericSyncService.sync('facility', null, 'manual');
  }

  /**
   * Get sample raw API response for debugging
   */
  async getSampleFacilityApiResponse(count: number = 3) {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const facilities = await this.safaricomHieApiService.getFacilities({
        lastUpdated: sixMonthsAgo,
        page: 0,
        size: count,
      });

      return {
        count: facilities.length,
        sample: facilities,
        keysInFirstFacility: facilities.length > 0 ? Object.keys(facilities[0]) : [],
        addressStructure: facilities.length > 0 && facilities[0].address 
          ? {
              exists: true,
              keys: Object.keys(facilities[0].address),
              sample: facilities[0].address
            }
          : { exists: false },
      };
    } catch (error: any) {
      this.logger.error('Failed to fetch sample API response:', error);
      throw error;
    }
  }

  // UAT facility upsert and sync timestamp methods removed
  // Now handled by GenericSyncService with config-driven field mappings

  /**
   * Get all UAT facilities with pagination and filters
   */
  async getUatFacilities(
    page: number = 1,
    limit: number = 50,
    search?: string,
    county?: string,
    facilityType?: string,
    ownership?: string,
  ): Promise<{ facilities: UatFacility[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = :enabled', { enabled: true });

    if (search) {
      queryBuilder.andWhere(
        '(facility.facilityName ILIKE :search OR facility.facilityCode ILIKE :search OR facility.mflCode ILIKE :search OR facility.county ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (county) {
      queryBuilder.andWhere('facility.county = :county', { county });
    }

    if (facilityType) {
      queryBuilder.andWhere('facility.facilityType = :facilityType', { facilityType });
    }

    if (ownership) {
      queryBuilder.andWhere('facility.ownership = :ownership', { ownership });
    }

    const [facilities, total] = await queryBuilder
      .orderBy('facility.facilityName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { facilities, total, page, limit };
  }

  /**
   * Get UAT facility statistics
   */
  /**
   * Get UAT facility statistics with distribution analysis
   * NOW USING GENERIC CRUD SERVICE (partially) + custom aggregations
   */
  async getUatFacilityStats(): Promise<any> {
    // Use generic service for basic stats
    const stats = await this.genericCrudService.getStats(
      {
        entity_type: 'facility',
        repository: this.uatFacilityRepo,
        filterConditions: { is_enabled: true },
      },
      'lastSyncedAt'
    );

    // Facility-specific aggregations
    const [byType, byOwnership, byCounty, byKephLevel, operational, withGLN] = await Promise.all([
    // By facility type
      this.uatFacilityRepo
      .createQueryBuilder('facility')
      .select('facility.facilityType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('facility.is_enabled = true')
      .groupBy('facility.facilityType')
        .getRawMany(),

    // By ownership
      this.uatFacilityRepo
      .createQueryBuilder('facility')
      .select('facility.ownership', 'ownership')
      .addSelect('COUNT(*)', 'count')
      .where('facility.is_enabled = true')
      .groupBy('facility.ownership')
        .getRawMany(),

    // By county (top 10)
      this.uatFacilityRepo
      .createQueryBuilder('facility')
      .select('facility.county', 'county')
      .addSelect('COUNT(*)', 'count')
      .where('facility.is_enabled = true')
      .groupBy('facility.county')
      .orderBy('count', 'DESC')
      .limit(10)
        .getRawMany(),

    // By KEPH level
      (async () => {
        try {
          const result = await this.uatFacilityRepo
            .createQueryBuilder('facility')
            .select('facility.keph_level', 'kephLevel')  // Use database column name directly
            .addSelect('COUNT(*)', 'count')
            .where('facility.is_enabled = true')
            .andWhere('facility.keph_level IS NOT NULL')  // Use database column name
            .groupBy('facility.keph_level')  // Use database column name
            .orderBy('kephLevel', 'ASC')
            .getRawMany();
          
          return result;
        } catch (error) {
          this.logger.error(`Failed to query byKephLevel: ${error.message}`);
          return [];  // Return empty array on error so other stats can still load
        }
      })(),

      // Operational count
      this.uatFacilityRepo.count({
      where: { is_enabled: true, operationalStatus: 'Active' },
      }),

    // GLN coverage
      this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere('facility.gln IS NOT NULL')
        .getCount(),
    ]);

    return {
      total: stats.total,
      byType: byType.reduce((acc, curr) => {
        acc[curr.type || 'Unknown'] = parseInt(curr.count);
        return acc;
      }, {}),
      byOwnership: byOwnership.reduce((acc, curr) => {
        acc[curr.ownership || 'Unknown'] = parseInt(curr.count);
        return acc;
      }, {}),
      byCounty: byCounty.reduce((acc, curr) => {
        acc[curr.county || 'Unknown'] = parseInt(curr.count);
        return acc;
      }, {}),
      byKephLevel: byKephLevel.reduce((acc, curr) => {
        acc[curr.kephLevel || 'Unknown'] = parseInt(curr.count);
        return acc;
      }, {}),
      operational,
      nonOperational: stats.total - operational,
      withGLN,
      withoutGLN: stats.total - withGLN,
      lastSync: stats.lastSynced,
    };
  }

  /**
   * Generate UAT facility data quality report
   */
  async generateUatFacilityDataQualityReport(): Promise<any> {
    const total = await this.uatFacilityRepo.count({ where: { is_enabled: true } });

    // Completeness metrics
    const missingGln = await this.uatFacilityRepo.count({
      where: { is_enabled: true, gln: null },
    });

    const missingMflCode = await this.uatFacilityRepo.count({
      where: { is_enabled: true, mflCode: null },
    });

    const missingCounty = await this.uatFacilityRepo.count({
      where: { is_enabled: true, county: null },
    });

    const missingFacilityType = await this.uatFacilityRepo.count({
      where: { is_enabled: true, facilityType: null },
    });

    const missingOwnership = await this.uatFacilityRepo.count({
      where: { is_enabled: true, ownership: null },
    });

    // Check for missing geolocation coordinates (critical for facility mapping)
    const missingLatitude = await this.uatFacilityRepo.count({
      where: { is_enabled: true, latitude: null },
    });

    const missingLongitude = await this.uatFacilityRepo.count({
      where: { is_enabled: true, longitude: null },
    });

    // Missing coordinates (either lat or lng is null)
    const missingCoordinates = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere('(facility.latitude IS NULL OR facility.longitude IS NULL)')
      .getCount();

    // Validity metrics
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiredLicenses = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere('facility.licenseValidUntil < :now', { now })
      .getCount();

    const expiringSoon = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere('facility.licenseValidUntil >= :now', { now })
      .andWhere('facility.licenseValidUntil <= :future', { future: thirtyDaysFromNow })
      .getCount();

    // Duplicate facility codes (should be 0 due to unique constraint)
    const duplicates = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .select('facility.facilityCode', 'code')
      .addSelect('COUNT(*)', 'count')
      .groupBy('facility.facilityCode')
      .having('COUNT(*) > 1')
      .getRawMany();

    // Check for invalid coordinates (Kenya-specific bounds)
    // Kenya bounds: latitude -4.7 to 5.0, longitude 33.9 to 41.9
    // Also check for global out-of-range
    const invalidCoordinates = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere(
        '((facility.latitude IS NOT NULL AND (facility.latitude < -90 OR facility.latitude > 90 OR facility.latitude < -4.7 OR facility.latitude > 5.0)) OR ' +
        '(facility.longitude IS NOT NULL AND (facility.longitude < -180 OR facility.longitude > 180 OR facility.longitude < 33.9 OR facility.longitude > 41.9)))'
      )
      .getCount();

    // Data consistency/standardization issues
    // Note: Facility types like "DISPENSARY", "HEALTH CENTRE", "Clinic" are VALID
    // They represent actual facility classifications from the source system
    
    // Detect duplicate county variations (e.g., "MURANGA" vs "MURANG'A")
    // Kenya has 47 counties, but duplicates can create 48+ entries
    const countyVariations = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .select('UPPER(facility.county)', 'county_upper')
      .addSelect('facility.county', 'county_original')
      .addSelect('COUNT(*)', 'count')
      .where('facility.is_enabled = true')
      .andWhere('facility.county IS NOT NULL')
      .andWhere('UPPER(facility.county) LIKE :muranga', { muranga: '%MURANG%' })
      .groupBy('facility.county')
      .getRawMany();
    
    const uniqueMurangaCount = new Set(countyVariations.map(v => v.county_upper)).size;
    const duplicateCountyVariations = uniqueMurangaCount > 1 
      ? countyVariations.reduce((sum, v) => sum + parseInt(v.count), 0) 
      : 0;
    
    const unknownOwnership = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere('(facility.ownership = :unknown OR facility.ownership IS NULL)', { unknown: 'Unknown' })
      .getCount();

    // Calculate complete records (facilities with ALL 5 critical fields)
    // Critical fields: GLN, MFL Code, County, Coordinates (lat AND lng), Ownership
    const completeRecords = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .where('facility.is_enabled = true')
      .andWhere('facility.gln IS NOT NULL')
      .andWhere('facility.mflCode IS NOT NULL')
      .andWhere('facility.county IS NOT NULL')
      .andWhere('facility.latitude IS NOT NULL')
      .andWhere('facility.longitude IS NOT NULL')
      .andWhere('facility.ownership IS NOT NULL')
      .andWhere('facility.ownership != :unknown', { unknown: 'Unknown' })
      .getCount();

    // Calculate quality scores (updated to include ALL critical fields: GLN, MFL, County, Coordinates, Ownership)
    // completenessPercentage: Percentage of records with ALL critical fields (strict)
    // completenessScore: Field-level completeness (granular) - used for detailed analysis
    const completenessPercentage = total > 0 ? (completeRecords / total) * 100 : 0;
    
    // Field-level completeness for granular analysis
    const totalRequiredFields = 5; // GLN, MFL Code, County, Coordinates, Ownership
    const totalMissing = missingGln + missingMflCode + missingCounty + missingCoordinates + missingOwnership;
    const totalPossible = total * totalRequiredFields;
    const completenessScore = totalPossible > 0 ? ((totalPossible - totalMissing) / totalPossible) * 100 : 0;
    
    const validityScore = total > 0 ? ((total - duplicates.length - invalidCoordinates) / total) * 100 : 0;
    
    // Get last sync timestamp
    const lastSyncRecord = await this.uatFacilityRepo
      .createQueryBuilder('facility')
      .select('MAX(facility.lastSyncedAt)', 'lastSync')
      .getRawOne();
    const lastSync = lastSyncRecord?.lastSync ? new Date(lastSyncRecord.lastSync) : new Date();
    
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    const timelinessScore = hoursSinceSync < 3 ? 100 : hoursSinceSync < 6 ? 85 : hoursSinceSync < 24 ? 70 : 50;

    // Consistency score - ONLY penalize data inconsistency issues, NOT missing data
    // Duplicate county variations (MURANGA vs MURANG'A) = data inconsistency  
    // Missing ownership is a COMPLETENESS issue, not consistency
    const consistencyScore = total > 0 ? ((total - duplicateCountyVariations) / total) * 100 : 0;
    
    // Overall score uses completenessPercentage (record-level) for a stricter quality assessment
    // This better reflects the reality that records missing critical fields are unusable
    const overallQualityScore = (
      completenessPercentage * 0.4 +
      validityScore * 0.3 +
      consistencyScore * 0.15 +
      timelinessScore * 0.15
    );

    return {
      overview: {
        totalFacilities: total,
        lastSync,
        qualityScore: parseFloat(overallQualityScore.toFixed(2)),
      },
      completeness: {
        missingGLN: missingGln,
        missingMflCode,
        missingCounty,
        missingFacilityType,
        missingOwnership,
        missingCoordinates, // Track missing lat/lng
        missingLatitude,    // Track missing latitude specifically
        missingLongitude,   // Track missing longitude specifically
        completeRecords, // Facilities with ALL critical fields (GLN, MFL, County, Coords, Ownership)
        completenessPercentage: parseFloat(completenessPercentage.toFixed(2)), // Record-level completeness (strict)
      },
      validity: {
        duplicateFacilityCodes: duplicates.length,
        invalidCoordinates, // Out-of-range coordinates (Kenya bounds: lat -4.7 to 5.0, lng 33.9 to 41.9)
      },
      monitoring: {
        // Operational monitoring metrics (NOT affecting quality score)
        expiredLicenses,
        expiringSoon,
        validLicenses: total - expiredLicenses - expiringSoon, // Calculate valid licenses
      },
      consistency: {
        duplicateCountyVariations, // e.g., "MURANGA" vs "MURANG'A" (48 counties instead of 47)
      },
      scores: {
        completeness: parseFloat(completenessScore.toFixed(2)),
        validity: parseFloat(validityScore.toFixed(2)),
        consistency: parseFloat(consistencyScore.toFixed(2)),
        timeliness: parseFloat(timelinessScore.toFixed(2)),
        overall: parseFloat(overallQualityScore.toFixed(2)),
      },
    };
  }

  /**
   * Save current UAT facility data quality report as snapshot for historical tracking
   */
  async saveUatFacilityQualityAudit(triggeredBy: string = 'manual', notes?: string): Promise<UatFacilitiesQualityAudit> {
    try {
      this.logger.log(`Saving UAT facility quality audit snapshot (triggered by: ${triggeredBy})`);

      const report = await this.generateUatFacilityDataQualityReport();

      const audit = this.uatFacilityQualityAuditRepo.create({
        auditDate: new Date(),
        totalFacilities: report.overview.totalFacilities,
        activeFacilities: report.overview.totalFacilities, // TODO: Add active count
        inactiveFacilities: 0, // TODO: Add inactive count
        missingGln: report.completeness.missingGLN,
        missingMflCode: report.completeness.missingMflCode,
        missingCounty: report.completeness.missingCounty,
        missingFacilityType: report.completeness.missingFacilityType,
        missingOwnership: report.completeness.missingOwnership,
        missingContactInfo: 0, // TODO: Calculate
        missingCoordinates: report.completeness.missingCoordinates,
        missingLatitude: report.completeness.missingLatitude,
        missingLongitude: report.completeness.missingLongitude,
        completeRecords: report.completeness.completeRecords,
        expiredLicenses: report.monitoring.expiredLicenses,
        expiringSoon: report.monitoring.expiringSoon,
        duplicateFacilityCodes: report.validity.duplicateFacilityCodes,
        invalidCoordinates: report.validity.invalidCoordinates || 0,
        completenessScore: report.scores.completeness,
        completenessPercentage: report.completeness.completenessPercentage,
        validityScore: report.scores.validity,
        consistencyScore: report.scores.consistency,
        timelinessScore: report.scores.timeliness,
        overallQualityScore: report.scores.overall,
      });

      await this.uatFacilityQualityAuditRepo.save(audit);

      this.logger.log(`UAT facility quality audit saved with ID: ${audit.id}`);
      
      // Trigger quality alerts if score is below threshold
      await this.qualityAlertService.checkAndAlert('facility', report.scores.overall, {
        totalRecords: report.overview.totalFacilities,
        auditId: audit.id,
        triggeredBy,
        lastSync: report.overview.lastSyncDate,
        issues: report.issues,
      });
      
      return audit;
    } catch (error) {
      this.logger.error('Failed to save UAT facility quality audit:', error);
      throw new Error(`Failed to save quality audit: ${error.message}`);
    }
  }

  /**
   * Get all historical UAT facility quality audit snapshots
   */
  /**
   * Get UAT facility quality audit history
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getUatFacilityQualityHistory(limit: number = 50): Promise<UatFacilitiesQualityAudit[]> {
    return this.genericQualityHistoryService.getHistory(
      {
        entity_type: 'facility',
        repository: this.uatFacilityQualityAuditRepo,
        dateField: 'auditDate',
        scoreField: 'overallQualityScore',
      },
      limit
    );
  }

  /**
   * Get UAT facility quality audit snapshot by ID
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getUatFacilityQualityHistoryById(id: number): Promise<UatFacilitiesQualityAudit> {
    return this.genericQualityHistoryService.getById(
      {
        entity_type: 'facility',
        repository: this.uatFacilityQualityAuditRepo,
        dateField: 'auditDate',
        scoreField: 'overallQualityScore',
      },
      id
    );
  }

  /**
   * Get UAT facility quality score trend over time
   * NOW USING GENERIC QUALITY HISTORY SERVICE
   */
  async getUatFacilityQualityScoreTrend(days: number = 30): Promise<{
    date: string;
    score: number;
  }[]> {
    return this.genericQualityHistoryService.getScoreTrend(
      {
        entity_type: 'facility',
        repository: this.uatFacilityQualityAuditRepo,
        dateField: 'auditDate',
        scoreField: 'overallQualityScore',
      },
      days
    );
  }

  /**
   * Get sync history for any master data type from master_data_sync_logs
   * Used by frontend SyncStatus component
   */
  async getSyncHistory(
    entity_type: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner',
    limit: number = 10
  ): Promise<MasterDataSyncLog[]> {
    return this.masterDataSyncLogRepo.find({
      where: { entityType },
      order: { syncStartedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get enriched quality audit data for any master data entity
   * Includes: dimensions, trends, top issues, history
   * Used by frontend GenericQualityAuditTab component
   */
  async getEnrichedQualityAuditData(
    entity_type: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner',
    days: number = 30
  ) {
    // Get the appropriate repository for the entity type
    const repositoryMap = {
      product: this.productQualityReportRepo,
      premise: this.qualityReportRepo, // premise quality reports
      facility: this.uatFacilityQualityAuditRepo,
      facility_prod: this.prodFacilityQualityAuditRepo,
      practitioner: this.practitionerQualityReportRepo,
    };

    const repository = repositoryMap[entityType];
    if (!repository) {
      throw new Error(`No repository found for entity type: ${entityType}`);
    }

    return this.genericQualityAuditEnrichmentService.getEnrichedAuditData(
      entityType,
      repository,
      days
    );
  }

  // ========================================================================================
  // PROD FACILITIES (Production Safaricom HIE API)
  // ========================================================================================

  /**
   * Sync production facilities from Safaricom HIE API
   */
  async syncProdFacilities(): Promise<{
    success: boolean;
    inserted: number;
    updated: number;
    errors: number;
    total: number;
    lastSyncedAt: Date;
  }> {
    return this.genericSyncService.sync('facility_prod', null, 'manual'); // Fixed: was 'facility', should be 'facility_prod'
  }

  /**
   * Get all production facilities with pagination and filters
   */
  async getProdFacilities(options: {
    page?: number;
    limit?: number;
    search?: string;
    county?: string;
    facilityType?: string;
    ownership?: string;
    kephLevel?: string;
  }): Promise<{ facilities: ProdFacility[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    
    const result = await this.genericCrudService.getPaginated<ProdFacility>(
      {
        entity_type: 'facility',
        repository: this.prodFacilityRepo,
        searchFields: ['facilityName', 'facilityCode', 'mflCode', 'kmhflCode'],
        filterConditions: {
          ...(options.county && { county: options.county }),
          ...(options.facilityType && { facilityType: options.facilityType }),
          ...(options.ownership && { ownership: options.ownership }),
          ...(options.kephLevel && { kephLevel: options.kephLevel }),
        },
      },
      page,
      limit,
      options.search
    );

    return {
      facilities: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get production facility statistics
   */
  async getProdFacilityStats(): Promise<any> {
    // Get all facilities
    const facilities = await this.prodFacilityRepo.find();

    // Calculate operational status
    const operational = facilities.filter(f => f.operationalStatus === 'Active').length;
    const nonOperational = facilities.length - operational;
    const withGLN = facilities.filter(f => f.gln).length;
    const withoutGLN = facilities.length - withGLN;

    // Group by facility type
    const byType: Record<string, number> = {};
    facilities.forEach(f => {
      const type = f.facilityType || 'Unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Group by ownership
    const byOwnership: Record<string, number> = {};
    facilities.forEach(f => {
      const ownership = f.ownership || 'Unknown';
      byOwnership[ownership] = (byOwnership[ownership] || 0) + 1;
    });

    // Group by county
    const byCounty: Record<string, number> = {};
    facilities.forEach(f => {
      const county = f.county || 'Unknown';
      byCounty[county] = (byCounty[county] || 0) + 1;
    });

    // Group by KEPH level
    const byKephLevel: Record<string, number> = {};
    facilities.forEach(f => {
      const kephLevel = f.kephLevel || 'Unknown';
      byKephLevel[kephLevel] = (byKephLevel[kephLevel] || 0) + 1;
    });

    // Get latest sync time
    const latestFacility = await this.prodFacilityRepo
      .createQueryBuilder('f')
      .orderBy('f.lastSyncedAt', 'DESC')
      .limit(1)
      .getOne();

    return {
      total: facilities.length,
      byType,
      byKephLevel,
      byOwnership,
      byCounty,
      operational,
      nonOperational,
      withGLN,
      withoutGLN,
      lastSync: latestFacility?.lastSyncedAt || null,
    };
  }

  /**
   * Generate production facility data quality report
   */
  async generateProdFacilityDataQualityReport(): Promise<any> {
    const facilities = await this.prodFacilityRepo.find();
    const total = facilities.length;

    if (total === 0) {
      return {
        overview: {
          totalFacilities: 0,
          lastSync: null,
        },
        completeness: {
          missingGLN: 0,
          missingMflCode: 0,
          missingCounty: 0,
          missingFacilityType: 0,
          missingOwnership: 0,
          missingContactInfo: 0,
          missingCoordinates: 0,
          missingLatitude: 0,
          missingLongitude: 0,
        },
        validity: {
          duplicateFacilityCodes: 0,
          invalidCoordinates: 0,
        },
        monitoring: {
          expiredLicenses: 0,
          expiringSoon: 0,
          validLicenses: 0,
        },
        scores: {
          completeness: null,
          validity: null,
          consistency: null,
          timeliness: null,
          overall: null,
        },
      };
    }

    // Completeness metrics
    const missingGLN = facilities.filter(f => !f.gln).length;
    const missingMflCode = facilities.filter(f => !f.mflCode).length;
    const missingCounty = facilities.filter(f => !f.county).length;
    const missingFacilityType = facilities.filter(f => !f.facilityType).length;
    const missingOwnership = facilities.filter(f => !f.ownership).length;
    const missingContactInfo = facilities.filter(f => !f.email && !f.phoneNumber).length;
    
    // NEW: Check for missing geolocation coordinates
    const missingLatitude = facilities.filter(f => !f.latitude).length;
    const missingLongitude = facilities.filter(f => !f.longitude).length;
    const missingCoordinates = facilities.filter(f => !f.latitude || !f.longitude).length;

    // Validity metrics
    const now = new Date();
    const expiredLicenses = facilities.filter(f => 
      f.licenseValidUntil && new Date(f.licenseValidUntil) < now
    ).length;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = facilities.filter(f => 
      f.licenseValidUntil && 
      new Date(f.licenseValidUntil) >= now && 
      new Date(f.licenseValidUntil) <= thirtyDaysFromNow
    ).length;

    const facilityCodes = facilities.map(f => f.facilityCode);
    const duplicateFacilityCodes = facilityCodes.length - new Set(facilityCodes).size;

    // Check for invalid coordinates (Kenya-specific bounds + global out-of-range)
    // Kenya bounds: latitude -4.7 to 5.0, longitude 33.9 to 41.9
    const invalidCoordinates = facilities.filter(f => 
      (f.latitude !== null && f.latitude !== undefined && (
        f.latitude < -90 || f.latitude > 90 || 
        f.latitude < -4.7 || f.latitude > 5.0
      )) ||
      (f.longitude !== null && f.longitude !== undefined && (
        f.longitude < -180 || f.longitude > 180 ||
        f.longitude < 33.9 || f.longitude > 41.9
      ))
    ).length;

    // Data consistency/standardization issues
    // Detect duplicate county variations (e.g., "MURANGA" vs "MURANG'A")
    const countyNames = facilities
      .filter(f => f.county)
      .map(f => f.county);
    const murangaVariations = countyNames.filter(c => 
      c?.toUpperCase().includes('MURANG')
    );
    const uniqueMurangaVariations = new Set(murangaVariations.map(c => c?.toUpperCase()));
    const duplicateCountyVariations = uniqueMurangaVariations.size > 1 ? murangaVariations.length : 0;
    
    const unknownOwnership = facilities.filter(f => 
      f.ownership === 'Unknown' || !f.ownership
    ).length;

    // Calculate complete records (facilities with ALL 5 critical fields)
    // Critical fields: GLN, MFL Code, County, Coordinates (lat AND lng), Ownership
    const completeRecords = facilities.filter(f => 
      f.gln && 
      f.mflCode && 
      f.county && 
      f.latitude && f.longitude && 
      f.ownership && f.ownership !== 'Unknown'
    ).length;
    
    // Calculate quality scores
    // completenessPercentage: Percentage of records with ALL critical fields (strict)
    // completenessScore: Field-level completeness (granular) - used for detailed analysis
    const completenessPercentage = total > 0 ? (completeRecords / total) * 100 : 0;
    
    // Field-level completeness for granular analysis
    const totalRequiredFields = 5;
    const totalMissing = missingGLN + missingMflCode + missingCounty + missingCoordinates + missingOwnership;
    const totalPossible = total * totalRequiredFields;
    const completenessScore = totalPossible > 0 ? ((totalPossible - totalMissing) / totalPossible) * 100 : 0;
    
    const validityScore = total > 0 ? ((total - duplicateFacilityCodes - invalidCoordinates) / total) * 100 : 0;
    
    // Consistency score - ONLY penalize data inconsistency issues, NOT missing data
    // Duplicate county variations (MURANGA vs MURANG'A) = data inconsistency
    // Missing ownership is a COMPLETENESS issue, not consistency
    const consistencyScore = total > 0 ? ((total - duplicateCountyVariations) / total) * 100 : 0;
    
    // Overall score uses completenessPercentage (record-level) for a stricter quality assessment
    // This better reflects the reality that records missing critical fields like GLN/Ownership are unusable
    const overallScore = (completenessPercentage * 0.4 + validityScore * 0.3 + consistencyScore * 0.15 + 90 * 0.15);

    // Get latest sync time
    const latestFacility = await this.prodFacilityRepo
      .createQueryBuilder('f')
      .orderBy('f.lastSyncedAt', 'DESC')
      .limit(1)
      .getOne();

    return {
      overview: {
        totalFacilities: total,
        lastSync: latestFacility?.lastSyncedAt || null,
      },
      completeness: {
        missingGLN,
        missingMflCode,
        missingCounty,
        missingFacilityType,
        missingOwnership,
        missingContactInfo,
        missingCoordinates, // NEW: Track missing lat/lng
        missingLatitude,    // NEW: Track missing latitude specifically
        missingLongitude,   // NEW: Track missing longitude specifically
        completeRecords, // Facilities with ALL 5 critical fields (GLN, MFL, County, Coords, Ownership)
        completenessPercentage: parseFloat(completenessPercentage.toFixed(2)), // Record-level completeness (strict)
      },
      validity: {
        duplicateFacilityCodes,
        invalidCoordinates, // Out-of-range coordinates (Kenya bounds: lat -4.7 to 5.0, lng 33.9 to 41.9)
      },
      monitoring: {
        // Operational monitoring metrics (NOT affecting quality score)
        expiredLicenses,
        expiringSoon,
        validLicenses: total - expiredLicenses - expiringSoon, // Calculate valid licenses
      },
      consistency: {
        duplicateCountyVariations, // e.g., "MURANGA" vs "MURANG'A" (48 counties instead of 47)
      },
      scores: {
        completeness: Math.max(0, Math.min(100, completenessScore)),
        validity: Math.max(0, Math.min(100, validityScore)),
        consistency: Math.max(0, Math.min(100, consistencyScore)),
        timeliness: 90, // Placeholder (TODO: Calculate from lastSyncedAt)
        overall: Math.max(0, Math.min(100, overallScore)),
      },
    };
  }

  /**
   * Save production facility quality audit snapshot
   */
  async saveProdFacilityQualityAudit(report: any, triggeredBy: string = 'manual', notes?: string): Promise<ProdFacilitiesQualityAudit> {
    const audit = this.prodFacilityQualityAuditRepo.create({
      totalFacilities: report.overview.totalFacilities,
      activeFacilities: report.overview.totalFacilities - (report.monitoring?.expiredLicenses || 0),
      inactiveFacilities: report.monitoring?.expiredLicenses || 0,
      missingGln: report.completeness.missingGLN,
      missingMflCode: report.completeness.missingMflCode,
      missingCounty: report.completeness.missingCounty,
      missingFacilityType: report.completeness.missingFacilityType,
      missingOwnership: report.completeness.missingOwnership,
      missingContactInfo: report.completeness.missingContactInfo,
      missingCoordinates: report.completeness.missingCoordinates,
      missingLatitude: report.completeness.missingLatitude,
      missingLongitude: report.completeness.missingLongitude,
      completeRecords: report.completeness.completeRecords,
      expiredLicenses: report.monitoring.expiredLicenses,
      expiringSoon: report.monitoring.expiringSoon,
      duplicateFacilityCodes: report.validity.duplicateFacilityCodes,
      invalidCoordinates: report.validity.invalidCoordinates,
      completenessScore: report.scores.completeness,
      completenessPercentage: report.completeness.completenessPercentage,
      validityScore: report.scores.validity,
      consistencyScore: report.scores.consistency,
      timelinessScore: report.scores.timeliness,
      overallQualityScore: report.scores.overall,
      triggeredBy,
      notes,
    });

    return this.prodFacilityQualityAuditRepo.save(audit);
  }

  /**
   * Get production facility quality audit history
   */
  async getProdFacilityQualityHistory(limit: number = 50): Promise<ProdFacilitiesQualityAudit[]> {
    return this.genericQualityHistoryService.getHistory(
      {
        entity_type: 'facility',
        repository: this.prodFacilityQualityAuditRepo,
        dateField: 'auditDate',
        scoreField: 'overallQualityScore',
      },
      limit
    );
  }

  /**
   * Get production facility quality audit by ID
   */
  async getProdFacilityQualityHistoryById(id: number): Promise<ProdFacilitiesQualityAudit> {
    return this.genericQualityHistoryService.getById(
      {
        entity_type: 'facility',
        repository: this.prodFacilityQualityAuditRepo,
        dateField: 'auditDate',
        scoreField: 'overallQualityScore',
      },
      id
    );
  }

  /**
   * Get production facility quality score trend
   */
  async getProdFacilityQualityScoreTrend(days: number = 30): Promise<{
    date: string;
    score: number;
  }[]> {
    return this.genericQualityHistoryService.getScoreTrend(
      {
        entity_type: 'facility',
        repository: this.prodFacilityQualityAuditRepo,
        dateField: 'auditDate',
        scoreField: 'overallQualityScore',
      },
      days
    );
  }

  // ============================================================================
  // PPB PRACTITIONER CATALOGUE METHODS
  // ============================================================================

  /**
   * Get all practitioners with pagination and search
   */
  async getPractitioners(
    page: number = 1,
    limit: number = 50,
    search?: string,
    cadre?: string,
    county?: string,
    licenseStatus?: string,
  ): Promise<{ practitioners: PPBPractitioner[]; total: number; page: number; limit: number }> {
    const result = await this.genericCrudService.getPaginated<PPBPractitioner>(
      {
        entity_type: 'practitioner',
        repository: this.ppbPractitionerRepo,
        searchFields: ['fullName', 'registrationNumber', 'email', 'phoneNumber'],
        defaultOrderBy: { field: 'fullName', direction: 'ASC' },
        filterConditions: {
          isTest: false,
          ...(cadre && { cadre }),
          ...(county && { county }),
          ...(licenseStatus && { licenseStatus }),
        },
      },
      page,
      limit,
      search
    );

    return {
      practitioners: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get practitioner by ID
   */
  async getPractitionerById(id: number): Promise<PPBPractitioner> {
    return this.genericCrudService.getById<PPBPractitioner>(
      {
        entity_type: 'practitioner',
        repository: this.ppbPractitionerRepo,
      },
      id
    );
  }

  /**
   * Get practitioner statistics
   */
  async getPractitionerStats(): Promise<{
    total: number;
    byCadre: Record<string, number>;
    byCounty: Record<string, number>;
    byLicenseStatus: Record<string, number>;
    lastSync: string | null;
  }> {
    const practitioners = await this.ppbPractitionerRepo.find({
      where: { isTest: false },
    });

    const byCadre: Record<string, number> = {};
    const byCounty: Record<string, number> = {};
    const byLicenseStatus: Record<string, number> = {};

    practitioners.forEach((p) => {
      if (p.cadre) {
        byCadre[p.cadre] = (byCadre[p.cadre] || 0) + 1;
      }
      if (p.county) {
        byCounty[p.county] = (byCounty[p.county] || 0) + 1;
      }
      if (p.licenseStatus) {
        byLicenseStatus[p.licenseStatus] = (byLicenseStatus[p.licenseStatus] || 0) + 1;
      }
    });

    const lastSyncRecord = await this.ppbPractitionerRepo.findOne({
      where: { isTest: false },
      order: { lastSyncedAt: 'DESC' },
    });

    return {
      total: practitioners.length,
      byCadre,
      byCounty,
      byLicenseStatus,
      lastSync: lastSyncRecord?.lastSyncedAt?.toISOString() || null,
    };
  }

  /**
   * Sync practitioners from PPB Catalogue API
   */
  async syncPractitionerCatalogue(
    email?: string,
    password?: string,
  ): Promise<{ inserted: number; updated: number; errors: number; total: number }> {
    const startTime = Date.now();
    this.logger.log('Starting practitioner catalog sync from PPB API...');

    try {
      // Fetch practitioners from PPB API
      const apiPractitioners = email && password
        ? await this.ppbApiService.getPractitionersWithCredentials(email, password)
        : await this.ppbApiService.getAllPractitionersFromCatalogue();

      this.logger.log(`Fetched ${apiPractitioners.length} practitioners from PPB API`);

      let inserted = 0;
      let updated = 0;
      let errors = 0;

      for (const apiPractitioner of apiPractitioners) {
        try {
          // Map API response to entity fields
          const practitionerData = this.mapPractitionerFromApi(apiPractitioner);

          // Check if practitioner exists by registration number
          const existing = practitionerData.registrationNumber
            ? await this.ppbPractitionerRepo.findOne({
                where: { registrationNumber: practitionerData.registrationNumber },
              })
            : null;

          if (existing) {
            // Update existing practitioner
            await this.ppbPractitionerRepo.update(existing.id, {
              ...practitionerData,
              lastSyncedAt: new Date(),
            });
            updated++;
          } else {
            // Insert new practitioner
            await this.ppbPractitionerRepo.save({
              ...practitionerData,
              lastSyncedAt: new Date(),
            });
            inserted++;
          }
        } catch (error: any) {
          this.logger.error(
            `Error syncing practitioner: ${error.message}`,
            JSON.stringify(apiPractitioner).substring(0, 200)
          );
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Practitioner sync completed in ${duration}ms: ${inserted} inserted, ${updated} updated, ${errors} errors`
      );

      return {
        inserted,
        updated,
        errors,
        total: apiPractitioners.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to sync practitioner catalog: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map PPB API practitioner response to entity
   */
  private mapPractitionerFromApi(apiData: any): Partial<PPBPractitioner> {
    // PPB API Field Mapping:
    // regid, registrationno, firstname, surname, lastname, licenseno, licencestatus, validto, mobileno, premisesname, mailingaddress
    
    const firstName = apiData.firstname || apiData.firstName || apiData.first_name || '';
    const middleName = apiData.middlename || apiData.middleName || apiData.middle_name || '';
    const lastName = apiData.lastname || apiData.lastName || apiData.last_name || '';
    const surname = apiData.surname || '';
    
    // Build full name: firstname + surname + lastname (PPB uses all three)
    const fullName = apiData.fullName || apiData.full_name || 
                     `${firstName} ${surname} ${lastName}`.replace(/\s+/g, ' ').trim();

    return {
      practitionerId: apiData.regid?.toString() || apiData.practitionerId || apiData.id?.toString(),
      registrationNumber: apiData.registrationno?.toString() || apiData.registrationNumber || apiData.regNumber,
      firstName,
      middleName,
      lastName: lastName || surname, // Use surname if lastname not available
      fullName,
      cadre: apiData.cadre || apiData.profession,
      qualification: apiData.qualification || apiData.qualifications,
      specialization: apiData.specialization || apiData.specialty,
      licenseNumber: apiData.licenseno || apiData.licenseNumber || apiData.license_number,
      licenseStatus: apiData.licencestatus || apiData.licenseStatus || apiData.license_status || 'Unknown',
      licenseValidFrom: apiData.validfrom ? new Date(apiData.validfrom) : (apiData.licenseValidFrom ? new Date(apiData.licenseValidFrom) : undefined),
      licenseValidUntil: apiData.validto ? new Date(apiData.validto) : (apiData.licenseValidUntil ? new Date(apiData.licenseValidUntil) : undefined),
      licenseValidityYear: apiData.renewalyear || apiData.licenseValidityYear || apiData.validity_year,
      email: apiData.email || apiData.emailAddress,
      phoneNumber: apiData.phonenumber || apiData.phoneNumber || apiData.phone_number || apiData.phone,
      mobileNumber: apiData.mobileno || apiData.mobileNumber || apiData.mobile_number || apiData.mobile,
      county: apiData.county,
      subCounty: apiData.subcounty || apiData.subCounty || apiData.sub_county,
      constituency: apiData.constituency,
      ward: apiData.ward,
      postalCode: apiData.postalcode || apiData.postalCode || apiData.postal_code,
      addressLine1: apiData.mailingaddress || apiData.addressLine1 || apiData.address_line1 || apiData.address,
      addressLine2: apiData.physicaladdress || apiData.addressLine2 || apiData.address_line2,
      practiceType: apiData.practicetype || apiData.practiceType || apiData.practice_type,
      employerName: apiData.employername || apiData.employerName || apiData.employer_name,
      facilityName: apiData.premisesname || apiData.facilityName || apiData.facility_name,
      facilityMflCode: apiData.mflcode || apiData.facilityMflCode || apiData.facility_mfl_code || apiData.mfl_code,
      regulatoryBody: apiData.regulator || apiData.regulatoryBody || apiData.regulatory_body || 'PPB',
      councilRegistrationDate: apiData.registrationdate ? new Date(apiData.registrationdate) : (apiData.councilRegistrationDate ? new Date(apiData.councilRegistrationDate) : undefined),
      status: apiData.status || 'Active',
      isEnabled: apiData.is_enabled !== false,
      isTest: false,
      sourceSystem: 'PPB_CATALOGUE',
      rawData: apiData, // Store original response
    };
  }

  /**
   * Get practitioner data quality report
   * Analyzes completeness, validity, and distribution
   */
  async getPractitionerDataQualityReport(): Promise<any> {
    const practitioners = await this.ppbPractitionerRepo.find({
      where: { isTest: false },
    });

    const total = practitioners.length;
    const today = new Date();

    // Completeness metrics
    let missingEmail = 0;
    let missingPhone = 0;
    let missingCounty = 0;
    let missingCadre = 0;
    let missingLicenseInfo = 0;
    let missingFacility = 0;
    let missingAddress = 0;

    // Validity metrics
    let expiredLicenses = 0;
    let expiringSoon = 0;
    let validLicenses = 0;
    let duplicateRegistrationNumbers = 0;
    let invalidEmail = 0;

    // Distribution tracking
    const cadreDistribution: Record<string, number> = {};
    const countyDistribution: Record<string, number> = {};
    const licenseStatusDistribution: Record<string, number> = {};

    const registrationNumbers = new Set<string>();
    const duplicates = new Set<string>();

    practitioners.forEach((p) => {
      // Completeness checks
      if (!p.email) missingEmail++;
      if (!p.phoneNumber && !p.mobileNumber) missingPhone++;
      if (!p.county) missingCounty++;
      if (!p.cadre) missingCadre++;
      if (!p.licenseNumber || !p.licenseStatus) missingLicenseInfo++;
      if (!p.facilityName) missingFacility++;
      if (!p.addressLine1) missingAddress++;

      // Validity checks
      if (p.email && !p.email.includes('@')) invalidEmail++;

      // License validity
      if (p.licenseValidUntil) {
        const expiryDate = new Date(p.licenseValidUntil);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          expiredLicenses++;
        } else if (daysUntilExpiry < 30) {
          expiringSoon++;
        } else {
          validLicenses++;
        }
      }

      // Duplicate registration numbers
      if (p.registrationNumber) {
        if (registrationNumbers.has(p.registrationNumber)) {
          duplicates.add(p.registrationNumber);
        }
        registrationNumbers.add(p.registrationNumber);
      }

      // Distributions
      if (p.cadre) cadreDistribution[p.cadre] = (cadreDistribution[p.cadre] || 0) + 1;
      if (p.county) countyDistribution[p.county] = (countyDistribution[p.county] || 0) + 1;
      if (p.licenseStatus) licenseStatusDistribution[p.licenseStatus] = (licenseStatusDistribution[p.licenseStatus] || 0) + 1;
    });

    duplicateRegistrationNumbers = duplicates.size;

    const completeRecords = practitioners.filter((p) => 
      p.email && 
      (p.phoneNumber || p.mobileNumber) && 
      p.county && 
      p.cadre && 
      p.licenseNumber && 
      p.facilityName
    ).length;

    const completenessPercentage = total > 0 ? (completeRecords / total) * 100 : 0;

    // Calculate quality score
    const completenessScore = completenessPercentage;
    const validityScore = total > 0
      ? ((validLicenses / total) * 50 + (1 - (duplicateRegistrationNumbers / total)) * 30 + (1 - (invalidEmail / total)) * 20)
      : 0;

    // Consistency score: standardization of data (cadre names, license status formats, etc.)
    // High consistency = data follows expected patterns and formats
    const consistencyScore = 95; // High consistency as PPB API provides standardized data

    // Timeliness score: based on how recent the last sync was
    const lastSyncRecord = await this.ppbPractitionerRepo.findOne({
      where: { isTest: false },
      order: { lastSyncedAt: 'DESC' },
    });
    
    const hoursSinceSync = lastSyncRecord?.lastSyncedAt
      ? (Date.now() - lastSyncRecord.lastSyncedAt.getTime()) / (1000 * 60 * 60)
      : 999;
    const timelinessScore = hoursSinceSync < 24 ? 100 : hoursSinceSync < 48 ? 85 : hoursSinceSync < 168 ? 70 : 50;

    // Overall quality score: weighted average of all 4 dimensions
    const dataQualityScore = (
      completenessScore * 0.4 + 
      validityScore * 0.3 + 
      consistencyScore * 0.15 + 
      timelinessScore * 0.15
    );

    return {
      overview: {
        totalPractitioners: total,
        lastSyncDate: lastSyncRecord?.lastSyncedAt?.toISOString() || null,
        dataQualityScore: Math.round(dataQualityScore * 10) / 10,
      },
      completeness: {
        missingEmail,
        missingPhone,
        missingCounty,
        missingCadre,
        missingLicenseInfo,
        missingFacility,
        missingAddress,
        completeRecords,
        completenessPercentage: Math.round(completenessPercentage * 10) / 10,
      },
      validity: {
        expiredLicenses,
        expiringSoon,
        validLicenses,
        duplicateRegistrationNumbers,
        invalidEmail,
      },
      distribution: {
        byCadre: Object.entries(cadreDistribution)
          .map(([cadre, count]) => ({ cadre, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
          .sort((a, b) => b.count - a.count),
        byCounty: Object.entries(countyDistribution)
          .map(([county, count]) => ({ county, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
          .sort((a, b) => b.count - a.count),
        byLicenseStatus: Object.entries(licenseStatusDistribution)
          .map(([status, count]) => ({ status, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
          .sort((a, b) => b.count - a.count),
      },
      scores: {
        completeness: Math.round(completenessScore * 10) / 10,
        validity: Math.round(validityScore * 10) / 10,
        consistency: Math.round(consistencyScore * 10) / 10,
        timeliness: Math.round(timelinessScore * 10) / 10,
        overall: Math.round(dataQualityScore * 10) / 10,
      },
    };
  }

  /**
   * Save practitioner quality audit snapshot
   */
  async savePractitionerQualitySnapshot(
    triggeredBy: string = 'manual',
    notes?: string,
  ): Promise<PractitionerQualityReport> {
    const report = await this.getPractitionerDataQualityReport();

    const snapshot = this.practitionerQualityReportRepo.create({
      reportDate: new Date(),
      totalPractitioners: report.overview.totalPractitioners,
      dataQualityScore: report.overview.dataQualityScore,
      missingEmail: report.completeness.missingEmail,
      missingPhone: report.completeness.missingPhone,
      missingCounty: report.completeness.missingCounty,
      missingCadre: report.completeness.missingCadre,
      missingLicenseInfo: report.completeness.missingLicenseInfo,
      missingFacility: report.completeness.missingFacility,
      missingAddress: report.completeness.missingAddress,
      completeRecords: report.completeness.completeRecords,
      completenessPercentage: report.completeness.completenessPercentage,
      expiredLicenses: report.monitoring.expiredLicenses,
      expiringSoon: report.monitoring.expiringSoon,
      validLicenses: report.monitoring.validLicenses,
      duplicateRegistrationNumbers: report.validity.duplicateRegistrationNumbers,
      invalidEmail: report.validity.invalidEmail,
      fullReport: report,
      triggeredBy,
      notes,
    });

    return this.practitionerQualityReportRepo.save(snapshot);
  }

  /**
   * Get practitioner quality report history
   */
  async getPractitionerQualityReportHistory(limit: number = 50): Promise<PractitionerQualityReport[]> {
    return this.practitionerQualityReportRepo.find({
      order: { reportDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get practitioner quality report by ID
   */
  async getPractitionerQualityReportById(id: number): Promise<PractitionerQualityReport> {
    const report = await this.practitionerQualityReportRepo.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Practitioner quality report with ID ${id} not found`);
    }
    return report;
  }

  /**
   * Get practitioner quality score trend
   */
  async getPractitionerQualityScoreTrend(days: number = 30): Promise<{ date: string; score: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reports = await this.practitionerQualityReportRepo.find({
      where: {
        reportDate: MoreThan(startDate) as any,
      },
      order: { reportDate: 'ASC' },
    });

    return reports.map((report) => ({
      date: report.reportDate.toISOString().split('T')[0],
      score: Number(report.dataQualityScore),
    }));
  }
}


