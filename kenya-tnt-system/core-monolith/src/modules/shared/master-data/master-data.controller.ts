import { Controller, Get, Post, Delete, Query, Param, ParseIntPipe, Logger, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';

@ApiTags('Master Data')
@Controller('master-data')
export class MasterDataController {
  private readonly logger = new Logger(MasterDataController.name);
  
  constructor(private readonly masterDataService: MasterDataService) {
    this.logger.log('MasterDataController initialized');
    this.logger.log('Product routes should be registered');
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getSuppliers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.masterDataService.getSuppliers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
    );
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getSupplierById(id);
  }

  @Get('premises/stats')
  @ApiOperation({ summary: 'Get premise catalog sync statistics' })
  async getPremiseCatalogStats() {
    return this.masterDataService.getPremiseCatalogStats();
  }

  @Get('premises/data-quality-report')
  @ApiOperation({ summary: 'Get comprehensive data quality report for premises' })
  async getPremiseDataQualityReport() {
    return this.masterDataService.getPremiseDataQualityReport();
  }

  @Get('products/data-quality-report')
  @ApiOperation({ summary: 'Get comprehensive data quality report for products (excludes test data)' })
  async getProductDataQualityReport() {
    return this.masterDataService.getProductDataQualityReport();
  }

  @Post('products/quality-audit')
  @ApiOperation({ summary: 'Save current product quality report as audit snapshot' })
  @ApiQuery({ name: 'triggeredBy', required: false, type: String })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async saveProductQualityAudit(
    @Query('triggeredBy') triggeredBy?: string,
    @Query('notes') notes?: string,
  ) {
    try {
      this.logger.log(`Saving product quality audit: triggeredBy=${triggeredBy}, notes=${notes}`);
      const result = await this.masterDataService.saveProductQualitySnapshot(
        triggeredBy || 'manual',
        notes,
      );
      this.logger.log(`Product quality audit saved successfully: ${result.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to save product quality audit: ${error.message}`);
      throw error;
    }
  }

  @Get('products/quality-history')
  @ApiOperation({ summary: 'Get historical product quality audit reports' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductQualityHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getProductQualityReportHistory(limit);
  }

  @Get('products/quality-history/:id')
  @ApiOperation({ summary: 'Get specific product quality audit snapshot' })
  async getProductQualityHistoryById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getProductQualityReportById(id);
  }

  @Get('products/quality-trend')
  @ApiOperation({ summary: 'Get product quality score trend over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getProductQualityTrend(@Query('days') days?: number) {
    return this.masterDataService.getProductQualityScoreTrend(days);
  }

  @Get('products/quality-audit/enriched')
  @ApiOperation({ summary: 'Get enriched product quality audit data (dimensions, trends, top issues)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days for trend analysis' })
  async getProductQualityAuditEnriched(@Query('days') days?: number) {
    return this.masterDataService.getEnrichedQualityAuditData('product', days);
  }

  @Get('premises')
  @ApiOperation({ summary: 'Get all premises with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: Number })
  @ApiQuery({ name: 'businessType', required: false, type: String })
  @ApiQuery({ name: 'constituency', required: false, type: String })
  @ApiQuery({ name: 'ward', required: false, type: String })
  async getPremises(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('supplierId') supplierId?: number,
    @Query('businessType') businessType?: string,
    @Query('constituency') constituency?: string,
    @Query('ward') ward?: string,
  ) {
    return this.masterDataService.getPremises(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
      supplierId ? Number(supplierId) : undefined,
      businessType,
      constituency,
      ward,
    );
  }

  @Get('premises/filter-options')
  @ApiOperation({ summary: 'Get all unique values for filters' })
  async getPremiseFilterOptions() {
    const [businessTypes, constituencies, wards] = await Promise.all([
      this.masterDataService.premiseRepo.createQueryBuilder('premise')
        .select('DISTINCT premise.businessType', 'value')
        .where('premise.businessType IS NOT NULL')
        .orderBy('premise.businessType', 'ASC')
        .getRawMany(),
      this.masterDataService.premiseRepo.createQueryBuilder('premise')
        .select('DISTINCT premise.constituency', 'value')
        .where('premise.constituency IS NOT NULL')
        .orderBy('premise.constituency', 'ASC')
        .getRawMany(),
      this.masterDataService.premiseRepo.createQueryBuilder('premise')
        .select('DISTINCT premise.ward', 'value')
        .where('premise.ward IS NOT NULL')
        .orderBy('premise.ward', 'ASC')
        .getRawMany(),
    ]);

    return {
      businessTypes: businessTypes.map(r => r.value),
      constituencies: constituencies.map(r => r.value),
      wards: wards.map(r => r.value),
    };
  }

  @Get('premises/quality-history')
  @ApiOperation({ summary: 'Get historical quality audit snapshots' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getQualityHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getQualityReportHistory(
      limit ? Number(limit) : 50,
    );
  }

  @Get('premises/quality-trend')
  @ApiOperation({ summary: 'Get quality score trend over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getQualityTrend(@Query('days') days?: number) {
    return this.masterDataService.getQualityScoreTrend(
      days ? Number(days) : 30,
    );
  }

  @Get('premises/quality-history/:id')
  @ApiOperation({ summary: 'Get specific quality audit snapshot' })
  async getQualityHistoryById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getQualityReportById(id);
  }

  @Get('premises/quality-audit/enriched')
  @ApiOperation({ summary: 'Get enriched premise quality audit data (dimensions, trends, top issues)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days for trend analysis' })
  async getPremiseQualityAuditEnriched(@Query('days') days?: number) {
    return this.masterDataService.getEnrichedQualityAuditData('premise', days);
  }

  @Post('premises/sync')
  @ApiOperation({ summary: 'Sync entire premise catalog from PPB Catalogue API' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Custom PPB email for authentication' })
  @ApiQuery({ name: 'password', required: false, type: String, description: 'Custom PPB password for authentication' })
  async syncPremiseCatalog(
    @Query('email') email?: string,
    @Query('password') password?: string,
  ) {
    return this.masterDataService.syncPremiseCatalog(email, password);
  }

  @Get('premises/sync-history')
  @ApiOperation({ summary: 'Get premise sync history from master_data_sync_logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPremiseSyncHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getSyncHistory('premise', limit || 10);
  }

  @Post('premises/webhook')
  @ApiOperation({ summary: 'Webhook endpoint for real-time premise updates from PPB' })
  async handlePremiseWebhook(@Body() payload: any) {
    this.logger.log('Received premise webhook from PPB');
    return this.masterDataService.handlePremiseWebhook(payload);
  }

  @Post('premises/incremental-sync')
  @ApiOperation({ summary: 'Incremental sync - only updated premises since last sync' })
  @ApiQuery({ name: 'since', required: false, type: String, description: 'ISO date to sync from (default: last sync date)' })
  async incrementalPremiseSync(@Query('since') since?: string) {
    const sinceDate = since ? new Date(since) : undefined;
    return this.masterDataService.incrementalPremiseSync(sinceDate);
  }

  @Post('premises/quality-audit')
  @ApiOperation({ summary: 'Save current quality report as snapshot' })
  @ApiQuery({ name: 'triggeredBy', required: false, type: String })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async saveQualityAudit(
    @Query('triggeredBy') triggeredBy?: string,
    @Query('notes') notes?: string,
  ) {
    try {
      this.logger.log(`Saving quality audit: triggeredBy=${triggeredBy}, notes=${notes}`);
      const result = await this.masterDataService.saveQualityReportSnapshot(
        triggeredBy || 'manual',
        notes,
      );
      this.logger.log(`Quality audit saved successfully: ${result.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to save quality audit: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  @Get('premises/:id')
  @ApiOperation({ summary: 'Get premise by ID' })
  async getPremiseById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getPremiseById(id);
  }

  @Get('logistics-providers')
  @ApiOperation({ summary: 'Get all logistics providers with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getLogisticsProviders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.masterDataService.getLogisticsProviders(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
    );
  }

  @Get('logistics-providers/:id')
  @ApiOperation({ summary: 'Get logistics provider by ID' })
  async getLogisticsProviderById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getLogisticsProviderById(id);
  }

  @Post('products/sync')
  @ApiOperation({ summary: 'Sync entire product catalog from Terminology API' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Optional search term to filter products' })
  async syncProductCatalog(@Query('search') search?: string) {
    return this.masterDataService.syncProductCatalog(search);
  }

  @Get('products/sync-history')
  @ApiOperation({ summary: 'Get product sync history from master_data_sync_logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductSyncHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getSyncHistory('product', limit || 10);
  }

  @Get('products-simple-test')
  @ApiOperation({ summary: 'Simple test endpoint (no service dependency)' })
  async simpleTest() {
    this.logger.log('Simple test route called');
    return { message: 'Simple test route works', timestamp: new Date().toISOString() };
  }

  @Get('products/test')
  @ApiOperation({ summary: 'Test endpoint to verify route registration' })
  async testProducts() {
    this.logger.log('Products test route called');
    return { message: 'Products routes are working', timestamp: new Date().toISOString() };
  }

  @Get('products/stats')
  @ApiOperation({ summary: 'Get product catalog sync statistics' })
  async getProductCatalogStats() {
    return this.masterDataService.getProductCatalogStats();
  }

  @Get('products/all')
  @ApiOperation({ summary: 'Get all products (for frontend compatibility)' })
  async getAllProducts() {
    return this.masterDataService.getAllProducts();
  }

  @Get('products')
  @ApiOperation({ summary: 'Search products in catalog' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchProducts(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.masterDataService.searchProducts(
      search,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getProductById(id);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product (soft delete - sets isEnabled to false)' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.deleteProduct(id);
  }

  // ==================== UAT FACILITIES (Safaricom HIE) ====================

  @Post('uat-facilities/sync')
  @ApiOperation({ summary: 'Sync facilities from Safaricom HIE API (incremental)' })
  async syncUatFacilities() {
    this.logger.log('Starting UAT facility sync');
    try {
      const result = await this.masterDataService.syncUatFacilities();
      this.logger.log(`UAT facility sync completed: ${result.total} facilities processed`);
      return result;
    } catch (error: any) {
      this.logger.error(`UAT facility sync failed: ${error.message}`);
      throw error;
    }
  }

  @Get('uat-facilities/sync-history')
  @ApiOperation({ summary: 'Get UAT facility sync history from master_data_sync_logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUatFacilitySyncHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getSyncHistory('facility', limit || 10);
  }

  @Get('uat-facilities/api-sample')
  @ApiOperation({ summary: 'Get sample raw API response for debugging' })
  @ApiQuery({ name: 'count', required: false, type: Number })
  async getUatFacilitiesApiSample(@Query('count') count?: number) {
    this.logger.log('Fetching sample UAT facility API responses');
    try {
      const result = await this.masterDataService.getSampleFacilityApiResponse(count || 3);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to fetch API sample: ${error.message}`);
      throw error;
    }
  }

  @Get('uat-facilities')
  @ApiOperation({ summary: 'Get all UAT facilities with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'county', required: false, type: String })
  @ApiQuery({ name: 'facilityType', required: false, type: String })
  @ApiQuery({ name: 'ownership', required: false, type: String })
  async getUatFacilities(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('county') county?: string,
    @Query('facilityType') facilityType?: string,
    @Query('ownership') ownership?: string,
  ) {
    return this.masterDataService.getUatFacilities(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
      county,
      facilityType,
      ownership,
    );
  }

  @Get('uat-facilities/stats')
  @ApiOperation({ summary: 'Get UAT facility statistics' })
  async getUatFacilityStats() {
    return this.masterDataService.getUatFacilityStats();
  }

  @Get('uat-facilities/data-quality-report')
  @ApiOperation({ summary: 'Get comprehensive data quality report for UAT facilities' })
  async getUatFacilityDataQualityReport() {
    return this.masterDataService.generateUatFacilityDataQualityReport();
  }

  @Post('uat-facilities/quality-audit')
  @ApiOperation({ summary: 'Save current UAT facility quality report as audit snapshot' })
  @ApiQuery({ name: 'triggeredBy', required: false, type: String })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async saveUatFacilityQualityAudit(
    @Query('triggeredBy') triggeredBy?: string,
    @Query('notes') notes?: string,
  ) {
    try {
      this.logger.log(`Saving UAT facility quality audit: triggeredBy=${triggeredBy}, notes=${notes}`);
      const result = await this.masterDataService.saveUatFacilityQualityAudit(
        triggeredBy || 'manual',
        notes,
      );
      this.logger.log(`UAT facility quality audit saved successfully: ${result.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to save UAT facility quality audit: ${error.message}`);
      throw error;
    }
  }

  @Get('uat-facilities/quality-history')
  @ApiOperation({ summary: 'Get historical UAT facility quality audit reports' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUatFacilityQualityHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getUatFacilityQualityHistory(limit);
  }

  @Get('uat-facilities/quality-history/:id')
  @ApiOperation({ summary: 'Get specific UAT facility quality audit snapshot' })
  async getUatFacilityQualityHistoryById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getUatFacilityQualityHistoryById(id);
  }

  @Get('uat-facilities/quality-trend')
  @ApiOperation({ summary: 'Get UAT facility quality score trend over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUatFacilityQualityTrend(@Query('days') days?: number) {
    return this.masterDataService.getUatFacilityQualityScoreTrend(days);
  }

  @Get('uat-facilities/quality-audit/enriched')
  @ApiOperation({ summary: 'Get enriched UAT facility quality audit data (dimensions, trends, top issues)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days for trend analysis' })
  async getUatFacilityQualityAuditEnriched(@Query('days') days?: number) {
    return this.masterDataService.getEnrichedQualityAuditData('facility', days);
  }

  // ========================================================================================
  // PROD FACILITIES (Production Safaricom HIE) - https://stage-nlmis.apeiro-digital.com/api/facilities
  // ========================================================================================

  @Post('prod-facilities/sync')
  @ApiOperation({ summary: 'Sync facilities from Safaricom HIE API Production (incremental)' })
  async syncProdFacilities() {
    this.logger.log('Starting Production facility sync');
    try {
      const result = await this.masterDataService.syncProdFacilities();
      this.logger.log(`Production facility sync completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Error syncing production facilities', error);
      throw error;
    }
  }

  @Get('prod-facilities/sync-history')
  @ApiOperation({ summary: 'Get Production facility sync history from master_data_sync_logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProdFacilitySyncHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getSyncHistory('facility', limit || 10);
  }

  @Get('prod-facilities')
  @ApiOperation({ summary: 'Get all Production facilities with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'county', required: false, type: String })
  @ApiQuery({ name: 'facilityType', required: false, type: String })
  @ApiQuery({ name: 'ownership', required: false, type: String })
  async getProdFacilities(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('county') county?: string,
    @Query('facilityType') facilityType?: string,
    @Query('ownership') ownership?: string,
  ) {
    return this.masterDataService.getProdFacilities({
      page,
      limit,
      search,
      county,
      facilityType,
      ownership,
    });
  }

  @Get('prod-facilities/stats')
  @ApiOperation({ summary: 'Get Production facility statistics' })
  async getProdFacilityStats() {
    return this.masterDataService.getProdFacilityStats();
  }

  @Get('prod-facilities/data-quality-report')
  @ApiOperation({ summary: 'Get comprehensive data quality report for Production facilities' })
  async getProdFacilityDataQualityReport() {
    return this.masterDataService.generateProdFacilityDataQualityReport();
  }

  @Post('prod-facilities/quality-audit')
  @ApiOperation({ summary: 'Save current Production facility quality report as audit snapshot' })
  @ApiQuery({ name: 'triggeredBy', required: false, type: String })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async saveProdFacilityQualityAudit(
    @Query('triggeredBy') triggeredBy?: string,
    @Query('notes') notes?: string,
  ) {
    // First, generate the current quality report
    const report = await this.masterDataService.generateProdFacilityDataQualityReport();
    
    // Save it as an audit snapshot
    return this.masterDataService.saveProdFacilityQualityAudit(
      report,
      triggeredBy || 'Manual',
      notes,
    );
  }

  @Get('prod-facilities/quality-history')
  @ApiOperation({ summary: 'Get historical Production facility quality audit reports' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProdFacilityQualityHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getProdFacilityQualityHistory(limit);
  }

  @Get('prod-facilities/quality-history/:id')
  @ApiOperation({ summary: 'Get specific Production facility quality audit snapshot' })
  async getProdFacilityQualityHistoryById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getProdFacilityQualityHistoryById(id);
  }

  @Get('prod-facilities/quality-trend')
  @ApiOperation({ summary: 'Get Production facility quality score trend over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getProdFacilityQualityTrend(@Query('days') days?: number) {
    return this.masterDataService.getProdFacilityQualityScoreTrend(days);
  }

  @Get('prod-facilities/quality-audit/enriched')
  @ApiOperation({ summary: 'Get enriched Production facility quality audit data (dimensions, trends, top issues)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days for trend analysis' })
  async getProdFacilityQualityAuditEnriched(@Query('days') days?: number) {
    return this.masterDataService.getEnrichedQualityAuditData('facility_prod', days);
  }

  // ============================================================================
  // PRACTITIONER ENDPOINTS
  // ============================================================================

  @Get('practitioners/stats')
  @ApiOperation({ summary: 'Get practitioner statistics' })
  async getPractitionerStats() {
    return this.masterDataService.getPractitionerStats();
  }

  @Get('practitioners')
  @ApiOperation({ summary: 'Get all practitioners with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'cadre', required: false, type: String })
  @ApiQuery({ name: 'county', required: false, type: String })
  @ApiQuery({ name: 'licenseStatus', required: false, type: String })
  async getPractitioners(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('cadre') cadre?: string,
    @Query('county') county?: string,
    @Query('licenseStatus') licenseStatus?: string,
  ) {
    return this.masterDataService.getPractitioners(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
      cadre,
      county,
      licenseStatus,
    );
  }

  @Post('practitioners/sync')
  @ApiOperation({ summary: 'Sync practitioners from PPB Catalogue API' })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'password', required: false, type: String })
  async syncPractitioners(
    @Query('email') email?: string,
    @Query('password') password?: string,
  ) {
    try {
      this.logger.log('Starting practitioner catalog sync...');
      const result = await this.masterDataService.syncPractitionerCatalogue(
        email,
        password,
      );
      this.logger.log(`Practitioner sync completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to sync practitioners: ${error.message}`);
      throw error;
    }
  }

  @Get('practitioners/data-quality-report')
  @ApiOperation({ summary: 'Get comprehensive data quality report for practitioners' })
  async getPractitionerDataQualityReport() {
    return this.masterDataService.getPractitionerDataQualityReport();
  }

  @Post('practitioners/quality-audit')
  @ApiOperation({ summary: 'Save current practitioner quality report as audit snapshot' })
  @ApiQuery({ name: 'triggeredBy', required: false, type: String })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async savePractitionerQualityAudit(
    @Query('triggeredBy') triggeredBy?: string,
    @Query('notes') notes?: string,
  ) {
    try {
      this.logger.log(`Saving practitioner quality audit: triggeredBy=${triggeredBy}, notes=${notes}`);
      const result = await this.masterDataService.savePractitionerQualitySnapshot(
        triggeredBy || 'manual',
        notes,
      );
      this.logger.log(`Practitioner quality audit saved successfully: ${result.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to save practitioner quality audit: ${error.message}`);
      throw error;
    }
  }

  @Get('practitioners/quality-history')
  @ApiOperation({ summary: 'Get historical practitioner quality audit reports' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPractitionerQualityHistory(@Query('limit') limit?: number) {
    return this.masterDataService.getPractitionerQualityReportHistory(limit);
  }

  @Get('practitioners/quality-history/:id')
  @ApiOperation({ summary: 'Get specific practitioner quality audit snapshot' })
  async getPractitionerQualityHistoryById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getPractitionerQualityReportById(id);
  }

  @Get('practitioners/quality-trend')
  @ApiOperation({ summary: 'Get practitioner quality score trend over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getPractitionerQualityTrend(@Query('days') days?: number) {
    return this.masterDataService.getPractitionerQualityScoreTrend(days);
  }

  @Get('practitioners/quality-audit/enriched')
  @ApiOperation({ summary: 'Get enriched practitioner quality audit data (dimensions, trends, top issues)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days for trend analysis' })
  async getPractitionerQualityAuditEnriched(@Query('days') days?: number) {
    return this.masterDataService.getEnrichedQualityAuditData('practitioner', days);
  }

  @Get('practitioners/:id')
  @ApiOperation({ summary: 'Get practitioner by ID' })
  async getPractitionerById(@Param('id', ParseIntPipe) id: number) {
    return this.masterDataService.getPractitionerById(id);
  }
}

