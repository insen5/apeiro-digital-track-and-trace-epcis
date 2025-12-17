import { apiClient } from './client';

// Types
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

export interface ReceiveShipmentDto {
  ssccBarcode: string;
  customer: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  pickupLocation: string;
  destinationAddress: string;
  carrier: string;
}

export interface ForwardShipmentDto {
  receivedShipmentId: number;
  customer: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  pickupLocation: string;
  destinationAddress: string;
  carrier: string;
  customerId?: string;
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

// Additional types (import from manufacturer)
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
  shipmentDate: string;
  countryOfOrigin: string;
  destinationCountry: string;
  totalQuantity: number;
  // Importer party details
  importerPartyName?: string;
  importerPartyGLN?: string;
  importerPartyCountry?: string;
  // Destination party details
  destinationPartyName?: string;
  destinationPartyGLN?: string;
  destinationLocationLabel?: string;
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
export const distributorApi = {
  shipments: {
    receive: (data: ReceiveShipmentDto) =>
      apiClient.post<Shipment>('/distributor/shipments/receive', data),
    forward: (data: ForwardShipmentDto) =>
      apiClient.post<Shipment>('/distributor/shipments/forward', data),
    getReceived: () => apiClient.get<Shipment[]>('/distributor/shipments/received'),
    getPending: () => apiClient.get<Shipment[]>('/distributor/shipments/pending'),
    getForwardable: () => apiClient.get<Shipment[]>('/distributor/shipments/forwardable'),
    getDestinations: () => apiClient.get<{ premises: any[]; total: number }>('/distributor/shipments/destinations'),
  },
  packages: {
    assignSSCC: (id: number, sscc?: string) =>
      apiClient.put<Package>(`/distributor/shipments/packages/${id}/assign-sscc`, { sscc }),
  },
  cases: {
    assignSSCC: (id: number, sscc?: string) =>
      apiClient.put<Case>(`/distributor/shipments/cases/${id}/assign-sscc`, { sscc }),
  },
  // Consignments (PPB - Query Only, Import is regulator-only)
  consignments: {
    getAll: () => apiClient.get<PPBConsignment[]>('/distributor/consignments'),
    getById: (id: number) =>
      apiClient.get<PPBConsignment>(`/distributor/consignments/${id}`),
  },
};

