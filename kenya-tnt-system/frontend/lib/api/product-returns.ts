import { ApiClient } from './client';

const client = new ApiClient();

export type ReturnType = 'RECEIVING' | 'SHIPPING';
export type ReturnReason = 
  | 'EXPIRED' 
  | 'DAMAGED' 
  | 'RECALL' 
  | 'OVERSTOCKING' 
  | 'QUALITY_ISSUE' 
  | 'OTHER';
export type ReturnStatus = 
  | 'PENDING' 
  | 'IN_TRANSIT' 
  | 'RECEIVED' 
  | 'PROCESSED' 
  | 'REJECTED';
export type QualityCheckResult = 'PASSED' | 'FAILED' | 'PENDING';

export interface ReturnReceivingDto {
  batchId: number;
  quantity: number;
  reason: ReturnReason;
  returnedFromFacilityId: number;
  returnedToFacilityId: number;
  sscc?: string;
  notes?: string;
}

export interface ReturnShippingDto {
  batchId: number;
  quantity: number;
  reason: ReturnReason;
  shippingFromFacilityId: number;
  shippingToFacilityId: number;
  referenceDocumentNumber?: string;
  sscc?: string;
  notes?: string;
}

export interface ProcessReturnDto {
  returnId: number;
  qualityCheckResult: QualityCheckResult;
  qualityCheckNotes?: string;
  finalDisposition: 'RESTOCK' | 'QUARANTINE' | 'DESTROY';
}

export interface ProductReturn {
  id: number;
  returnType: ReturnType;
  batchId: number;
  quantity: number;
  reason: ReturnReason;
  returnedFromFacilityId?: number;
  returnedToFacilityId?: number;
  shippingFromFacilityId?: number;
  shippingToFacilityId?: number;
  referenceDocumentNumber?: string;
  sscc?: string;
  returnDate: Date;
  status: ReturnStatus;
  qualityCheckResult?: QualityCheckResult;
  qualityCheckNotes?: string;
  processedByUserId?: string;
  processedAt?: Date;
  notes?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const productReturnsApi = {
  // Create return receiving
  async createReturnReceipt(userId: string, dto: ReturnReceivingDto): Promise<ProductReturn> {
    return client.post('/analytics/product-returns/receive', { ...dto, createdByUserId: userId });
  },

  // Create return shipping
  async createReturnShipment(userId: string, dto: ReturnShippingDto): Promise<ProductReturn> {
    return client.post('/analytics/product-returns/ship', { ...dto, createdByUserId: userId });
  },

  // Process return (quality check + disposition)
  async processReturn(userId: string, dto: ProcessReturnDto): Promise<ProductReturn> {
    return client.post('/analytics/product-returns/process', { 
      ...dto, 
      processedByUserId: userId 
    });
  },

  // Get returns
  async getAll(params?: {
    status?: ReturnStatus;
    returnType?: ReturnType;
    batchId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ProductReturn[]> {
    return client.get('/analytics/product-returns', params);
  },

  async getById(id: number): Promise<ProductReturn> {
    return client.get(`/analytics/product-returns/${id}`);
  },

  async getByBatch(batchId: number): Promise<ProductReturn[]> {
    return client.get(`/analytics/product-returns/batch/${batchId}`);
  },

  async getByStatus(status: ReturnStatus): Promise<ProductReturn[]> {
    return client.get(`/analytics/product-returns/status/${status}`);
  },

  // Pending returns (needs processing)
  async getPendingReturns(): Promise<ProductReturn[]> {
    return client.get('/analytics/product-returns/status/PENDING');
  },

  // History
  async getHistory(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ProductReturn[]> {
    return client.get('/analytics/product-returns', params);
  },
};
