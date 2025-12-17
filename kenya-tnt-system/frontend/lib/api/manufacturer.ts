import { apiClient } from './client';

// Types
export interface Batch {
  id: number;
  productId: number;
  batchno: string;
  expiry: string;
  qty: number;
  sentQty: number;
  isEnabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchDto {
  productId: number;
  batchno?: string;
  expiry: string;
  qty: number;
}

export interface Case {
  id: number;
  label: string;
  packageId: number;
  userId: string;
  eventId?: string;
  isDispatched: boolean;
  ssccBarcode?: string;
  ssccGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseProductDto {
  productId: number;
  batchId: number;
  qty: number;
}

export interface CreateCaseDto {
  label: string;
  products: CaseProductDto[];
}

export interface Package {
  id: number;
  label: string;
  shipmentId: number;
  userId: string;
  eventId?: string;
  isDispatched: boolean;
  ssccBarcode?: string;
  ssccGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageDto {
  label: string;
  caseIds: number[];
}

export interface Shipment {
  id: number;
  customer: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  pickupLocation: string;
  destinationAddress: string;
  carrier: string;
  userId: string;
  customerId?: string;
  isDispatched: boolean;
  ssccBarcode: string;
  eventId?: string;
  parentSsccBarcode?: string;
  receiveEventId?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  // Master Data References (preferred)
  supplierId?: number;
  premiseId?: number;
  logisticsProviderId?: number;
  
  // Legacy fields (for backward compatibility)
  customer?: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  pickupLocation?: string;
  destinationAddress?: string;
  carrier?: string;
  customerId?: string;
  packageIds: number[];
  ssccBarcode?: string; // Optional - auto-generated if not provided
}

export interface PPBBatchDetail {
  id: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  sentQuantity: number;
  serialNumberCount: number;
  product: {
    id: number;
    gtin: string;
    brandName: string;
    brandDisplayName: string;
    strengthAmount?: string;
    strengthUnit?: string;
    formDescription?: string;
    ppbRegistrationCode?: string;
  } | null;
}

export interface SSCCHierarchy {
  shipmentSSCC: string;
  packages: Array<{
    packageSSCC: string;
    cases: Array<{
      caseSSCC: string;
      batches: Array<{
        batchNumber: string;
        batchId: number;
        gtin: string;
        productName: string;
        quantity: number;
      }>;
    }>;
  }>;
}

export interface PPBConsignment {
  id: number;
  eventID: string;
  eventType: string;
  eventTimestamp: string;
  sourceSystem: string;
  destinationSystem: string;
  consignmentID: string;
  registrationNo: string;
  manufacturerPPBID: string;
  manufacturerGLN?: string;
  MAHPPBID: string;
  MAHGLN?: string;
  importerPartyName?: string;
  importerPartyGLN?: string;
  importerPartyCountry?: string;
  destinationPartyName?: string;
  destinationPartyGLN?: string;
  destinationLocationLabel?: string;
  shipmentDate: string;
  countryOfOrigin: string;
  destinationCountry: string;
  totalQuantity: number;
  // Summary counts
  batchCount: number;
  productCount: number;
  gtinCount: number;
  uniqueGTINs: string[];
  serialNumberCount: number;
  shipmentSSCCCount: number;
  packageSSCCCount: number;
  caseSSCCCount: number;
  // Full SSCC hierarchy with parent-child relationships
  ssccHierarchy?: SSCCHierarchy[];
  // Full batch details (unified PPB data)
  batches: PPBBatchDetail[];
  createdAt: string;
}

// API Functions
export const manufacturerApi = {
  // Batches
  batches: {
    create: (data: CreateBatchDto) =>
      apiClient.post<Batch>('/manufacturer/batches', data),
    getAll: () => apiClient.get<Batch[]>('/manufacturer/batches'),
    getById: (id: number) => apiClient.get<Batch>(`/manufacturer/batches/${id}`),
  },

  // Cases
  cases: {
    create: (data: CreateCaseDto) =>
      apiClient.post<Case>('/manufacturer/cases', data),
    getAll: () => apiClient.get<Case[]>('/manufacturer/cases'),
    getById: (id: number) => apiClient.get<Case>(`/manufacturer/cases/${id}`),
    assignSSCC: (id: number, sscc?: string) =>
      apiClient.put<Case>(`/manufacturer/cases/${id}/assign-sscc`, { sscc }),
  },

  // Packages
  packages: {
    create: (data: CreatePackageDto) =>
      apiClient.post<Package>('/manufacturer/packages', data),
    getAll: () => apiClient.get<Package[]>('/manufacturer/packages'),
    getById: (id: number) => apiClient.get<Package>(`/manufacturer/packages/${id}`),
    assignSSCC: (id: number, sscc?: string) =>
      apiClient.put<Package>(`/manufacturer/packages/${id}/assign-sscc`, { sscc }),
  },

  // Shipments
  shipments: {
    create: (data: CreateShipmentDto) =>
      apiClient.post<Shipment>('/manufacturer/shipments', data),
    getAll: () => apiClient.get<Shipment[]>('/manufacturer/shipments'),
    getById: (id: number) => apiClient.get<Shipment>(`/manufacturer/shipments/${id}`),
    dispatch: (id: number) =>
      apiClient.post<Shipment>(`/manufacturer/shipments/${id}/dispatch`),
  },

  // Consignments (PPB - Query Only, Import is regulator-only)
  consignments: {
    getAll: () => apiClient.get<PPBConsignment[]>('/manufacturer/consignments'),
    getById: (id: number) =>
      apiClient.get<PPBConsignment>(`/manufacturer/consignments/${id}`),
  },

  // DEPRECATED: PPB Approved Batches - Use consignments endpoint instead
  // All PPB data (including batches) is now in consignments.batches array
  // This endpoint will be removed in a future version
  ppbBatches: {
    getAll: (page?: number, limit?: number, search?: string) => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);
      return apiClient.get<{ batches: any[]; total: number; page: number; limit: number }>(
        `/manufacturer/ppb-batches?${params.toString()}`,
      );
    },
    getById: (id: number) => apiClient.get<any>(`/manufacturer/ppb-batches/${id}`),
  },
};

