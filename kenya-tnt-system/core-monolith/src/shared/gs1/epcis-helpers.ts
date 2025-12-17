/**
 * EPCIS Helper Utilities
 *
 * Helper functions to create EPCIS standard objects (bizTransaction, quantity, source, destination, etc.)
 * These make it easier for callers to populate EPCIS events with standard fields.
 */

import {
  BizTransaction,
  QuantityElement,
  SourceDestination,
  SensorElement,
  ErrorDeclaration,
} from '../infrastructure/epcis/types';

/**
 * Create a business transaction object
 *
 * @param type Transaction type (e.g., 'PO', 'INVOICE', 'ASN', 'DESADV', 'RECADV')
 * @param transactionId Transaction ID or URI
 * @returns BizTransaction object
 *
 * @example
 * createBizTransaction('PO', 'PO-2024-001')
 * createBizTransaction('INVOICE', 'INV-2024-12345')
 */
export function createBizTransaction(
  type: string,
  transactionId: string,
): BizTransaction {
  return {
    type,
    bizTransaction: transactionId,
  };
}

/**
 * Create a quantity element
 *
 * @param epcClass EPC class URI (e.g., urn:epc:class:lgtin:0614141.012345.ABC)
 * @param quantity Quantity value
 * @param unitOfMeasure Unit of measure (e.g., 'EA', 'CASE', 'PALLET')
 * @returns QuantityElement object
 *
 * @example
 * createQuantity('urn:epc:class:lgtin:0614141.012345.ABC', 100, 'EA')
 */
export function createQuantity(
  epcClass: string,
  quantity: number,
  unitOfMeasure?: string,
): QuantityElement {
  return {
    epcClass,
    quantity,
    uom: unitOfMeasure,
  };
}

/**
 * Create a source or destination object
 *
 * @param type Source/destination type ('location', 'owning_party', 'possessing_party')
 * @param id Source/destination ID (GLN, location URI, etc.)
 * @returns SourceDestination object
 *
 * @example
 * createSourceDestination('location', 'urn:epc:id:sgln:0614141.00001.0')
 * createSourceDestination('owning_party', '0614141000001')
 */
export function createSourceDestination(
  type: string,
  id: string,
): SourceDestination {
  return {
    type,
    id,
  };
}

/**
 * Create a sensor element (EPCIS 2.0 only)
 *
 * @param type Sensor type (e.g., 'TEMPERATURE', 'HUMIDITY', 'SHOCK', 'LIGHT')
 * @param value Numeric sensor value
 * @param unitOfMeasure Unit of measure (e.g., 'CEL', 'P1', 'LUX')
 * @param options Additional sensor properties
 * @returns SensorElement object
 *
 * @example
 * createSensorElement('TEMPERATURE', 2.5, 'CEL', {
 *   deviceID: 'TEMP-SENSOR-001',
 *   time: new Date().toISOString(),
 * })
 */
export function createSensorElement(
  type: string,
  value: number,
  unitOfMeasure?: string,
  options?: {
    deviceID?: string;
    deviceMetadata?: string;
    rawData?: string;
    dataProcessingMethod?: string;
    time?: string;
    minValue?: number;
    maxValue?: number;
    meanValue?: number;
    exception?: string;
    metadata?: Record<string, any>;
  },
): SensorElement {
  return {
    type,
    value,
    uom: unitOfMeasure,
    ...options,
  };
}

/**
 * Create an error declaration
 *
 * @param reason Error reason code
 * @param declarationTime When the error was declared (ISO 8601 timestamp)
 * @param correctiveEventIDs Optional array of event IDs that correct this error
 * @returns ErrorDeclaration object
 *
 * @example
 * createErrorDeclaration('READ_ERROR', new Date().toISOString(), ['urn:uuid:...'])
 */
export function createErrorDeclaration(
  reason: string,
  declarationTime?: string,
  correctiveEventIDs?: string[],
): ErrorDeclaration {
  return {
    declarationTime: declarationTime || new Date().toISOString(),
    reason,
    correctiveEventIDs,
  };
}

/**
 * Common business transaction types (CBV standard)
 */
export const BizTransactionType = {
  PURCHASE_ORDER: 'PO',
  INVOICE: 'INVOICE',
  ADVANCED_SHIPPING_NOTICE: 'ASN',
  DESPATCH_ADVICE: 'DESADV',
  RECEIVING_ADVICE: 'RECADV',
  BILL_OF_LADING: 'BOL',
  WAYBILL: 'WAYBILL',
} as const;

/**
 * Common source/destination types (CBV standard)
 */
export const SourceDestinationType = {
  LOCATION: 'location',
  OWNING_PARTY: 'owning_party',
  POSSESSING_PARTY: 'possessing_party',
} as const;

/**
 * Common sensor types (EPCIS 2.0)
 */
export const SensorType = {
  TEMPERATURE: 'TEMPERATURE',
  HUMIDITY: 'HUMIDITY',
  SHOCK: 'SHOCK',
  LIGHT: 'LIGHT',
  PRESSURE: 'PRESSURE',
  VIBRATION: 'VIBRATION',
} as const;

/**
 * Common units of measure
 */
export const UnitOfMeasure = {
  EACH: 'EA',
  CASE: 'CASE',
  PALLET: 'PALLET',
  CELSIUS: 'CEL',
  PERCENT: 'P1',
  LUX: 'LUX',
  KILOGRAM: 'KGM',
  GRAM: 'GRM',
} as const;

