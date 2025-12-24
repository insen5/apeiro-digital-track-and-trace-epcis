import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FacilityEventType {
  RECEIVED = 'received',
  CONSUMED = 'consumed',
  DISPENSED = 'dispensed',
  RETURNED = 'returned',
}

export class ProductIdentifierDto {
  @ApiProperty({
    example: '61640056789012',
    description: 'GTIN of the product',
  })
  @IsString()
  gtin: string;

  @ApiProperty({
    example: '5343545',
    description: 'Batch/Lot number',
    required: false,
  })
  @IsString()
  @IsOptional()
  batch_no?: string;

  @ApiProperty({
    example: ['KE0010001', 'KE0010002'],
    description: 'Serial numbers (for unit-level tracking)',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serial_numbers?: string[];

  @ApiProperty({
    example: '123456789012345681',
    description: 'SSCC of the container (case/package)',
    required: false,
  })
  @IsString()
  @IsOptional()
  sscc?: string;
}

export class ReceivedEventDto {
  @ApiProperty({
    example: 'FAC-2025-001',
    description: 'Unique event ID from FLMIS',
  })
  @IsString()
  event_id: string;

  @ApiProperty({
    example: '2025-01-15T10:30:00Z',
    description: 'Timestamp when product was received',
  })
  @IsDateString()
  event_timestamp: string;

  @ApiProperty({
    example: '61640056789012',
    description: 'GLN of the facility receiving the product',
  })
  @IsString()
  facility_gln: string;

  @ApiProperty({
    example: 'FACILITY-001',
    description: 'Facility identifier',
    required: false,
  })
  @IsString()
  @IsOptional()
  facility_id?: string;

  @ApiProperty({
    type: [ProductIdentifierDto],
    description: 'Products received',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIdentifierDto)
  products: ProductIdentifierDto[];

  @ApiProperty({
    example: '123456789012345679',
    description: 'SSCC of the shipment received',
    required: false,
  })
  @IsString()
  @IsOptional()
  shipment_sscc?: string;

  @ApiProperty({
    example: 'Receiving dock A',
    description: 'Location where product was received',
    required: false,
  })
  @IsString()
  @IsOptional()
  read_point?: string;

  @ApiProperty({
    example: 'Warehouse A',
    description: 'Business location where product is stored',
    required: false,
  })
  @IsString()
  @IsOptional()
  biz_location?: string;

  @ApiProperty({
    example: { carrier: 'ABC Logistics', trackingNumber: 'TRK123' },
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConsumedEventDto {
  @ApiProperty({
    example: 'FAC-2025-002',
    description: 'Unique event ID from FLMIS',
  })
  @IsString()
  event_id: string;

  @ApiProperty({
    example: '2025-01-15T14:30:00Z',
    description: 'Timestamp when product was consumed',
  })
  @IsDateString()
  event_timestamp: string;

  @ApiProperty({
    example: '61640056789012',
    description: 'GLN of the facility where product was consumed',
  })
  @IsString()
  facility_gln: string;

  @ApiProperty({
    example: 'FACILITY-001',
    description: 'Facility identifier',
    required: false,
  })
  @IsString()
  @IsOptional()
  facility_id?: string;

  @ApiProperty({
    type: [ProductIdentifierDto],
    description: 'Products consumed',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIdentifierDto)
  products: ProductIdentifierDto[];

  @ApiProperty({
    example: 'Dispensing counter 1',
    description: 'Location where product was consumed',
    required: false,
  })
  @IsString()
  @IsOptional()
  read_point?: string;

  @ApiProperty({
    example: 'Pharmacy',
    description: 'Business location where product was consumed',
    required: false,
  })
  @IsString()
  @IsOptional()
  biz_location?: string;

  @ApiProperty({
    example: 'PATIENT-12345',
    description: 'Patient identifier (if applicable)',
    required: false,
  })
  @IsString()
  @IsOptional()
  patient_id?: string;

  @ApiProperty({
    example: { prescriptionNumber: 'RX-001', doctorId: 'DOC-123' },
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

