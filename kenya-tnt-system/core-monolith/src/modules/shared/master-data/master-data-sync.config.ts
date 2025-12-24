/**
 * Master Data Sync Configuration
 * Defines sync behavior for each entity type (mirroring quality-alert.config.ts pattern)
 */

export interface MasterDataSyncConfig {
  entity_type: string;
  tableName: string;
  batchSize: number;
  uniqueField: string; // Field to check for existing records
  
  // API source
  apiSource: {
    serviceName: 'PPBApiService' | 'SafaricomHieApiService';
    method: string;
    params?: any;
  };
  
  // Field mappings from API to database
  fieldMappings: Record<string, string | ((apiData: any) => any)>;
  
  // Validation
  requiredFields: string[];
  
  // Sync behavior
  syncFrequency: string;
  enabled: boolean;
  
  // Sync logging (NEW - Phase 3B)
  syncLogging?: {
    enabled: boolean;
    entityTypeLabel: string;
  };
  
  // Incremental sync support (NEW - Phase 3B)
  incrementalSync?: {
    enabled: boolean;
    timestampField: string;
    defaultLookbackMonths: number;
  };
}

export const MASTER_DATA_SYNC_CONFIGS: Record<string, MasterDataSyncConfig> = {
  product: {
    entity_type: 'product',
    tableName: 'ppb_products',
    batchSize: 50,
    uniqueField: 'etcdProductId',
    
    apiSource: {
      serviceName: 'PPBApiService',
      method: 'getAllTerminologyProducts',
      params: null,
    },
    
    fieldMappings: {
      etcdProductId: (api) => api.etcd_product_id || api.id?.toString(),
      category: (api) => extractCategoryFromEtcdId(api.etcd_product_id || api.id?.toString()),
      genericConceptId: 'generic_concept_id',
      genericConceptCode: 'generic_concept_code',
      ppbRegistrationCode: 'ppb_registration_code',
      brandDisplayName: (api) => api.brand_display_name?.trim(),
      genericDisplayName: (api) => api.generic_display_name?.trim(),
      brandName: (api) => api.brand_name?.trim(),
      genericName: (api) => api.generic_name?.trim(),
      gtin: (api) => api.gtin || api.GTIN,
      strengthAmount: 'strength_amount',
      strengthUnit: 'strength_unit',
      routeDescription: 'route_description',
      routeId: 'route_id',
      routeCode: 'route_code',
      formDescription: 'form_description',
      formId: 'form_id',
      formCode: 'form_code',
      activeComponentId: 'active_component_id',
      activeComponentCode: 'active_component_code',
      levelOfUse: 'level_of_use',
      kemlStatus: 'keml_status',
      updationDate: (api) => api.updation_date ? new Date(api.updation_date) : undefined,
      kemlIsOnKeml: (api) => {
        const keml = api.keml || {};
        return keml.is_on_keml || api.keml_status === 'Yes' || false;
      },
      kemlCategory: (api) => {
        const keml = api.keml || {};
        return keml.keml_category || api.keml_category;
      },
      kemlDrugClass: (api) => {
        const keml = api.keml || {};
        return keml.drug_class || api.keml_drug_class;
      },
      formularyIncluded: (api) => api.formulary_included || false,
      programsMapping: (api) => {
        const programsMapping: any[] = [];
        if (api.programs_mapping && Array.isArray(api.programs_mapping)) {
          for (const program of api.programs_mapping) {
            if (program.code || program.name) {
              programsMapping.push({
                code: program.code,
                name: program.name,
              });
            }
          }
        }
        return programsMapping;
      },
      manufacturers: (api) => {
        const manufacturers: any[] = [];
        if (api.manufacturers && Array.isArray(api.manufacturers)) {
          for (const manufacturer of api.manufacturers) {
            if (manufacturer.entityId || manufacturer.name) {
              manufacturers.push({
                entity_id: manufacturer.entityId,
                name: manufacturer.name,
              });
            }
          }
        }
        return manufacturers;
      },
      ppbLastModified: (api) => api.updation_date ? new Date(api.updation_date) : undefined,
    },
    
    requiredFields: ['etcd_product_id'],
    syncFrequency: 'every 3 hours',
    enabled: true,
    
    syncLogging: {
      enabled: true,
      entityTypeLabel: 'Product',
    },
  },
  
  premise: {
    entity_type: 'premise',
    tableName: 'premises',
    batchSize: 50,
    uniqueField: 'legacyPremiseId',
    
    apiSource: {
      serviceName: 'PPBApiService',
      method: 'getAllPremisesFromCatalogue',
      params: null,
    },
    
    fieldMappings: {
      premiseId: (api) => `PREMISE-${api.premiseid}`,
      legacyPremiseId: 'premiseid',
      premiseName: (api) => api.premisename?.trim() || 'Unknown Premise',
      gln: 'gln',
      businessType: 'businesstype',
      ownership: 'ownership',
      superintendentName: 'superintendentname',
      superintendentCadre: 'superintendentcadre',
      superintendentRegistrationNumber: 'superintendentregistrationno',
      licenseValidUntil: (api) => {
        if (api.licensevalidity) {
          try {
            return new Date(api.licensevalidity);
          } catch (error) {
            return undefined;
          }
        }
        return undefined;
      },
      licenseValidityYear: 'validityyear',
      county: 'county',
      constituency: 'constituency',
      ward: 'ward',
      supplierId: () => 1, // Default to supplier ID 1
    },
    
    requiredFields: ['premiseid', 'premisename'],
    syncFrequency: 'every 3 hours',
    enabled: true,
    
    syncLogging: {
      enabled: true,
      entityTypeLabel: 'Premise',
    },
  },
  
  facility: {
    entity_type: 'facility',
    tableName: 'uat_facilities',
    batchSize: 50,
    uniqueField: 'facilityCode',
    
    apiSource: {
      serviceName: 'SafaricomHieApiService',
      method: 'getFacilities',
      params: null,
    },
    
    fieldMappings: {
      // Facility Code: Try primary identifiers with fallback generation
      facilityCode: (api) => {
        if (api.frCode) return api.frCode;
        if (api.fidCode) return api.fidCode;
        if (api.uuid) return api.uuid;
        if (api.registrationNumber) return `FR-${api.registrationNumber}`;
        return `FR-NULL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      },
      
      // Basic identifiers - DIRECT string values
      mflCode: (api) => api.registrationNumber,
      kmhflCode: (api) => api.kmhflCode,
      facilityName: (api) => api.officialName || api.registrationNumber,
      facilityType: (api) => api.facilityType, // Direct string, NOT nested object
      ownership: (api) => api.facilityOwnership, // Direct string, NOT nested object
      
      // Location fields - from address object (NULL in UAT, populated in Production)
      county: (api) => api.address?.county || null,
      subCounty: (api) => api.address?.subCounty || null,
      constituency: (api) => api.address?.constituency || null,
      ward: (api) => api.address?.ward || null,
      town: (api) => api.address?.town || null,
      addressLine1: (api) => api.address?.physicalLocation || api.address?.postalAddress || null,
      addressLine2: (api) => null, // Not provided in API
      postalCode: (api) => api.address?.postalAddress || null,
      
      // Coordinates - from address object
      latitude: (api) => {
        if (api.address?.latitude) {
          const lat = parseFloat(api.address.latitude);
          return isNaN(lat) ? null : lat;
        }
        return null;
      },
      longitude: (api) => {
        if (api.address?.longitude) {
          const lon = parseFloat(api.address.longitude);
          return isNaN(lon) ? null : lon;
        }
        return null;
      },
      
      // Contact information
      phoneNumber: (api) => api.facilityPhoneNumber,
      email: (api) => api.facilityEmail,
      
      // New fields from API
      kephLevel: (api) => api.kephLevel,
      pcnCode: (api) => api.pcnCode,
      isHub: (api) => api.isHub || false,
      facilityAgent: (api) => api.facilityAgent,
      licenseNumber: (api) => api.licenseNumber,
      regulatoryBody: (api) => api.regulatoryBody,
      shaContractStatus: (api) => api.shaContractStatus,
      
      // GS1 identifier - not provided by API
      gln: () => null,
      
      // Operational status
      operationalStatus: (api) => api.SHAOperationStatus?.operationalStatus || api.regulatoryOperationalStatus,
      licenseStatus: (api) => api.facilityLicenseStatus,
      licenseValidUntil: (api) => {
        const endDate = api.facilityLicenseEndDate;
        if (endDate) {
          try {
            return new Date(endDate);
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      
      // Services - native array for PostgreSQL
      servicesOffered: (api) => {
        if (api.shaContractedServices && Array.isArray(api.shaContractedServices) && api.shaContractedServices.length > 0) {
          return api.shaContractedServices.map(s => 
            typeof s === 'object' ? (s.name || s.serviceName || JSON.stringify(s)) : String(s)
          );
        }
        if (api.approvedServices && Array.isArray(api.approvedServices) && api.approvedServices.length > 0) {
          return api.approvedServices.map(s => 
            typeof s === 'object' ? (s.name || s.serviceName || JSON.stringify(s)) : String(s)
          );
        }
        return null;
      },
      
      // Bed capacity - single value (detailed breakdown stored in separate table)
      bedsCapacity: (api) => api.bedOccupancy?.totalBeds || 0,
      
      // System fields
      isEnabled: () => true,
    },
    
    requiredFields: ['facilityCode', 'facilityName'], // Fixed: was ['code', 'name']
    syncFrequency: 'every 3 hours',
    enabled: true,
    
    syncLogging: {
      enabled: true,
      entityTypeLabel: 'Facility (UAT)',
    },
    
    incrementalSync: {
      enabled: true,
      timestampField: 'lastSyncedAt',
      defaultLookbackMonths: 6,
    },
  },
  
  facility_prod: {
    entity_type: 'facility_prod',
    tableName: 'prod_facilities',
    batchSize: 50,
    uniqueField: 'facilityCode',
    
    apiSource: {
      serviceName: 'SafaricomHieApiService',
      method: 'getProdFacilities',
      params: null,
    },
    
    fieldMappings: {
      // PRODUCTION API: Same structure as UAT, but address object is populated
      // Facility Code: Try primary identifiers with fallback
      facilityCode: (api) => {
        if (api.frCode) return api.frCode;
        if (api.fidCode) return api.fidCode;
        if (api.uuid) return api.uuid;
        if (api.registrationNumber) return `FR-${api.registrationNumber}`;
        return `FR-PROD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      },
      
      // Basic identifiers - DIRECT string values (same as UAT)
      mflCode: (api) => api.registrationNumber,
      kmhflCode: (api) => api.kmhflCode,
      facilityName: (api) => api.officialName || api.registrationNumber,
      facilityType: (api) => api.facilityType, // Direct string
      ownership: (api) => api.facilityOwnership, // Direct string
      
      // Location fields - from address object (POPULATED in Production!)
      county: (api) => api.address?.county || null,
      subCounty: (api) => api.address?.subCounty || null,
      constituency: (api) => api.address?.constituency || null,
      ward: (api) => api.address?.ward || null,
      town: (api) => api.address?.town || null,
      addressLine1: (api) => api.address?.physicalLocation || api.address?.postalAddress || null,
      addressLine2: (api) => null,
      postalCode: (api) => api.address?.postalAddress || null,
      
      // Coordinates - from address object (POPULATED in Production!)
      latitude: (api) => {
        if (api.address?.latitude) {
          const lat = parseFloat(api.address.latitude);
          return isNaN(lat) ? null : lat;
        }
        return null;
      },
      longitude: (api) => {
        if (api.address?.longitude) {
          const lon = parseFloat(api.address.longitude);
          return isNaN(lon) ? null : lon;
        }
        return null;
      },
      
      // Contact information
      phoneNumber: (api) => api.facilityPhoneNumber,
      email: (api) => api.facilityEmail,
      
      // New fields from API
      kephLevel: (api) => api.kephLevel,
      pcnCode: (api) => api.pcnCode,
      isHub: (api) => api.isHub || false,
      facilityAgent: (api) => api.facilityAgent,
      licenseNumber: (api) => api.licenseNumber,
      regulatoryBody: (api) => api.regulatoryBody,
      shaContractStatus: (api) => api.shaContractStatus,
      
      // GS1 identifier - not provided by API
      gln: () => null,
      
      // Operational status
      operationalStatus: (api) => api.SHAOperationStatus?.operationalStatus || api.regulatoryOperationalStatus,
      licenseStatus: (api) => api.facilityLicenseStatus,
      licenseValidUntil: (api) => {
        const endDate = api.facilityLicenseEndDate;
        if (endDate) {
          try {
            return new Date(endDate);
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      
      // Services - native array for PostgreSQL
      servicesOffered: (api) => {
        if (api.shaContractedServices && Array.isArray(api.shaContractedServices) && api.shaContractedServices.length > 0) {
          return api.shaContractedServices.map(s => 
            typeof s === 'object' ? (s.name || s.serviceName || JSON.stringify(s)) : String(s)
          );
        }
        if (api.approvedServices && Array.isArray(api.approvedServices) && api.approvedServices.length > 0) {
          return api.approvedServices.map(s => 
            typeof s === 'object' ? (s.name || s.serviceName || JSON.stringify(s)) : String(s)
          );
        }
        return null;
      },
      
      // Bed capacity
      bedsCapacity: (api) => api.bedOccupancy?.totalBeds || 0,
      
      // System fields
      isEnabled: () => true,
    },
    
    requiredFields: ['facilityCode', 'facilityName'], // Fixed: was ['code', 'name']
    syncFrequency: 'every 3 hours',
    enabled: true,
    
    syncLogging: {
      enabled: true,
      entityTypeLabel: 'Facility (Production)',
    },
    
    incrementalSync: {
      enabled: true,
      timestampField: 'lastSyncedAt',
      defaultLookbackMonths: 6,
    },
  },
};

// Helper functions (like getAlertSeverity in quality-alert.config.ts)
export function getSyncConfig(entity_type: string): MasterDataSyncConfig {
  const config = MASTER_DATA_SYNC_CONFIGS[entityType];
  if (!config) {
    throw new Error(`Unknown entity type for sync: ${entityType}`);
  }
  return config;
}

function extractCategoryFromEtcdId(etcdProductId: string | undefined): string | undefined {
  if (!etcdProductId || etcdProductId.length < 2) {
    return undefined;
  }
  
  const prefix = etcdProductId.substring(0, 2).toUpperCase();
  const mapping: Record<string, string> = { 
    'PH': 'medicine', 
    'FS': 'supplement', 
    'MD': 'medical_device', 
    'CO': 'cosmetic' 
  };
  return mapping[prefix];
}
