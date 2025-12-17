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
} from 'class-validator';
import { Type } from 'class-transformer';

export class PPBHeaderDto {
  @ApiProperty({ example: 'EVT-2025-0001' })
  @IsString()
  eventID: string;

  @ApiProperty({ example: 'REGULATORY_INSTANTIATION' })
  @IsString()
  eventType: string;

  @ApiProperty({ example: '2025-11-01T12:45:00Z' })
  @IsDateString()
  eventTimestamp: string;

  @ApiProperty({ example: 'PPB' })
  @IsString()
  sourceSystem: string;

  @ApiProperty({ example: 'TNT' })
  @IsString()
  destinationSystem: string;

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
  parentSSCC?: string;

  // Batch-specific fields
  @ApiProperty({
    example: '61640056789012',
    required: false,
    description: 'GTIN - required for batch type items',
  })
  @IsString()
  @IsOptional()
  GTIN?: string;

  @ApiProperty({
    example: 'Metformin 500mg Tablets',
    required: false,
    description: 'Product name - required for batch type items',
  })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiProperty({
    example: '5343545',
    required: false,
    description: 'Batch number - required for batch type items',
  })
  @IsString()
  @IsOptional()
  batchNo?: string;

  @ApiProperty({
    example: 'Active',
    required: false,
    description: 'Batch status - required for batch type items',
  })
  @IsString()
  @IsOptional()
  batchStatus?: string;

  @ApiProperty({
    example: '2024-09-16',
    required: false,
    description: 'Manufacture date - required for batch type items',
  })
  @IsDateString()
  @IsOptional()
  manufactureDate?: string;

  @ApiProperty({
    example: '2027-09-16',
    required: false,
    description: 'Expiry date - required for batch type items',
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Quantity approved by PPB for this consignment - required for batch type items',
  })
  @IsNumber()
  @IsOptional()
  quantityApproved?: number;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Quantity - legacy field, use quantityApproved instead',
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    example: ['KE0010001', 'KE0010002', 'KE0010003'],
    type: [String],
    required: false,
    description: 'Serial numbers - optional for batch type items',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serialNumbers?: string[];

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
  ppbID: string;

  @ApiProperty({ example: '61640056789012', required: false })
  @IsString()
  @IsOptional()
  gln?: string;
}

export class MAHDto {
  @ApiProperty({ example: '34234324' })
  @IsString()
  ppbID: string;

  @ApiProperty({ example: '61640056789013', required: false })
  @IsString()
  @IsOptional()
  gln?: string;
}

export class PPBConsignmentDto {
  @ApiProperty({ example: 'CNS-2025-98765' })
  @IsString()
  consignmentID: string;

  @ApiProperty({ example: '2025-10-25' })
  @IsDateString()
  shipmentDate: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  countryOfOrigin: string;

  @ApiProperty({ example: 'KE' })
  @IsString()
  destinationCountry: string;

  @ApiProperty({ type: ManufacturerDto })
  @ValidateNested()
  @Type(() => ManufacturerDto)
  manufacturer: ManufacturerDto;

  @ApiProperty({ type: MAHDto })
  @ValidateNested()
  @Type(() => MAHDto)
  mah: MAHDto;

  @ApiProperty({ example: '12243324' })
  @IsString()
  registrationNo: string;

  // Legacy fields for backward compatibility
  @ApiProperty({ example: '345345', required: false })
  @IsString()
  @IsOptional()
  manufacturerPPBID?: string;

  @ApiProperty({ example: '34234324', required: false })
  @IsString()
  @IsOptional()
  MAHPPBID?: string;

  @ApiProperty({ example: '345345', required: false })
  @IsString()
  @IsOptional()
  manufacturerGLN?: string;

  @ApiProperty({ example: '34234324', required: false })
  @IsString()
  @IsOptional()
  MAHGLN?: string;

  @ApiProperty({ example: 10000, required: false })
  @IsNumber()
  @IsOptional()
  totalQuantity?: number;

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
