import { ApiClient } from './client';

const client = new ApiClient();

export type ProductStatusType = 
  | 'ACTIVE' 
  | 'LOST' 
  | 'STOLEN' 
  | 'DAMAGED' 
  | 'SAMPLE' 
  | 'EXPORT' 
  | 'DISPENSING';

export interface CreateProductStatusDto {
  productId?: number;
  batchId?: number;
  sgtin?: string;
  status: ProductStatusType;
  notes?: string;
  reportedByUserId?: string;
  locationId?: number;
  quantity?: number;
}

export interface BulkStatusUpdateDto {
  sgtins: string[];
  status: ProductStatusType;
  notes?: string;
  reportedByUserId?: string;
}

export interface ProductStatus {
  id: number;
  productId?: number;
  batchId?: number;
  sgtin?: string;
  status: ProductStatusType;
  notes?: string;
  reportedByUserId?: string;
  reportedAt: Date;
  locationId?: number;
  quantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusSummary {
  status: ProductStatusType;
  count: number;
  totalQuantity: number;
}

export interface StatusReport {
  summary: StatusSummary[];
  recentChanges: ProductStatus[];
  criticalIssues: {
    lostCount: number;
    stolenCount: number;
    damagedCount: number;
  };
}

export const productStatusApi = {
  // Create status
  async create(userId: string, dto: CreateProductStatusDto): Promise<ProductStatus> {
    return client.post('/analytics/product-status', { ...dto, reportedByUserId: userId });
  },

  // Update status (with authorization checks)
  async updateStatus(userId: string, dto: CreateProductStatusDto): Promise<ProductStatus> {
    return client.post('/analytics/product-status/update', { ...dto, reportedByUserId: userId });
  },

  // Bulk update
  async bulkUpdate(userId: string, dto: BulkStatusUpdateDto): Promise<{ 
    success: number; 
    failed: number; 
    results: ProductStatus[] 
  }> {
    return client.post('/analytics/product-status/bulk-update', { 
      ...dto, 
      reportedByUserId: userId 
    });
  },

  // Get status for a specific item
  async getByProductId(productId: number): Promise<ProductStatus[]> {
    return client.get(`/analytics/product-status/product/${productId}`);
  },

  async getByBatchId(batchId: number): Promise<ProductStatus[]> {
    return client.get(`/analytics/product-status/batch/${batchId}`);
  },

  async getBySgtin(sgtin: string): Promise<ProductStatus[]> {
    return client.get(`/analytics/product-status/sgtin/${sgtin}`);
  },

  // Get current status
  async getCurrentStatus(productId?: number, batchId?: number, sgtin?: string): Promise<ProductStatus | null> {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId.toString());
    if (batchId) params.append('batchId', batchId.toString());
    if (sgtin) params.append('sgtin', sgtin);
    
    return client.get(`/analytics/product-status/current?${params.toString()}`);
  },

  // Reports
  async getReport(params?: {
    startDate?: string;
    endDate?: string;
    status?: ProductStatusType;
  }): Promise<StatusReport> {
    return client.get('/analytics/product-status/report', params);
  },

  async getSummary(): Promise<StatusSummary[]> {
    return client.get('/analytics/product-status/summary');
  },

  // History
  async getHistory(params?: {
    startDate?: string;
    endDate?: string;
    status?: ProductStatusType;
    limit?: number;
  }): Promise<ProductStatus[]> {
    return client.get('/analytics/product-status', params);
  },
};
