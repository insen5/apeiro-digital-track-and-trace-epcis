import { apiClient } from './client';

// Types
export interface ProductProgram {
  id: number;
  programCode: string;
  programName: string;
}

export interface ProductManufacturer {
  id: number;
  manufacturerEntityId: string;
  manufacturerName: string;
}

export interface Product {
  id: number;
  etcdProductId?: string;
  genericConceptId?: number;
  genericConceptCode?: string;
  ppbRegistrationCode?: string;
  productName?: string; // Optional - use brandDisplayName or genericDisplayName instead
  brandDisplayName?: string;
  genericDisplayName?: string;
  brandName: string;
  genericName?: string;
  gtin: string | null; // Can be null
  strengthAmount?: string;
  strengthUnit?: string;
  routeDescription?: string;
  routeId?: number;
  routeCode?: string;
  formDescription?: string;
  formId?: number;
  formCode?: string;
  activeComponentId?: number;
  activeComponentCode?: string;
  levelOfUse?: string;
  kemlStatus?: string;
  updationDate?: string;
  kemlIsOnKeml: boolean;
  kemlCategory?: string;
  kemlDrugClass?: string;
  formularyIncluded: boolean;
  category?: 'medicine' | 'supplement' | 'medical_device' | 'cosmetic';
  userId?: string; // Optional - may not be present in API response
  isEnabled?: boolean; // Optional - default to true if not present
  programs?: ProductProgram[];
  manufacturers?: ProductManufacturer[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  productName: string;
  brandName: string;
  gtin: string;
}

export interface Journey {
  sscc: string;
  events: JourneyEvent[];
  manufacturer?: any;
  distributor?: any;
  facility?: any;
}

export interface JourneyEvent {
  eventId: string;
  eventType: string;
  bizStep: string;
  eventTime: string;
  location?: string;
}

// Shipment response structure
export interface ShipmentJourney {
  id: number;
  customer: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  pickupLocation: string;
  destinationAddress: string;
  carrier: string;
  userId: string;
  customerId: string | null;
  isDispatched: boolean;
  ssccBarcode: string;
  eventId: string | null;
  parentSsccBarcode: string | null;
  receiveEventId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    organization: string;
    glnNumber: string;
  };
  packages: Array<{
    id: number;
    label: string;
    shipmentId: number;
    userId: string;
    isDispatched: boolean;
    cases: Array<{
      id: number;
      label: string;
      packageId: number;
      userId: string;
      isDispatched: boolean;
      products: Array<{
        id: number;
        caseId: number;
        productId: number;
        batchId: number;
        qty: string;
        fromNumber: number;
        count: number;
        batch: {
          id: number;
          productId: number;
          batchno: string;
          expiry: string;
          qty: string;
          sentQty: string;
          product: {
            id: number;
            productName: string;
            brandName: string;
            gtin: string;
          };
        };
        product: {
          id: number;
          productName: string;
          brandName: string;
          gtin: string;
        };
      }>;
    }>;
  }>;
}

export interface RecallRequest {
  id: number;
  batchId: number;
  reason: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  transporter: string;
  pickupLocation: string;
  pickupDate: string;
  deliveryLocation: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecallDto {
  batchId: number;
  reason: string;
  transporter: string;
  pickupLocation: string;
  pickupDate: string;
  deliveryLocation: string;
  deliveryDate: string;
}

export interface Analytics {
  totalProducts: number;
  totalBatches: number;
  totalShipments: number;
  activeRecalls: number;
  expiredBatches: number;
  shipmentsByStatus: Record<string, number>;
}

export interface PPBBatch {
  id: number;
  gtin: string;
  product_name: string;
  product_code: string;
  batch_number: string;
  status: string;
  expiration_date?: string;
  manufacture_date?: string;
  permit_id?: string;
  consignment_ref_number?: string;
  approval_status?: boolean;
  approval_date_stamp?: string;
  declared_total?: number;
  declared_sent?: number;
  serialization_range?: string[];
  is_partial_approval?: boolean;
  manufacturer_name?: string;
  manufacturer_gln?: string;
  manufacturing_site_sgln?: string;
  manufacturing_site_label?: string;
  importer_name?: string;
  importer_country?: string;
  importer_gln?: string;
  carrier?: string;
  origin?: string;
  port_of_entry?: string;
  final_destination_sgln?: string;
  final_destination_address?: string;
  processed_status: string;
  processing_error?: string;
  created_date: string;
  last_modified_date: string;
}

// API Functions
export const regulatorApi = {
  products: {
    create: (data: CreateProductDto) =>
      apiClient.post<Product>('/master-data/products', data), // Note: create might not be needed if products are only synced
    getAll: () => 
      apiClient.get<Product[]>('/master-data/products/all'),
    getById: (id: number) => apiClient.get<Product>(`/master-data/products/${id}`),
    delete: (id: number) => apiClient.delete(`/master-data/products/${id}`),
    getDataQualityReport: () =>
      apiClient.get<any>('/master-data/products/data-quality-report'),
  },

  journey: {
    trackBySSCC: (sscc: string) =>
      apiClient.post<Journey>('/analytics/journey/by-sscc', { sscc }),
    getAll: (page?: number, limit?: number) =>
      apiClient.get<Journey[]>(`/analytics/journey/all?page=${page || 1}&limit=${limit || 10}`),
    getConsignmentFlow: (consignmentID: string) =>
      apiClient.post<any>('/analytics/journey/consignment-flow', { consignmentID }),
  },

  recall: {
    create: (data: CreateRecallDto) =>
      apiClient.post<RecallRequest>('/regulator/recall', data),
    getAll: () => apiClient.get<RecallRequest[]>('/regulator/recall'),
    getById: (id: number) => apiClient.get<RecallRequest>(`/regulator/recall/${id}`),
    updateStatus: (id: number, status: string) =>
      apiClient.post<RecallRequest>(`/regulator/recall/${id}/status`, { status }),
  },

  analytics: {
    getDashboard: () => apiClient.get<Analytics>('/regulator/analytics/dashboard'),
  },

  ppbBatches: {
    /**
     * @deprecated Use getAllConsignments() instead - batches are now part of consignments
     */
    getAll: (page?: number, limit?: number, search?: string) => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);
      return apiClient.get<{ batches: PPBBatch[]; total: number; page: number; limit: number }>(
        `/regulator/ppb-batches?${params.toString()}`,
      );
    },
    /**
     * @deprecated Use getConsignmentById() instead - batches are now part of consignments
     */
    getById: (id: number) => apiClient.get<PPBBatch>(`/regulator/ppb-batches/${id}`),
    importConsignment: (data: any) =>
      apiClient.post<any>('/regulator/ppb-batches/consignment/import', data),
    getAllConsignments: () =>
      apiClient.get<any[]>('/regulator/ppb-batches/all-consignments'),
    getConsignmentById: (id: number) =>
      apiClient.get<any>(`/regulator/ppb-batches/consignments/${id}`),
  },
};

