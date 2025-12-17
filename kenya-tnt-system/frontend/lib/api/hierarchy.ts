import { ApiClient } from './client';

const client = new ApiClient();

export interface PackDto {
  shipmentId: number;
  caseIds: number[];
  notes?: string;
}

export interface PackLiteDto {
  shipmentId: number;
  startCaseNumber: number;
  endCaseNumber: number;
  notes?: string;
}

export interface PackLargeDto {
  shipmentId: number;
  ssccList: string[];
  notes?: string;
}

export interface UnpackAllDto {
  packageId: number;
  reason: string;
}

export interface RepackDto {
  packageId: number;
  newShipmentId: number;
  reason: string;
}

export interface ReassignSsccDto {
  packageId: number;
  reason: string;
}

export interface Package {
  id: number;
  sscc: string;
  shipmentId: number;
  previousSscc?: string;
  reassignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HierarchyChange {
  id: number;
  operationType: 'PACK' | 'UNPACK' | 'REPACK' | 'REASSIGN_SSCC';
  parentSscc?: string;
  newSscc?: string;
  oldSscc?: string;
  caseIds?: number[];
  ssccList?: string[];
  actorUserId: string;
  actorType?: string;
  changeDate: Date;
  notes?: string;
  createdAt: Date;
}

export const hierarchyApi = {
  // Pack operations
  async pack(userId: string, dto: PackDto): Promise<Package> {
    return client.post(`/hierarchy/pack`, { userId, ...dto });
  },

  async packLite(userId: string, dto: PackLiteDto): Promise<Package> {
    return client.post(`/hierarchy/pack-lite`, { userId, ...dto });
  },

  async packLarge(userId: string, dto: PackLargeDto): Promise<Package> {
    return client.post(`/hierarchy/pack-large`, { userId, ...dto });
  },

  // Unpack operations
  async unpack(userId: string, packageId: number): Promise<any[]> {
    return client.post(`/hierarchy/unpack/${packageId}`, { userId });
  },

  async unpackAll(userId: string, dto: UnpackAllDto): Promise<any[]> {
    return client.post(`/hierarchy/unpack-all`, { userId, ...dto });
  },

  // Repack operation
  async repack(userId: string, dto: RepackDto): Promise<Package> {
    return client.post(`/hierarchy/repack`, { userId, ...dto });
  },

  // SSCC reassignment
  async reassignSscc(userId: string, dto: ReassignSsccDto): Promise<Package> {
    return client.post(`/hierarchy/reassign-sscc`, { userId, ...dto });
  },

  // History queries
  async getHistory(params?: {
    operationType?: string;
    startDate?: string;
    endDate?: string;
    actorUserId?: string;
    limit?: number;
  }): Promise<HierarchyChange[]> {
    return client.get('/hierarchy/history', params);
  },

  async getPackageHistory(packageId: number): Promise<HierarchyChange[]> {
    return client.get(`/hierarchy/history/package/${packageId}`);
  },

  async getCaseHistory(caseId: number): Promise<HierarchyChange[]> {
    return client.get(`/hierarchy/history/case/${caseId}`);
  },
};
