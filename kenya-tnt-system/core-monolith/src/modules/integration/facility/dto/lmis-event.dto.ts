import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsEnum,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * LMIS Business Event Types
 * Matches the actual LMIS event specification
 */
export enum LMISEventType {
  DISPENSE = 'dispense',
  RECEIVE = 'receive',
  ADJUST = 'adjust',
  STOCK_COUNT = 'stock_count',
  RETURN = 'return',
  RECALL = 'recall',
}

/**
 * Location coordinates
 */
export class CoordinatesDto {
  @ApiProperty({
    example: -1.2860,
    description: 'Latitude',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    example: 36.8220,
    description: 'Longitude',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    example: 7.2,
    description: 'Location accuracy in meters',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  accuracy_meters?: number;
}

/**
 * Location data with coordinates and timestamp
 */
export class LocationDto {
  @ApiProperty({
    example: 'GLN123456',
    description: 'Facility GLN (for stock_count and recall events)',
    required: false,
  })
  @IsString()
  @IsOptional()
  facility_gln?: string;

  @ApiProperty({
    oneOf: [
      { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, accuracy_meters: { type: 'number' } } },
      { type: 'string', example: '-1.0303,36.68687' },
    ],
    description: 'GPS coordinates - can be object with latitude/longitude or comma-separated string "lat,lng" or "lat,lng,accuracy"',
    required: false,
    examples: [
      { coordinates: { latitude: -1.2860, longitude: 36.8220, accuracy_meters: 7.2 } },
      { coordinates: '-1.0303,36.68687' },
      { coordinates: '-1.0303,36.68687,7.2' },
      { coordinates: null },
    ],
  })
  @IsOptional()
  coordinates?: CoordinatesDto | string | null;

  @ApiProperty({
    example: '2024-12-19T09:14:55Z',
    description: 'Timestamp when location was captured',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  captured_at?: string;
}

/**
 * GS1 Identifiers (SGTINs and SSCC)
 */
export class IdentifiersDto {
  @ApiProperty({
    example: '061640040000012345',
    description: 'SSCC (Serial Shipping Container Code)',
    required: false,
  })
  @IsString()
  @IsOptional()
  sscc?: string;

  @ApiProperty({
    example: ['0616400401234567890X', '0616400401234567890Y'],
    description: 'Array of SGTINs (already formatted, not serial numbers)',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sgtins?: string[];
}

/**
 * Item in receive, stock_count, return, recall events
 */
export class LMISItemDto {
  @ApiProperty({
    example: '06164004012345',
    description: 'GTIN of the product',
  })
  @IsString()
  gtin: string;

  @ApiProperty({
    example: 'BATCH-ABC123',
    description: 'Batch/Lot number',
  })
  @IsString()
  batch_number: string;

  @ApiProperty({
    example: '2026-02-15',
    description: 'Expiry date',
  })
  @IsDateString()
  expiry_date: string;

  @ApiProperty({
    type: IdentifiersDto,
    description: 'GS1 identifiers (SSCC and/or SGTINs)',
  })
  @ValidateNested()
  @Type(() => IdentifiersDto)
  identifiers: IdentifiersDto;

  @ApiProperty({
    example: 197,
    description: 'Quantity',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  // Stock count specific
  @ApiProperty({
    example: 200,
    description: 'System quantity (for stock_count events)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  system_quantity?: number;

  @ApiProperty({
    example: 197,
    description: 'Physical quantity (for stock_count events)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  physical_quantity?: number;
}

/**
 * Adjustment item (single item with quantity change)
 */
export class AdjustmentItemDto {
  @ApiProperty({
    example: '06164004012345',
    description: 'GTIN of the product',
  })
  @IsString()
  gtin: string;

  @ApiProperty({
    example: 'BATCH-ABC123',
    description: 'Batch/Lot number',
  })
  @IsString()
  batch_number: string;

  @ApiProperty({
    example: '2026-02-15',
    description: 'Expiry date',
  })
  @IsDateString()
  expiry_date: string;

  @ApiProperty({
    type: IdentifiersDto,
    description: 'GS1 identifiers (SGTINs for unit-level adjustments)',
  })
  @ValidateNested()
  @Type(() => IdentifiersDto)
  identifiers: IdentifiersDto;

  @ApiProperty({
    example: -2,
    description: 'Quantity change (negative = loss, positive = gain)',
  })
  @IsNumber()
  quantity_change: number;
}

/**
 * Shipment information (for receive events)
 */
export class ShipmentDto {
  @ApiProperty({
    example: 'SHIP-20241219-001',
    description: 'Shipment identifier',
  })
  @IsString()
  shipment_id: string;

  @ApiProperty({
    example: '2024-12-19T09:15:00Z',
    description: 'Timestamp when shipment was received',
  })
  @IsDateString()
  received_at: string;
}

/**
 * Base LMIS Event DTO
 * All events extend from this structure
 */
export class BaseLMISEventDto {
  @ApiProperty({
    example: 'dispense',
    enum: LMISEventType,
    description: 'Type of LMIS event',
  })
  @IsEnum(LMISEventType)
  type: LMISEventType;

  @ApiProperty({
    example: 'GLN123456',
    description: 'Facility GLN (13 digits)',
  })
  @IsString()
  GLN: string;

  @ApiProperty({
    example: '2024-12-19T10:30:00Z',
    description: 'Event timestamp',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    type: LocationDto,
    description: 'Location data with coordinates',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

/**
 * Dispense/Issue Event
 */
export class DispenseEventDto extends BaseLMISEventDto {
  @ApiProperty({
    example: 'dispense',
    enum: [LMISEventType.DISPENSE],
  })
  type: LMISEventType.DISPENSE;

  @ApiProperty({
    example: '06164004012345',
    description: 'GTIN of dispensed product',
  })
  @IsString()
  gtin: string;

  @ApiProperty({
    example: 'BATCH-XYZ123',
    description: 'Batch number',
  })
  @IsString()
  batch_number: string;

  @ApiProperty({
    example: '2026-01-15',
    description: 'Expiry date',
  })
  @IsDateString()
  expiry_date: string;

  @ApiProperty({
    type: IdentifiersDto,
    description: 'GS1 identifiers',
  })
  @ValidateNested()
  @Type(() => IdentifiersDto)
  identifiers: IdentifiersDto;

  @ApiProperty({
    example: 10,
    description: 'Quantity dispensed',
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'DISP-20241219-001',
    description: 'Dispensation identifier',
  })
  @IsString()
  dispensation_id: string;
}

/**
 * Receive Event (opened SSCC with partial SGTIN scans OR sealed SSCC bulk receive)
 */
export class ReceiveEventDto extends BaseLMISEventDto {
  @ApiProperty({
    example: 'receive',
    enum: [LMISEventType.RECEIVE],
  })
  type: LMISEventType.RECEIVE;

  @ApiProperty({
    example: 'GRN-20241219-001',
    description: 'Goods Receipt Note (GRN) identifier',
  })
  @IsString()
  grn_id: string;

  @ApiProperty({
    type: ShipmentDto,
    description: 'Shipment information',
  })
  @ValidateNested()
  @Type(() => ShipmentDto)
  shipment: ShipmentDto;

  @ApiProperty({
    type: [LMISItemDto],
    description: 'Items received',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LMISItemDto)
  items: LMISItemDto[];
}

/**
 * Adjustment Event
 */
export class AdjustEventDto extends BaseLMISEventDto {
  @ApiProperty({
    example: 'adjust',
    enum: [LMISEventType.ADJUST],
  })
  type: LMISEventType.ADJUST;

  @ApiProperty({
    example: 'damage',
    enum: ['expiry', 'damage', 'theft', 'loss', 'found', 'stock_count_correction'],
    description: 'Reason for adjustment',
  })
  @IsEnum(['expiry', 'damage', 'theft', 'loss', 'found', 'stock_count_correction'])
  reason: string;

  @ApiProperty({
    type: AdjustmentItemDto,
    description: 'Item being adjusted',
  })
  @ValidateNested()
  @Type(() => AdjustmentItemDto)
  item: AdjustmentItemDto;

  @ApiProperty({
    example: 'ADJ-20241220-001',
    description: 'Local LMIS reference ID for adjustment',
  })
  @IsString()
  reference_id: string;
}

/**
 * Stock Count Event
 */
export class StockCountEventDto {
  @ApiProperty({
    example: 'stock_count',
    enum: [LMISEventType.STOCK_COUNT],
  })
  @IsEnum([LMISEventType.STOCK_COUNT])
  type: LMISEventType.STOCK_COUNT;

  @ApiProperty({
    example: '2024-12-21T10:45:00Z',
    description: 'Stock count timestamp',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    type: LocationDto,
    description: 'Location (must include facility_gln)',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    example: 'SC-20241221-001',
    description: 'Stock count session identifier',
  })
  @IsString()
  count_session_id: string;

  @ApiProperty({
    type: [LMISItemDto],
    description: 'Items counted (must include system_quantity and physical_quantity)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LMISItemDto)
  items: LMISItemDto[];
}

/**
 * Return Event
 */
export class ReturnEventDto extends BaseLMISEventDto {
  @ApiProperty({
    example: 'return',
    enum: [LMISEventType.RETURN],
  })
  type: LMISEventType.RETURN;

  @ApiProperty({
    example: 'RET-20241222-001',
    description: 'Return identifier',
  })
  @IsString()
  return_id: string;

  @ApiProperty({
    example: 'supplier_return',
    description: 'Return reason',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    type: [LMISItemDto],
    description: 'Items returned',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LMISItemDto)
  items: LMISItemDto[];
}

/**
 * Recall Event
 */
export class RecallEventDto {
  @ApiProperty({
    example: 'recall',
    enum: [LMISEventType.RECALL],
  })
  @IsEnum([LMISEventType.RECALL])
  type: LMISEventType.RECALL;

  @ApiProperty({
    example: '2024-12-23T12:10:00Z',
    description: 'Recall timestamp',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    type: LocationDto,
    description: 'Location (must include facility_gln)',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    example: 'RECALL-PPB-20241223-001',
    description: 'Recall notice identifier',
  })
  @IsString()
  recall_notice_id: string;

  @ApiProperty({
    example: 'Class I',
    description: 'Recall class',
  })
  @IsString()
  recall_class: string;

  @ApiProperty({
    example: 'regulatory_recall',
    description: 'Recall reason',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    type: [LMISItemDto],
    description: 'Items recalled',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LMISItemDto)
  items: LMISItemDto[];
}

/**
 * Union type for all LMIS events
 */
export type LMISEventDto =
  | DispenseEventDto
  | ReceiveEventDto
  | AdjustEventDto
  | StockCountEventDto
  | ReturnEventDto
  | RecallEventDto;

