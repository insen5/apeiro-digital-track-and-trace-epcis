import { ApiClient } from './client';

const client = new ApiClient();

export type DestructionReason = 
  | 'EXPIRED' 
  | 'DAMAGED' 
  | 'COUNTERFEIT' 
  | 'RECALL' 
  | 'QUALITY_FAILURE' 
  | 'REGULATORY' 
  | 'OTHER';

export type DestructionStatus = 
  | 'INITIATED' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type DestructionMethod = 
  | 'INCINERATION' 
  | 'CHEMICAL' 
  | 'LANDFILL' 
  | 'RECYCLING' 
  | 'OTHER';

export interface InitiateDestructionDto {
  batchId: number;
  quantity: number;
  reason: DestructionReason;
  locationId?: number;
  notes?: string;
}

export interface ApproveDestructionDto {
  destructionId: number;
  approvalNotes?: string;
}

export interface RejectDestructionDto {
  destructionId: number;
  rejectionReason: string;
}

export interface CompleteDestructionDto {
  destructionId: number;
  destructionMethod: DestructionMethod;
  destructionDate: Date;
  witnessName?: string;
  witnessId?: string;
  certificateUrl?: string;
  completionNotes?: string;
}

export interface ProductDestruction {
  id: number;
  batchId: number;
  quantity: number;
  reason: DestructionReason;
  status: DestructionStatus;
  locationId?: number;
  initiatedByUserId: string;
  initiatedAt: Date;
  approvedByUserId?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  rejectedByUserId?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  destructionMethod?: DestructionMethod;
  destructionDate?: Date;
  completedByUserId?: string;
  completedAt?: Date;
  witnessName?: string;
  witnessId?: string;
  certificateUrl?: string;
  notes?: string;
  completionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const productDestructionApi = {
  // Initiate destruction (auto-approves if < 100 units)
  async initiate(userId: string, dto: InitiateDestructionDto): Promise<ProductDestruction> {
    return client.post('/analytics/product-destruction/initiate', { 
      ...dto, 
      initiatedByUserId: userId 
    });
  },

  // Approve destruction (for quantities >= 100)
  async approve(userId: string, dto: ApproveDestructionDto): Promise<ProductDestruction> {
    return client.post('/analytics/product-destruction/approve', { 
      ...dto, 
      approvedByUserId: userId 
    });
  },

  // Reject destruction
  async reject(userId: string, dto: RejectDestructionDto): Promise<ProductDestruction> {
    return client.post('/analytics/product-destruction/reject', { 
      ...dto, 
      rejectedByUserId: userId 
    });
  },

  // Complete destruction (with witness documentation)
  async complete(userId: string, dto: CompleteDestructionDto): Promise<ProductDestruction> {
    return client.post('/analytics/product-destruction/complete', { 
      ...dto, 
      completedByUserId: userId 
    });
  },

  // Get destructions
  async getAll(params?: {
    status?: DestructionStatus;
    batchId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ProductDestruction[]> {
    return client.get('/analytics/product-destruction', params);
  },

  async getById(id: number): Promise<ProductDestruction> {
    return client.get(`/analytics/product-destruction/${id}`);
  },

  async getByBatch(batchId: number): Promise<ProductDestruction[]> {
    return client.get(`/analytics/product-destruction/batch/${batchId}`);
  },

  async getByStatus(status: DestructionStatus): Promise<ProductDestruction[]> {
    return client.get(`/analytics/product-destruction/status/${status}`);
  },

  // Pending approvals (for managers)
  async getPendingApprovals(): Promise<ProductDestruction[]> {
    return client.get('/analytics/product-destruction/pending-approval');
  },

  // History
  async getHistory(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ProductDestruction[]> {
    return client.get('/analytics/product-destruction', params);
  },
};
