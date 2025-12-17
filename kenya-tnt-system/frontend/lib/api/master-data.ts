import { apiClient } from './client';

export interface Supplier {
  id: number;
  entityId: string;
  legalEntityName: string;
  actorType: string;
  roles?: string[];
  ownershipType?: string;
  ppbLicenseNumber?: string;
  ppbCode?: string;
  gs1Prefix?: string;
  legalEntityGLN?: string;
  hqName?: string;
  hqGLN?: string;
  hqAddressLine1?: string;
  hqCounty?: string;
  hqCountry: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
}

export interface Premise {
  id: number;
  supplierId: number;
  premiseId: string;
  legacyPremiseId?: number; // PPB original premise ID
  premiseName: string;
  gln?: string; // GLN not provided by PPB API - will be null/undefined
  businessType?: string;
  premiseClassification?: string;
  ownership?: string;
  superintendentName?: string;
  superintendentCadre?: string;
  superintendentRegistrationNumber?: number;
  licenseValidUntil?: string;
  licenseValidityYear?: number;
  licenseStatus?: string;
  addressLine1?: string;
  addressLine2?: string;
  county?: string;
  constituency?: string;
  ward?: string;
  postalCode?: string;
  country: string;
  status: string;
  lastUpdated?: string;
  supplier?: Supplier;
}

export interface LogisticsProvider {
  id: number;
  lspId: string;
  name: string;
  registrationNumber?: string;
  permitId?: string;
  licenseExpiryDate?: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
  hqAddressLine?: string;
  hqCity?: string;
  hqCounty?: string;
  hqCountry: string;
  gln?: string;
  gs1Prefix?: string;
  ppbCode?: string;
}

export interface UatFacility {
  id: number;
  facilityCode: string;
  mflCode?: string;
  kmhflCode?: string;
  facilityName: string;
  facilityType?: string;
  ownership?: string;
  county?: string;
  subCounty?: string;
  constituency?: string;
  ward?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  gln?: string; // NULL from API - manual assignment
  operationalStatus?: string;
  licenseStatus?: string;
  licenseValidUntil?: string;
  servicesOffered?: string[];
  bedsCapacity?: number;
  latitude?: number;
  longitude?: number;
  isEnabled: boolean;
  lastSyncedAt: string;
}

export interface ProdFacility {
  id: number;
  facilityCode: string;
  mflCode?: string;
  kmhflCode?: string;
  facilityName: string;
  facilityType?: string;
  ownership?: string;
  county?: string;
  subCounty?: string;
  constituency?: string;
  ward?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  gln?: string; // NULL from API - manual assignment
  operationalStatus?: string;
  licenseStatus?: string;
  licenseValidUntil?: string;
  servicesOffered?: string[];
  bedsCapacity?: number;
  latitude?: number;
  longitude?: number;
  isEnabled: boolean;
  lastSyncedAt: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
}

export interface PremisesResponse {
  premises: Premise[];
  total: number;
  page: number;
  limit: number;
}

export interface LogisticsProvidersResponse {
  logisticsProviders: LogisticsProvider[];
  total: number;
  page: number;
  limit: number;
}

export interface UatFacilitiesResponse {
  facilities: UatFacility[];
  total: number;
  page: number;
  limit: number;
}

export interface ProdFacilitiesResponse {
  facilities: ProdFacility[];
  total: number;
  page: number;
  limit: number;
}

export interface Practitioner {
  id: number;
  practitionerId?: string;
  registrationNumber: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName: string;
  cadre?: string;
  qualification?: string;
  specialization?: string;
  licenseNumber?: string;
  licenseStatus?: string;
  licenseValidFrom?: string;
  licenseValidUntil?: string;
  licenseValidityYear?: number;
  email?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  county?: string;
  subCounty?: string;
  constituency?: string;
  ward?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  practiceType?: string;
  employerName?: string;
  facilityName?: string;
  facilityMflCode?: string;
  regulatoryBody?: string;
  councilRegistrationDate?: string;
  status: string;
  isEnabled: boolean;
  lastSyncedAt?: string;
}

export interface PractitionersResponse {
  practitioners: Practitioner[];
  total: number;
  page: number;
  limit: number;
}

export interface PractitionerStats {
  total: number;
  byCadre: Record<string, number>;
  byCounty: Record<string, number>;
  byLicenseStatus: Record<string, number>;
  lastSync: string | null;
}

export interface PractitionerQualityReport {
  overview: {
    totalPractitioners: number;
    lastSyncDate: string | null;
    dataQualityScore: number;
  };
  completeness: {
    missingEmail: number;
    missingPhone: number;
    missingCounty: number;
    missingCadre: number;
    missingLicenseInfo: number;
    missingFacility: number;
    missingAddress: number;
    completeRecords: number;
    completenessPercentage: number;
  };
  validity: {
    expiredLicenses: number;
    expiringSoon: number;
    validLicenses: number;
    duplicateRegistrationNumbers: number;
    invalidEmail: number;
  };
  distribution: {
    byCadre: { cadre: string; count: number; percentage: number }[];
    byCounty: { county: string; count: number; percentage: number }[];
    byLicenseStatus: { status: string; count: number; percentage: number }[];
  };
  scores: {
    completeness: number;
    validity: number;
    overall: number;
  };
}

export interface PractitionerQualitySnapshot {
  id: number;
  reportDate: string;
  totalPractitioners: number;
  dataQualityScore: number;
  completenessPercentage: number;
  triggeredBy: string;
  notes?: string;
  fullReport: PractitionerQualityReport;
}

export interface PractitionerQualityTrend {
  date: string;
  score: number;
}

export interface PremiseStats {
  total: number;
  lastSynced: string | null;
  byCounty: { county: string; count: number }[];
}

export interface UatFacilityStats {
  total: number;
  byType: Record<string, number>;
  byOwnership: Record<string, number>;
  byCounty: Record<string, number>;
  byKephLevel: Record<string, number>;
  operational: number;
  nonOperational: number;
  withGLN: number;
  withoutGLN: number;
  lastSync: string;
}

export interface ProdFacilityStats {
  total: number;
  byType: Record<string, number>;
  byOwnership: Record<string, number>;
  byCounty: Record<string, number>;
  byKephLevel: Record<string, number>;
  operational: number;
  nonOperational: number;
  withGLN: number;
  withoutGLN: number;
  lastSync: string;
}

export interface UatFacilityFilterOptions {
  counties: string[];
  facilityTypes: string[];
  ownerships: string[];
}

export interface DataQualityReport {
  overview: {
    totalPremises: number;
    lastSyncDate: string | null;
    dataQualityScore: number;
  };
  completeness: {
    missingGLN: number;
    missingCounty: number;
    missingBusinessType: number;
    missingOwnership: number;
    missingSuperintendent: number;
    missingLicenseInfo: number;
    missingLocation: number;
    completeRecords: number;
    completenessPercentage: number;
  };
  validity: {
    expiredLicenses: number;
    expiringSoon: number;
    validLicenses: number;
    invalidDates: number;
    duplicatePremiseIds: number;
    invalidGLN: number;
  };
  distribution: {
    byCounty: { county: string; count: number; percentage: number }[];
    byBusinessType: { type: string; count: number; percentage: number }[];
    byOwnership: { ownership: string; count: number; percentage: number }[];
    bySuperintendentCadre: { cadre: string; count: number; percentage: number }[];
  };
  issues: {
    severity: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    count: number;
  }[];
  recommendations: string[];
}

export interface FilterOptions {
  businessTypes: string[];
  constituencies: string[];
  wards: string[];
}

export interface QualityReportSnapshot {
  id: number;
  reportDate: string;
  totalPremises: number;
  dataQualityScore: number;
  completenessPercentage: number;
  triggeredBy: string;
  notes?: string;
  fullReport: DataQualityReport;
}

export interface QualityTrend {
  date: string;
  score: number;
}

export const masterDataApi = {
  suppliers: {
    getAll: (page?: number, limit?: number, search?: string) =>
      apiClient.get<SuppliersResponse>(
        `/master-data/suppliers?${new URLSearchParams({
          ...(page && { page: String(page) }),
          ...(limit && { limit: String(limit) }),
          ...(search && { search }),
        }).toString()}`
      ),
    getById: (id: number) =>
      apiClient.get<Supplier>(`/master-data/suppliers/${id}`),
  },
  premises: {
    getAll: (
      page?: number, 
      limit?: number, 
      search?: string, 
      supplierId?: number,
      businessType?: string,
      constituency?: string,
      ward?: string
    ) =>
      apiClient.get<PremisesResponse>(
        `/master-data/premises?${new URLSearchParams({
          ...(page && { page: String(page) }),
          ...(limit && { limit: String(limit) }),
          ...(search && { search }),
          ...(supplierId && { supplierId: String(supplierId) }),
          ...(businessType && { businessType }),
          ...(constituency && { constituency }),
          ...(ward && { ward }),
        }).toString()}`
      ),
    getById: (id: number) =>
      apiClient.get<Premise>(`/master-data/premises/${id}`),
    getFilterOptions: () =>
      apiClient.get<FilterOptions>('/master-data/premises/filter-options'),
    getStats: () =>
      apiClient.get<PremiseStats>('/master-data/premises/stats'),
    getDataQualityReport: () =>
      apiClient.get<DataQualityReport>('/master-data/premises/data-quality-report'),
    syncCatalog: (email?: string, password?: string) =>
      apiClient.post<{
        inserted: number;
        updated: number;
        errors: number;
        total: number;
      }>(
        `/master-data/premises/sync?${new URLSearchParams({
          ...(email && { email }),
          ...(password && { password }),
        }).toString()}`
      ),
    saveQualityAudit: (triggeredBy?: string, notes?: string) =>
      apiClient.post<QualityReportSnapshot>(
        `/master-data/premises/quality-audit?${new URLSearchParams({
          ...(triggeredBy && { triggeredBy }),
          ...(notes && { notes }),
        }).toString()}`
      ),
    getQualityHistory: (limit?: number) =>
      apiClient.get<QualityReportSnapshot[]>(
        `/master-data/premises/quality-history?${new URLSearchParams({
          ...(limit && { limit: String(limit) }),
        }).toString()}`
      ),
    getQualityHistoryById: (id: number) =>
      apiClient.get<QualityReportSnapshot>(`/master-data/premises/quality-history/${id}`),
    getQualityTrend: (days?: number) =>
      apiClient.get<QualityTrend[]>(
        `/master-data/premises/quality-trend?${new URLSearchParams({
          ...(days && { days: String(days) }),
        }).toString()}`
      ),
  },
  logisticsProviders: {
    getAll: (page?: number, limit?: number, search?: string) =>
      apiClient.get<LogisticsProvidersResponse>(
        `/master-data/logistics-providers?${new URLSearchParams({
          ...(page && { page: String(page) }),
          ...(limit && { limit: String(limit) }),
          ...(search && { search }),
        }).toString()}`
      ),
    getById: (id: number) =>
      apiClient.get<LogisticsProvider>(`/master-data/logistics-providers/${id}`),
  },
  uatFacilities: {
    getAll: (
      page?: number,
      limit?: number,
      search?: string,
      county?: string,
      facilityType?: string,
      ownership?: string
    ) =>
      apiClient.get<UatFacilitiesResponse>(
        `/master-data/uat-facilities?${new URLSearchParams({
          ...(page && { page: String(page) }),
          ...(limit && { limit: String(limit) }),
          ...(search && { search }),
          ...(county && { county }),
          ...(facilityType && { facilityType }),
          ...(ownership && { ownership }),
        }).toString()}`
      ),
    getStats: () =>
      apiClient.get<UatFacilityStats>('/master-data/uat-facilities/stats'),
    getDataQualityReport: () =>
      apiClient.get<any>('/master-data/uat-facilities/data-quality-report'),
    syncCatalog: () =>
      apiClient.post<{
        success: boolean;
        inserted: number;
        updated: number;
        errors: number;
        total: number;
        lastSyncedAt: string;
      }>('/master-data/uat-facilities/sync'),
  },
  prodFacilities: {
    getAll: (
      page?: number,
      limit?: number,
      search?: string,
      county?: string,
      facilityType?: string,
      ownership?: string,
      kephLevel?: string
    ) =>
      apiClient.get<ProdFacilitiesResponse>(
        `/master-data/prod-facilities?${new URLSearchParams({
          ...(page && { page: String(page) }),
          ...(limit && { limit: String(limit) }),
          ...(search && { search }),
          ...(county && { county }),
          ...(facilityType && { facilityType }),
          ...(ownership && { ownership }),
          ...(kephLevel && { kephLevel }),
        }).toString()}`
      ),
    getStats: () =>
      apiClient.get<ProdFacilityStats>('/master-data/prod-facilities/stats'),
    getDataQualityReport: () =>
      apiClient.get<any>('/master-data/prod-facilities/data-quality-report'),
    syncCatalog: () =>
      apiClient.post<{
        success: boolean;
        inserted: number;
        updated: number;
        errors: number;
        total: number;
        lastSyncedAt: string;
      }>('/master-data/prod-facilities/sync'),
  },
  practitioners: {
    getAll: (
      page?: number,
      limit?: number,
      search?: string,
      cadre?: string,
      county?: string,
      licenseStatus?: string
    ) =>
      apiClient.get<PractitionersResponse>(
        `/master-data/practitioners?${new URLSearchParams({
          ...(page && { page: String(page) }),
          ...(limit && { limit: String(limit) }),
          ...(search && { search }),
          ...(cadre && { cadre }),
          ...(county && { county }),
          ...(licenseStatus && { licenseStatus }),
        }).toString()}`
      ),
    getById: (id: number) =>
      apiClient.get<Practitioner>(`/master-data/practitioners/${id}`),
    getStats: () =>
      apiClient.get<PractitionerStats>('/master-data/practitioners/stats'),
    syncCatalog: (email?: string, password?: string) =>
      apiClient.post<{
        inserted: number;
        updated: number;
        errors: number;
        total: number;
      }>(
        `/master-data/practitioners/sync?${new URLSearchParams({
          ...(email && { email }),
          ...(password && { password }),
        }).toString()}`
      ),
    getDataQualityReport: () =>
      apiClient.get<PractitionerQualityReport>('/master-data/practitioners/data-quality-report'),
    saveQualityAudit: (triggeredBy?: string, notes?: string) =>
      apiClient.post<PractitionerQualitySnapshot>(
        `/master-data/practitioners/quality-audit?${new URLSearchParams({
          ...(triggeredBy && { triggeredBy }),
          ...(notes && { notes }),
        }).toString()}`
      ),
    getQualityHistory: (limit?: number) =>
      apiClient.get<PractitionerQualitySnapshot[]>(
        `/master-data/practitioners/quality-history?${new URLSearchParams({
          ...(limit && { limit: String(limit) }),
        }).toString()}`
      ),
    getQualityHistoryById: (id: number) =>
      apiClient.get<PractitionerQualitySnapshot>(`/master-data/practitioners/quality-history/${id}`),
    getQualityTrend: (days?: number) =>
      apiClient.get<PractitionerQualityTrend[]>(
        `/master-data/practitioners/quality-trend?${new URLSearchParams({
          ...(days && { days: String(days) }),
        }).toString()}`
      ),
  },
};

