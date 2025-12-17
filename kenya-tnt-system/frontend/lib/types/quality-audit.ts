/**
 * Shared TypeScript types for Quality Audit System
 * Used across Products, Premises, and Facilities
 */

export interface QualityAuditSnapshot {
  id: number;
  reportDate?: string; // Products/Premises
  auditDate?: string; // Facilities
  totalRecords?: number; // Generic field
  totalProducts?: number; // Product-specific
  totalPremises?: number; // Premise-specific
  totalFacilities?: number; // Facility-specific
  dataQualityScore?: number; // Products/Premises
  overallQualityScore?: number; // Facilities
  completenessPercentage?: number;
  triggeredBy?: string;
  notes?: string;
  createdAt: string;
  fullReport?: any;
}

export interface QualityTrendPoint {
  date: string;
  score: number;
}

export interface QualityMetric {
  key: string;
  label: string;
  value: number;
  severity?: 'high' | 'medium' | 'low';
}

export interface QualityAuditConfig {
  entityType: 'product' | 'premise' | 'facility' | 'facilityProd';
  entityDisplayName: string;
  apiBasePath: string;
  syncFrequency: string;
  totalRecordsField: string; // Field name for total records (e.g., 'totalProducts', 'totalPremises')
  dateField: string; // Field name for date (e.g., 'reportDate', 'auditDate')
  scoreField: string; // Field name for score (e.g., 'dataQualityScore', 'overallQualityScore')
}

export const AUDIT_CONFIGS: Record<string, QualityAuditConfig> = {
  product: {
    entityType: 'product',
    entityDisplayName: 'Product',
    apiBasePath: '/api/master-data/products',
    syncFrequency: 'every 3 hours',
    totalRecordsField: 'totalProducts',
    dateField: 'reportDate',
    scoreField: 'dataQualityScore',
  },
  premise: {
    entityType: 'premise',
    entityDisplayName: 'Premise',
    apiBasePath: '/api/master-data/premises',
    syncFrequency: 'every 3 hours',
    totalRecordsField: 'totalPremises',
    dateField: 'reportDate',
    scoreField: 'dataQualityScore',
  },
  facility: {
    entityType: 'facility',
    entityDisplayName: 'Facility (UAT)',
    apiBasePath: '/api/master-data/uat-facilities',
    syncFrequency: 'every 3 hours',
    totalRecordsField: 'totalFacilities',
    dateField: 'auditDate',
    scoreField: 'overallQualityScore',
  },
  facilityProd: {
    entityType: 'facilityProd',
    entityDisplayName: 'Facility (Production)',
    apiBasePath: '/api/master-data/prod-facilities',
    syncFrequency: 'every 3 hours',
    totalRecordsField: 'totalFacilities',
    dateField: 'auditDate',
    scoreField: 'overallQualityScore',
  },
};
