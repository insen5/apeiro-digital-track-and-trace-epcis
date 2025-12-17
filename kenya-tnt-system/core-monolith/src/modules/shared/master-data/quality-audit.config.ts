/**
 * Centralized Quality Audit Configuration
 * Drives all quality audit functionality for Products, Premises, and Facilities
 */

export interface QualityAuditEntityConfig {
  entityType: string; // NEW: 'product', 'premise', 'facility', 'facility_prod', 'practitioner'
  entityName: string; // 'product', 'premise', 'facility'
  entityDisplayName: string;
  tableName: string;
  reportEntityName: string; // TypeORM entity constructor name
  apiBasePath: string;
  
  // NEW: Field mappings for generic enrichment service
  dateField: string; // e.g., 'reportDate' or 'auditDate'
  scoreField: string; // e.g., 'dataQualityScore' or 'overallQualityScore'
  totalRecordsField: string; // e.g., 'totalProducts' or 'totalFacilities'
  
  // Completeness metrics to track
  completenessMetrics: {
    key: string;
    label: string;
    weight: number; // for scoring
    critical: boolean;
  }[];
  
  // Validity metrics to track (format errors, data integrity issues)
  validityMetrics: {
    key: string;
    label: string;
    weight: number;
    checkType: 'format' | 'integrity' | 'duplicate' | 'range'; // Type of validity check
  }[];
  
  // Consistency metrics (standardization issues, naming variations)
  consistencyMetrics?: {
    key: string;
    label: string;
    checkType: 'naming' | 'standardization' | 'variation';
  }[];
  
  // Sync configuration
  syncConfig: {
    frequency: string; // e.g., 'every 3 hours'
    cronSchedule: string; // e.g., '0 */3 * * *'
    syncEndpoint: string;
  };
  
  // Timeliness scoring configuration (STANDARDIZED)
  timelinessConfig: {
    syncFrequency: string; // Human-readable description
    thresholds: {
      hours: number;
      score: number;
    }[];
  };
  
  // Distribution queries (optional)
  distributionQueries?: {
    key: string;
    field: string;
    label: string;
    type?: 'boolean' | 'categorical';
    filter?: Record<string, any>;
  }[];
  
  // Scoring weights (STANDARDIZED except practitioners)
  scoringWeights: {
    completeness: number;
    validity: number;
    consistency: number;
    timeliness: number;
  };
  
  // Custom validity queries (for entity-specific complex queries like license tracking)
  // NOTE: Queries are hardcoded in generic service by key name (can't serialize async functions)
  customValidityQueries?: {
    key: string;
    label: string;
    value?: number; // For static values
  }[];
  
  // Complete records field list (for strict record-level completeness - REQUIRED)
  completeRecordsFields: string[];
  
  // Domain-specific validation rules (optional)
  domainValidation?: {
    coordinateBounds?: {
      latMin: number;
      latMax: number;
      lngMin: number;
      lngMax: number;
    };
    formatValidation?: {
      field: string;
      pattern: string;
      example: string;
    }[];
  };
}

export const QUALITY_AUDIT_CONFIGS: Record<string, QualityAuditEntityConfig> = {
  product: {
    entityType: 'product',
    entityName: 'product',
    entityDisplayName: 'Product',
    tableName: 'ppb_products',
    reportEntityName: 'ProductQualityReport',
    apiBasePath: '/api/master-data/products',
    
    // Field mappings for enrichment
    dateField: 'reportDate',
    scoreField: 'dataQualityScore',
    totalRecordsField: 'totalProducts',
    
    completenessMetrics: [
      { key: 'missingGtin', label: 'Missing GTIN', weight: 20, critical: true },
      { key: 'missingManufacturer', label: 'Missing Manufacturer', weight: 20, critical: true },
      { key: 'missingBrandName', label: 'Missing Brand Name', weight: 10, critical: false },
      { key: 'missingGenericName', label: 'Missing Generic Name', weight: 10, critical: false },
      { key: 'missingPpbCode', label: 'Missing PPB Code', weight: 10, critical: false },
      { key: 'missingCategory', label: 'Missing Category', weight: 5, critical: false },
      { key: 'missingStrength', label: 'Missing Strength', weight: 5, critical: false },
      { key: 'missingRoute', label: 'Missing Route', weight: 5, critical: false },
      { key: 'missingForm', label: 'Missing Form', weight: 5, critical: false },
    ],
    
    validityMetrics: [
      { key: 'duplicateGtins', label: 'Duplicate GTINs', weight: 40, checkType: 'duplicate' },
      { key: 'invalidGtinFormat', label: 'Invalid GTIN Format (not 8-14 digits)', weight: 30, checkType: 'format' },
      { key: 'duplicateProductIds', label: 'Duplicate Product IDs', weight: 30, checkType: 'duplicate' },
    ],
    
    consistencyMetrics: [
      { key: 'categoryNamingVariations', label: 'Category naming inconsistencies', checkType: 'naming' },
      { key: 'routeDescriptionVariations', label: 'Route description variations', checkType: 'standardization' },
    ],
    
    syncConfig: {
      frequency: 'every 3 hours',
      cronSchedule: '0 */3 * * *',
      syncEndpoint: '/api/master-data/products/sync',
    },
    
    // Timeliness scoring for PPB product sync (every 3 hours)
    timelinessConfig: {
      syncFrequency: 'every 3 hours',
      thresholds: [
        { hours: 3, score: 100 },    // < 3 hours: 100%
        { hours: 6, score: 80 },     // 3-6 hours: 80%
        { hours: 12, score: 60 },    // 6-12 hours: 60%
        { hours: 24, score: 40 },    // 12-24 hours: 40%
        { hours: Infinity, score: 0 }, // > 24 hours: 0%
      ],
    },
    
    // Distribution queries for Product catalog
    distributionQueries: [
      { 
        key: 'byCategory', 
        field: 'category', 
        label: 'By Category',
        type: 'categorical' as const,
      },
      { 
        key: 'byKemlStatus', 
        field: 'kemlIsOnKeml', 
        label: 'KEML Status',
        type: 'boolean' as const,
      },
      { 
        key: 'byLevelOfUse', 
        field: 'levelOfUse', 
        label: 'By Level of Use',
        type: 'categorical' as const,
        filter: { kemlIsOnKeml: true }, // Only for KEML products
      },
    ],
    
    // Scoring weights (follows existing Product report)
    scoringWeights: {
      completeness: 0.4,
      validity: 0.3,
      consistency: 0.15,
      timeliness: 0.15,
    },
    
    // Critical fields for strict record-level completeness (ALL must be present)
    completeRecordsFields: [
      'gtin',
      'manufacturers', // Array must not be empty
      'brandName', // OR brandDisplayName
      'genericName', // OR genericDisplayName
      'ppbRegistrationCode',
      'category',
      'strengthAmount', // OR strengthUnit
      'routeDescription',
      'formDescription',
    ],
  },
  
  premise: {
    entityType: 'premise',
    entityName: 'premise',
    entityDisplayName: 'Premise',
    tableName: 'premises',
    reportEntityName: 'PremiseQualityReport',
    apiBasePath: '/api/master-data/premises',
    
    // Field mappings for enrichment
    dateField: 'reportDate',
    scoreField: 'dataQualityScore',
    totalRecordsField: 'totalPremises',
    
    completenessMetrics: [
      { key: 'missingGln', label: 'Missing GLN', weight: 20, critical: true },
      { key: 'missingLicenseInfo', label: 'Missing License Info', weight: 15, critical: true },
      { key: 'missingCounty', label: 'Missing County', weight: 10, critical: true },
      { key: 'missingLocation', label: 'Missing Street Address', weight: 10, critical: true },
      { key: 'missingBusinessType', label: 'Missing Business Type', weight: 10, critical: false },
      { key: 'missingOwnership', label: 'Missing Ownership', weight: 10, critical: false },
      { key: 'missingSuperintendent', label: 'Missing Superintendent', weight: 10, critical: false },
      { key: 'missingSupplierMapping', label: 'Missing Supplier Mapping', weight: 5, critical: false },
    ],
    
    validityMetrics: [
      { key: 'invalidGln', label: 'Invalid GLN Format (not 13 digits)', weight: 40, checkType: 'format' },
      { key: 'duplicatePremiseIds', label: 'Duplicate Premise IDs', weight: 30, checkType: 'duplicate' },
      { key: 'invalidLicenseDates', label: 'Invalid License Dates (future issue date)', weight: 30, checkType: 'integrity' },
    ],
    
    consistencyMetrics: [
      { key: 'countyNamingVariations', label: 'County name variations', checkType: 'variation' },
      { key: 'businessTypeStandardization', label: 'Business type naming inconsistencies', checkType: 'standardization' },
      { key: 'ownershipFormatVariations', label: 'Ownership format variations', checkType: 'standardization' },
    ],
    
    syncConfig: {
      frequency: 'every 3 hours',
      cronSchedule: '0 */3 * * *',
      syncEndpoint: '/api/master-data/premises/sync',
    },
    
    // Timeliness scoring for premise sync (every 3 hours) - SAME AS PRODUCTS
    timelinessConfig: {
      syncFrequency: 'every 3 hours',
      thresholds: [
        { hours: 3, score: 100 },    // < 3 hours: 100%
        { hours: 6, score: 80 },     // 3-6 hours: 80%
        { hours: 12, score: 60 },    // 6-12 hours: 60%
        { hours: 24, score: 40 },    // 12-24 hours: 40%
        { hours: Infinity, score: 0 }, // > 24 hours: 0%
      ],
    },
    
    // Distribution queries for Premise (ALL 4 categories from frontend)
    distributionQueries: [
      { 
        key: 'byCounty', 
        field: 'county', 
        label: 'By County',
        type: 'categorical' as const,
      },
      { 
        key: 'byBusinessType', 
        field: 'businessType', 
        label: 'By Business Type',
        type: 'categorical' as const,
      },
      { 
        key: 'byOwnership', 
        field: 'ownership', 
        label: 'By Ownership',
        type: 'categorical' as const,
      },
      { 
        key: 'bySuperintendentCadre', 
        field: 'superintendentCadre', 
        label: 'By Superintendent Cadre',
        type: 'categorical' as const,
      },
    ],
    
    scoringWeights: {
      completeness: 0.4,
      validity: 0.3,
      consistency: 0.15,
      timeliness: 0.15,
    },
    
    // Custom validity queries for license tracking (Kenya-specific)
    // NOTE: value is omitted so queries execute dynamically in generic service
    customValidityQueries: [
      { key: 'expiringSoon', label: 'Expiring Soon' },
      { key: 'validLicenses', label: 'Valid Licenses' },
      { key: 'invalidDates', label: 'Invalid Dates' },
    ],
    
    // Complete records require all these fields (premise has 9 vs product's 2)
    completeRecordsFields: [
      'gln',
      'county',
      'constituency',
      'ward',
      'businessType',
      'ownership',
      'superintendentName',
      'licenseValidUntil',
      'supplierId', // AND supplierId != 1 (checked separately)
    ],
  },
  
  facility: {
    entityType: 'facility',
    entityName: 'facility',
    entityDisplayName: 'Facility Inventory',
    tableName: 'facility_inventory',
    reportEntityName: 'FacilityQualityReport',
    apiBasePath: '/api/master-data/facilities',
    
    // Field mappings for enrichment
    dateField: 'reportDate',
    scoreField: 'dataQualityScore',
    totalRecordsField: 'totalRecords',
    
    completenessMetrics: [
      { key: 'missingGtin', label: 'Missing GTIN', weight: 25, critical: true },
      { key: 'missingBatchNumber', label: 'Missing Batch Number', weight: 20, critical: true },
      { key: 'missingExpiryDate', label: 'Missing Expiry Date', weight: 20, critical: true },
      { key: 'missingQuantity', label: 'Missing Quantity', weight: 15, critical: false },
      { key: 'missingFacilityGln', label: 'Missing Facility GLN', weight: 10, critical: false },
      { key: 'missingProductName', label: 'Missing Product Name', weight: 10, critical: false },
    ],
    
    // Critical fields for record-level completeness
    completeRecordsFields: [
      'gtin',
      'batchNumber',
      'expiryDate',
      'quantity',
      'facilityGln',
    ],
    
    validityMetrics: [
      { key: 'expiredProducts', label: 'Expired Products', weight: 40, checkType: 'integrity' },
      { key: 'nearExpiryProducts', label: 'Near Expiry Products', weight: 30, checkType: 'integrity' },
      { key: 'invalidQuantities', label: 'Invalid Quantities', weight: 30, checkType: 'range' },
    ],
    
    syncConfig: {
      frequency: 'real-time',
      cronSchedule: '', // Real-time via EPCIS events
      syncEndpoint: '/api/facilities/inventory/sync',
    },
    
    // Timeliness scoring for facility (real-time updates via EPCIS)
    timelinessConfig: {
      syncFrequency: 'real-time (EPCIS events)',
      thresholds: [
        { hours: 1, score: 100 },    // < 1 hour: 100%
        { hours: 3, score: 80 },     // 1-3 hours: 80%
        { hours: 6, score: 60 },     // 3-6 hours: 60%
        { hours: 24, score: 40 },    // 6-24 hours: 40%
        { hours: Infinity, score: 0 }, // > 24 hours: 0%
      ],
    },
    
    scoringWeights: {
      completeness: 0.4,
      validity: 0.3,
      consistency: 0.15,
      timeliness: 0.15,
    },
  },
  
  uatFacility: {
    entityName: 'uatFacility',
    entityDisplayName: 'UAT Facility',
    tableName: 'uat_facilities',
    reportEntityName: 'UatFacilitiesQualityAudit',
    apiBasePath: '/api/master-data/facilities',
    
    // Field mappings for enrichment
    entityType: 'facility',
    dateField: 'auditDate',
    scoreField: 'overallQualityScore',
    totalRecordsField: 'totalFacilities',
    
    completenessMetrics: [
      { key: 'missingGln', label: 'Missing GLN', weight: 20, critical: true },
      { key: 'missingMflCode', label: 'Missing MFL Code', weight: 20, critical: true },
      { key: 'missingCounty', label: 'Missing County', weight: 20, critical: true },
      { key: 'missingCoordinates', label: 'Missing Coordinates', weight: 20, critical: true },
      { key: 'missingOwnership', label: 'Missing Ownership', weight: 10, critical: true },
      { key: 'missingFacilityType', label: 'Missing Facility Type', weight: 5, critical: false },
      { key: 'missingContactInfo', label: 'Missing Contact Info', weight: 5, critical: false },
    ],
    
    validityMetrics: [
      { key: 'expiredLicenses', label: 'Expired Licenses', weight: 30, checkType: 'integrity' },
      { key: 'invalidCoordinates', label: 'Invalid Coordinates', weight: 30, checkType: 'range' },
      { key: 'duplicateFacilityCodes', label: 'Duplicate Facility Codes', weight: 40, checkType: 'duplicate' },
    ],
    
    syncConfig: {
      frequency: 'every 3 hours',
      cronSchedule: '0 */3 * * *',
      syncEndpoint: '/api/master-data/facilities/sync',
    },
    
    timelinessConfig: {
      syncFrequency: 'every 3 hours',
      thresholds: [
        { hours: 3, score: 100 },    // < 3 hours: 100%
        { hours: 6, score: 80 },     // 3-6 hours: 80%
        { hours: 12, score: 60 },    // 6-12 hours: 60%
        { hours: 24, score: 40 },    // 12-24 hours: 40%
        { hours: Infinity, score: 0 }, // > 24 hours: 0%
      ],
    },
    
    scoringWeights: {
      completeness: 0.4,
      validity: 0.3,
      consistency: 0.15,
      timeliness: 0.15,
    },
    
    // Critical fields for strict record-level completeness (ALL must be present)
    completeRecordsFields: [
      'gln',
      'mflCode',
      'county',
      'latitude', // AND longitude (checked together)
      'longitude',
      'ownership', // AND ownership != 'Unknown'
    ],
    
    // Domain-specific validation for Kenya facilities
    domainValidation: {
      coordinateBounds: {
        latMin: -4.7,
        latMax: 5.0,
        lngMin: 33.9,
        lngMax: 41.9,
      },
      formatValidation: [
        { field: 'gln', pattern: '^\\d{13}$', example: '1234567890123' },
        { field: 'mflCode', pattern: '^[A-Z0-9\\-]{3,20}$', example: 'MFL-12345' },
      ],
    },
  },
  
  prodFacility: {
    entityType: 'facility_prod',
    entityName: 'prodFacility',
    entityDisplayName: 'Production Facility',
    tableName: 'prod_facilities',
    reportEntityName: 'ProdFacilitiesQualityAudit',
    apiBasePath: '/api/master-data/facilities-prod',
    
    // Field mappings for enrichment
    dateField: 'auditDate',
    scoreField: 'overallQualityScore',
    totalRecordsField: 'totalFacilities',
    
    completenessMetrics: [
      { key: 'missingGln', label: 'Missing GLN', weight: 20, critical: true },
      { key: 'missingMflCode', label: 'Missing MFL Code', weight: 20, critical: true },
      { key: 'missingCounty', label: 'Missing County', weight: 20, critical: true },
      { key: 'missingCoordinates', label: 'Missing Coordinates', weight: 20, critical: true },
      { key: 'missingOwnership', label: 'Missing Ownership', weight: 10, critical: true },
      { key: 'missingFacilityType', label: 'Missing Facility Type', weight: 5, critical: false },
      { key: 'missingContactInfo', label: 'Missing Contact Info', weight: 5, critical: false },
    ],
    
    validityMetrics: [
      { key: 'invalidGln', label: 'Invalid GLN Format (not 13 digits)', weight: 25, checkType: 'format' },
      { key: 'invalidMflCode', label: 'Invalid MFL Code Format', weight: 20, checkType: 'format' },
      { key: 'duplicateFacilityCodes', label: 'Duplicate Facility Codes', weight: 30, checkType: 'duplicate' },
      { key: 'invalidCoordinates', label: 'Invalid Coordinates (out of Kenya bounds)', weight: 25, checkType: 'range' },
    ],
    
    consistencyMetrics: [
      { key: 'countyNamingVariations', label: 'County spelling variations', checkType: 'variation' },
      { key: 'facilityTypeFormatting', label: 'Facility type formatting inconsistencies', checkType: 'standardization' },
      { key: 'ownershipFormatVariations', label: 'Ownership format variations', checkType: 'standardization' },
    ],
    
    syncConfig: {
      frequency: 'every 3 hours',
      cronSchedule: '0 */3 * * *',
      syncEndpoint: '/api/master-data/facilities-prod/sync',
    },
    
    timelinessConfig: {
      syncFrequency: 'every 3 hours',
      thresholds: [
        { hours: 3, score: 100 },
        { hours: 6, score: 80 },
        { hours: 12, score: 60 },
        { hours: 24, score: 40 },
        { hours: Infinity, score: 0 },
      ],
    },
    
    scoringWeights: {
      completeness: 0.4,
      validity: 0.3,
      consistency: 0.15,
      timeliness: 0.15,
    },
    
    // Critical fields for strict record-level completeness (ALL must be present)
    completeRecordsFields: [
      'gln',
      'mflCode',
      'county',
      'latitude',
      'longitude',
      'ownership', // AND ownership != 'Unknown'
    ],
    
    // Domain-specific validation for Kenya facilities
    domainValidation: {
      coordinateBounds: {
        latMin: -4.7,
        latMax: 5.0,
        lngMin: 33.9,
        lngMax: 41.9,
      },
      formatValidation: [
        { field: 'gln', pattern: '^\\d{13}$', example: '1234567890123' },
        { field: 'mflCode', pattern: '^[A-Z0-9\\-]{3,20}$', example: 'MFL-12345' },
      ],
    },
  },
  
  practitioner: {
    entityType: 'practitioner',
    entityName: 'practitioner',
    entityDisplayName: 'Practitioner',
    tableName: 'ppb_practitioners',
    reportEntityName: 'PractitionerQualityReport',
    apiBasePath: '/api/master-data/practitioners',
    
    // Field mappings for enrichment
    dateField: 'reportDate',
    scoreField: 'dataQualityScore',
    totalRecordsField: 'totalPractitioners',
    
    completenessMetrics: [
      { key: 'missingEmail', label: 'Missing Email', weight: 20, critical: true },
      { key: 'missingPhone', label: 'Missing Phone', weight: 20, critical: true },
      { key: 'missingCounty', label: 'Missing County', weight: 15, critical: true },
      { key: 'missingCadre', label: 'Missing Cadre', weight: 15, critical: true },
      { key: 'missingLicenseInfo', label: 'Missing License Info', weight: 15, critical: true },
      { key: 'missingFacility', label: 'Missing Facility', weight: 10, critical: true },
      { key: 'missingAddress', label: 'Missing Address', weight: 5, critical: false },
    ],
    
    validityMetrics: [
      { key: 'duplicateRegistrationNumbers', label: 'Duplicate Registration Numbers', weight: 40, checkType: 'duplicate' },
      { key: 'invalidEmail', label: 'Invalid Email Format', weight: 30, checkType: 'format' },
      { key: 'invalidLicenseNumber', label: 'Invalid License Number Format', weight: 30, checkType: 'format' },
    ],
    
    consistencyMetrics: [
      { key: 'cadreNamingVariations', label: 'Cadre naming inconsistencies', checkType: 'standardization' },
      { key: 'licenseStatusFormatting', label: 'License status format variations', checkType: 'standardization' },
    ],
    
    syncConfig: {
      frequency: 'every 3 hours',
      cronSchedule: '0 */3 * * *',
      syncEndpoint: '/api/master-data/practitioners/sync',
    },
    
    // Timeliness scoring - SAME AS PRODUCTS/PREMISES
    timelinessConfig: {
      syncFrequency: 'every 3 hours',
      thresholds: [
        { hours: 3, score: 100 },    // < 3 hours: 100%
        { hours: 6, score: 80 },     // 3-6 hours: 80%
        { hours: 12, score: 60 },    // 6-12 hours: 60%
        { hours: 24, score: 40 },    // 12-24 hours: 40%
        { hours: Infinity, score: 0 }, // > 24 hours: 0%
      ],
    },
    
    scoringWeights: {
      completeness: 0.4,
      validity: 0.5, // Higher weight for license validity
      consistency: 0.05,
      timeliness: 0.05,
    },
    
    // Custom validity queries for license tracking
    customValidityQueries: [
      { key: 'expiringSoon', label: 'Expiring Soon' },
      { key: 'validLicenses', label: 'Valid Licenses' },
    ],
    
    // Critical fields for strict record-level completeness (ALL must be present)
    completeRecordsFields: [
      'email',
      'phoneNumber', // OR mobileNumber (checked with special logic)
      'county',
      'cadre',
      'licenseNumber',
      'facilityName',
    ],
  },
};

export function getQualityAuditConfig(entityType: string): QualityAuditEntityConfig {
  const config = QUALITY_AUDIT_CONFIGS[entityType];
  if (!config) {
    throw new Error(`Unknown entity type for quality audit: ${entityType}`);
  }
  return config;
}
