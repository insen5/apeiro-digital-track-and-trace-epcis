/**
 * Shared Quality Audit API Client
 * Centralized functions for Product, Premise, and Facility quality audits
 */

import { apiClient } from './client';
import { QualityAuditSnapshot, QualityTrendPoint } from '../types/quality-audit';

export interface CreateAuditParams {
  triggeredBy?: string;
  notes?: string;
}

export interface QualityAuditApiMethods {
  // Get current quality report
  getReport: () => Promise<any>;
  
  // Create new audit snapshot
  createAudit: (params: CreateAuditParams) => Promise<QualityAuditSnapshot>;
  
  // Get audit history
  getHistory: (limit?: number) => Promise<QualityAuditSnapshot[]>;
  
  // Get specific audit by ID
  getById: (id: number) => Promise<QualityAuditSnapshot>;
  
  // Get quality trend
  getTrend: (days?: number) => Promise<QualityTrendPoint[]>;
}

/**
 * Creates quality audit API methods for a given entity type
 * @param basePath - Base API path (e.g., '/master-data/products')
 */
export function createQualityAuditApi(basePath: string): QualityAuditApiMethods {
  return {
    getReport: () => apiClient.get(`${basePath}/data-quality-report`),
    
    createAudit: (params: CreateAuditParams = {}) => {
      const queryParams = new URLSearchParams();
      if (params.triggeredBy) queryParams.append('triggeredBy', params.triggeredBy);
      if (params.notes) queryParams.append('notes', params.notes);
      
      const url = `${basePath}/quality-audit${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return apiClient.post(url);
    },
    
    getHistory: (limit = 50) => 
      apiClient.get(`${basePath}/quality-history?limit=${limit}`),
    
    getById: (id: number) => 
      apiClient.get(`${basePath}/quality-history/${id}`),
    
    getTrend: (days = 30) => 
      apiClient.get(`${basePath}/quality-trend?days=${days}`),
  };
}

// Pre-configured instances for each entity type
export const productQualityAudit = createQualityAuditApi('/master-data/products');
export const premiseQualityAudit = createQualityAuditApi('/master-data/premises');
export const facilityQualityAudit = createQualityAuditApi('/master-data/uat-facilities');
export const facilityProdQualityAudit = createQualityAuditApi('/master-data/prod-facilities');

/**
 * Get quality audit API for any entity type
 */
export function getQualityAuditApi(entityType: 'product' | 'premise' | 'facility' | 'facilityProd'): QualityAuditApiMethods {
  switch (entityType) {
    case 'product':
      return productQualityAudit;
    case 'premise':
      return premiseQualityAudit;
    case 'facility':
      return facilityQualityAudit;
    case 'facilityProd':
      return facilityProdQualityAudit;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
