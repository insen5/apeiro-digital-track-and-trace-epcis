import {
  EPCISDocument,
  CaptureResponse,
  EPCISQuery,
  EPCISQueryDocument,
  EPCISEvent,
  QueryOptions,
} from './types';

// Re-export types for convenience
export type {
  EPCISDocument,
  CaptureResponse,
  EPCISQuery,
  EPCISQueryDocument,
  EPCISEvent,
  QueryOptions,
};

// EPCIS Adapter Configuration
export interface EPCISAdapterConfig {
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  authType: 'none' | 'basic' | 'bearer' | 'api-key';
  timeout?: number;
}

// Vendor-Agnostic EPCIS Adapter Interface
export interface IEPCISAdapter {
  // Event Capture
  captureEvent(document: EPCISDocument): Promise<CaptureResponse>;
  captureEvents(documents: EPCISDocument[]): Promise<CaptureResponse[]>;

  // Event Query
  queryEvents(query: EPCISQuery): Promise<EPCISQueryDocument>;
  getEventById(eventId: string): Promise<EPCISEvent>;
  getEventsByEPC(epc: string, options?: QueryOptions): Promise<EPCISEvent[]>;

  // Health Check
  healthCheck(): Promise<boolean>;

  // Configuration
  configure(config: EPCISAdapterConfig): void;
}

