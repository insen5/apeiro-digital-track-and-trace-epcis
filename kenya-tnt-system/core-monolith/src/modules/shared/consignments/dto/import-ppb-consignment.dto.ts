import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PPBHeaderDto {
  @ApiProperty({ example: 'EVT-2025-0001' })
  @IsString()
  event_id: string;

  @ApiProperty({ example: 'REGULATORY_INSTANTIATION' })
  @IsString()
  event_type: string;

  @ApiProperty({ example: '2025-11-01T12:45:00Z' })
  @IsDateString()
  event_timestamp: string;

  @ApiProperty({ example: 'PPB' })
  @IsString()
  source_system: string;

  @ApiProperty({ example: 'TNT' })
  @IsString()
  destination_system: string;

  @ApiProperty({ example: '1.0', required: false })
  @IsString()
  @IsOptional()
  version?: string;
}

export enum PPBItemType {
  SHIPMENT = 'shipment',
  PACKAGE = 'package',
  CASE = 'case',
  BATCH = 'batch',
}

export class PPBItemDto {
  @ApiProperty({
    example: 'batch',
    enum: PPBItemType,
    description: 'Type of item: shipment, package, case, or batch',
  })
  @IsEnum(PPBItemType)
  type: PPBItemType;

  @ApiProperty({
    example: 'CASE-001',
    description: 'Label/identifier for the item',
  })
  @IsString()
  label: string;

  @ApiProperty({
    example: '123456789012345681',
    required: false,
    description: 'SSCC for this item (null if no SSCC assigned)',
  })
  @IsString()
  @IsOptional()
  sscc?: string;

  @ApiProperty({
    example: '123456789012345679',
    required: false,
    description: 'Parent SSCC - references the SSCC of the parent item. null = root/parent item',
  })
  @IsString()
  @IsOptional()
  parent_sscc?: string;

  // Batch-specific fields
  @ApiProperty({
    example: '61640056789012',
    required: false,
    description: 'GTIN - required for batch type items',
  })
  @IsString()
  @IsOptional()
  gtin?: string;

  @ApiProperty({
    example: 'Metformin 500mg Tablets',
    required: false,
    description: 'Product name - required for batch type items',
  })
  @IsString()
  @IsOptional()
  product_name?: string;

  @ApiProperty({
    example: '5343545',
    required: false,
    description: 'Batch number - required for batch type items',
  })
  @IsString()
  @IsOptional()
  batch_no?: string;

  @ApiProperty({
    example: 'Active',
    required: false,
    description: 'Batch status - required for batch type items',
  })
  @IsString()
  @IsOptional()
  batch_status?: string;

  @ApiProperty({
    example: '2024-09-16',
    required: false,
    description: 'Manufacture date - required for batch type items',
  })
  @IsDateString()
  @IsOptional()
  manufacture_date?: string;

  @ApiProperty({
    example: '2027-09-16',
    required: false,
    description: 'Expiry date - required for batch type items',
  })
  @IsDateString()
  @IsOptional()
  expiry_date?: string;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Quantity approved by PPB for this consignment - required for batch type items',
  })
  @IsNumber()
  @IsOptional()
  quantity_approved?: number;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Quantity - legacy field, use quantity_approved instead',
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    example: ['KE0010001', 'KE0010002', 'KE0010003'],
    type: [String],
    required: false,
    description: 'Serial numbers - optional for batch type items (legacy field, use serialization instead)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serial_numbers?: string[];

  @ApiProperty({
    example: 'PH111D',
    required: false,
    description: 'Product code - optional for batch type items',
  })
  @IsString()
  @IsOptional()
  product_code?: string;

  @ApiProperty({
    example: '18905',
    required: false,
    description: 'Permit ID - optional for batch type items',
  })
  @IsString()
  @IsOptional()
  permit_id?: string;

  // Serialization object with ranges and explicit serials
  @ApiProperty({
    required: false,
    description: 'Serialization information with ranges and explicit serials',
  })
  @IsObject()
  @IsOptional()
  serialization?: {
    is_partial_approval?: boolean;
    ranges?: Array<{
      start: string;
      end: string;
      count?: number;
    }>;
    explicit?: string[];
  };

  // Approval object
  @ApiProperty({
    required: false,
    description: 'Approval information for batch items',
  })
  @IsObject()
  @IsOptional()
  approval?: {
    approval_status?: boolean;
    approval_datestamp?: string;
    quantities?: {
      declared_total?: number;
      declared_sent?: number;
    };
  };

  // Optional metadata for any item type
  @ApiProperty({
    required: false,
    description: 'Additional metadata (e.g., customer, carrier for shipment; packageType for package)',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ManufacturerDto {
  @ApiProperty({ example: '345345' })
  @IsString()
  ppb_id: string;

  @ApiProperty({ example: '61640056789012', required: false })
  @IsString()
  @IsOptional()
  gln?: string;
}

export class MAHDto {
  @ApiProperty({ example: '34234324' })
  @IsString()
  ppb_id: string;

  @ApiProperty({ example: '61640056789013', required: false })
  @IsString()
  @IsOptional()
  gln?: string;
}

// Parties DTOs
export class PartyDto {
  @ApiProperty({ example: 'KEM Pharma Ltd', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '345345', required: false })
  @IsString()
  @IsOptional()
  ppb_id?: string;

  @ApiProperty({ example: 'urn:epc:id:sgln:7894500.00001.0', required: false })
  @IsString()
  @IsOptional()
  gln?: string;

  @ApiProperty({ example: 'KE', required: false })
  @IsString()
  @IsOptional()
  country?: string;
}

export class LocationDto {
  @ApiProperty({ example: 'urn:epc:id:sgln:7894500.00002.0', required: false })
  @IsString()
  @IsOptional()
  sgln?: string;

  @ApiProperty({ example: 'Kiambu Manufacturing Facility', required: false })
  @IsString()
  @IsOptional()
  label?: string;
}

export class PartiesDto {
  @ApiProperty({ type: PartyDto, required: false })
  @ValidateNested()
  @Type(() => PartyDto)
  @IsOptional()
  manufacturer_party?: PartyDto;

  @ApiProperty({ type: PartyDto, required: false })
  @ValidateNested()
  @Type(() => PartyDto)
  @IsOptional()
  mah_party?: PartyDto;

  @ApiProperty({ type: LocationDto, required: false })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  manufacturing_site?: LocationDto;

  @ApiProperty({ type: PartyDto, required: false })
  @ValidateNested()
  @Type(() => PartyDto)
  @IsOptional()
  importer_party?: PartyDto;

  @ApiProperty({ type: LocationDto, required: false })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  importer_location?: LocationDto;

  @ApiProperty({ type: PartyDto, required: false })
  @ValidateNested()
  @Type(() => PartyDto)
  @IsOptional()
  destination_party?: PartyDto;

  @ApiProperty({ type: LocationDto, required: false })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  destination_location?: LocationDto;
}

export class LogisticsDto {
  @ApiProperty({ example: 'DHL', required: false })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiProperty({ example: 'Mumbai, India', required: false })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiProperty({ example: 'Mombasa Port – Berth 11', required: false })
  @IsString()
  @IsOptional()
  port_of_entry?: string;

  @ApiProperty({ example: 'urn:epc:id:sgln:1234567.00002.0', required: false })
  @IsString()
  @IsOptional()
  final_destination_sgln?: string;

  @ApiProperty({ example: 'Nairobi, Kenya', required: false })
  @IsString()
  @IsOptional()
  final_destination_address?: string;
}

export class PPBConsignmentDto {
  @ApiProperty({ example: 'CNS-2025-98765' })
  @IsString()
  consignment_id: string;

  @ApiProperty({ example: 'CRN-2024-0001', required: false })
  @IsString()
  @IsOptional()
  consignment_ref_number?: string;

  @ApiProperty({ example: '2025-10-25' })
  @IsDateString()
  shipment_date: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  country_of_origin: string;

  @ApiProperty({ example: 'KE' })
  @IsString()
  destination_country: string;

  @ApiProperty({ example: '12243324' })
  @IsString()
  registration_no: string;

  @ApiProperty({ example: 10000, required: false })
  @IsNumber()
  @IsOptional()
  total_quantity?: number;

  // New structure: parties object
  @ApiProperty({ type: PartiesDto, required: false })
  @ValidateNested()
  @Type(() => PartiesDto)
  @IsOptional()
  parties?: PartiesDto;

  // New structure: logistics object
  @ApiProperty({ type: LogisticsDto, required: false })
  @ValidateNested()
  @Type(() => LogisticsDto)
  @IsOptional()
  logistics?: LogisticsDto;

  // Legacy structure: manufacturer and mah at top level (for backward compatibility)
  @ApiProperty({ type: ManufacturerDto, required: false })
  @ValidateNested()
  @Type(() => ManufacturerDto)
  @IsOptional()
  manufacturer?: ManufacturerDto;

  @ApiProperty({ type: MAHDto, required: false })
  @ValidateNested()
  @Type(() => MAHDto)
  @IsOptional()
  mah?: MAHDto;

  // Legacy fields for backward compatibility
  @ApiProperty({ example: '345345', required: false })
  @IsString()
  @IsOptional()
  manufacturer_ppb_id?: string;

  @ApiProperty({ example: '34234324', required: false })
  @IsString()
  @IsOptional()
  mah_ppb_id?: string;

  @ApiProperty({ example: '345345', required: false })
  @IsString()
  @IsOptional()
  manufacturer_gln?: string;

  @ApiProperty({ example: '34234324', required: false })
  @IsString()
  @IsOptional()
  mah_gln?: string;

  @ApiProperty({
    type: [PPBItemDto],
    description: 'Flat list of all items (shipment, packages, cases, batches) with parent-child SSCC relationships',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PPBItemDto)
  items: PPBItemDto[];
}

export class ImportPPBConsignmentDto {
  @ApiProperty({ type: PPBHeaderDto })
  @ValidateNested()
  @Type(() => PPBHeaderDto)
  header: PPBHeaderDto;

  @ApiProperty({ type: PPBConsignmentDto })
  @ValidateNested()
  @Type(() => PPBConsignmentDto)
  consignment: PPBConsignmentDto;
}
