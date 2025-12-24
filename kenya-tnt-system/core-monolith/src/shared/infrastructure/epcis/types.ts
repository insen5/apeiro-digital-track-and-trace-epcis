// EPCIS Event Types

export interface BizTransaction {
  type: string; // e.g., 'PO', 'INVOICE', 'ASN', 'DESADV', 'RECADV'
  bizTransaction: string; // Transaction ID/URI
}

export interface QuantityElement {
  epcClass: string; // EPC class URI (e.g., urn:epc:class:lgtin:...)
  quantity: number;
  uom?: string; // Unit of measure (e.g., 'EA', 'CASE', 'PALLET')
}

export interface SourceDestination {
  type: string; // 'location' or 'owning_party' or 'possessing_party'
  id: string; // Source or destination ID/URI (GLN, location URI, etc.)
}

export interface SensorElement {
  type: string; // e.g., 'TEMPERATURE', 'HUMIDITY', 'SHOCK', 'LIGHT'
  deviceID?: string;
  deviceMetadata?: string;
  rawData?: string;
  dataProcessingMethod?: string;
  time?: string; // ISO 8601 timestamp
  microorganism?: string;
  chemicalSubstance?: string;
  value?: number;
  component?: string;
  stringValue?: string;
  booleanValue?: boolean;
  hexBinaryValue?: string;
  uriValue?: string;
  minValue?: number;
  maxValue?: number;
  meanValue?: number;
  percRank?: number;
  percValue?: number;
  uom?: string; // Unit of measure
  exception?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDeclaration {
  declarationTime: string; // ISO 8601 timestamp
  reason: string; // Error reason code
  correctiveEventIDs?: string[]; // IDs of events that correct this error
}

/**
 * ILMD (Instance/Lot Master Data) - EPCIS 2.0
 * Contains batch/lot-level master data for products
 * Used in ObjectEvents to carry batch metadata (expiry, manufacturing date, etc.)
 * Critical for regulatory compliance (EU FMD, FDA DSCSA, Kenya PPB)
 */
export interface ILMD {
  lotNumber?: string; // Batch/lot number
  itemExpirationDate?: string; // ISO 8601 date (YYYY-MM-DD)
  productionDate?: string; // ISO 8601 date (YYYY-MM-DD) - manufacturing date
  countryOfOrigin?: string; // ISO 3166-1 alpha-2 country code
  countryOfExport?: string; // ISO 3166-1 alpha-2 country code
  bestBeforeDate?: string; // ISO 8601 date
  sellByDate?: string; // ISO 8601 date
  // Allow custom extensions for additional metadata
  [key: string]: any;
}


export interface AggregationEvent {
  eventID: string; // UUID format: urn:uuid:...
  type: 'AggregationEvent';
  eventTime: string; // ISO 8601 timestamp
  event_time_zone_offset: string; // e.g., '+04:00'
  parentID: string; // EPC URI
  childEPCs: string[]; // Array of EPC URIs
  action: 'ADD' | 'DELETE' | 'OBSERVE';
  bizStep?: string; // e.g., 'packing', 'shipping', 'receiving'
  disposition?: string; // e.g., 'in_progress', 'in_transit', 'in_use'
  bizTransactionList?: BizTransaction[];
  quantityList?: QuantityElement[];
  sourceList?: SourceDestination[];
  destinationList?: SourceDestination[];
  readPoint?: { id: string };
  bizLocation?: { id: string };
  sensorElementList?: SensorElement[]; // EPCIS 2.0 only
  errorDeclaration?: ErrorDeclaration;
}

export interface ObjectEvent {
  eventID: string;
  type: 'ObjectEvent';
  eventTime: string;
  event_time_zone_offset: string;
  epcList: string[]; // Array of EPC URIs
  action: 'ADD' | 'DELETE' | 'OBSERVE';
  bizStep?: string;
  disposition?: string;
  bizTransactionList?: BizTransaction[];
  quantityList?: QuantityElement[];
  sourceList?: SourceDestination[];
  destinationList?: SourceDestination[];
  readPoint?: { id: string };
  bizLocation?: { id: string };
  sensorElementList?: SensorElement[]; // EPCIS 2.0 only
  errorDeclaration?: ErrorDeclaration;
  ilmd?: ILMD; // Instance/Lot Master Data (EPCIS 2.0) - Critical for batch tracking, regulatory compliance
  extensions?: Record<string, any>; // Custom extensions for regulatory/business metadata (EPCIS 2.0)
}

export type EPCISEvent = AggregationEvent | ObjectEvent;

export interface EPCISDocument {
  '@context': string[]; // ['https://ref.gs1.org/standards/epcis/epcis-context.jsonld']
  type: 'EPCISDocument';
  schemaVersion: '2.0';
  creationDate: string; // ISO 8601
  epcisBody: {
    eventList: EPCISEvent[];
  };
}

export interface CaptureResponse {
  success: boolean;
  eventIds?: string[];
  errors?: string[];
}

export interface EPCISQuery {
  EQ_bizStep?: string;
  EQ_disposition?: string;
  EQ_action?: string;
  EQ_eventType?: string;
  GE_eventTime?: string;
  LE_eventTime?: string;
  EQ_epc?: string;
  [key: string]: any; // Allow additional query parameters
}

export interface EPCISQueryDocument {
  '@context': string;
  type: 'EPCISDocument';
  schemaVersion: string;
  creationDate: string;
  epcisBody: {
    eventList: EPCISEvent[];
  };
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

