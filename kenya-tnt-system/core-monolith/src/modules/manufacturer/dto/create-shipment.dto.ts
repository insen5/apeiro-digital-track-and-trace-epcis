import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  // Master Data References (preferred)
  @ApiProperty({ 
    required: false,
    description: 'Supplier ID from master data (customer)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  supplier_id?: number;

  @ApiProperty({ 
    required: false,
    description: 'Premise ID from master data (pickup/destination location)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  premise_id?: number;

  @ApiProperty({ 
    required: false,
    description: 'Logistics Provider ID from master data (carrier)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  logistics_provider_id?: number;

  // Legacy fields (for backward compatibility - required if master data IDs not provided)
  @ApiProperty({ 
    required: false,
    description: 'Customer name (required if supplier_id not provided)',
  })
  @IsString()
  @IsOptional()
  customer?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  pickup_date: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  expected_delivery_date: Date;

  @ApiProperty({ 
    required: false,
    description: 'Pickup location (required if premise_id not provided)',
  })
  @IsString()
  @IsOptional()
  pickup_location?: string;

  @ApiProperty({ 
    required: false,
    description: 'Destination address (required if premise_id not provided)',
  })
  @IsString()
  @IsOptional()
  destination_address?: string;

  @ApiProperty({ 
    required: false,
    description: 'Carrier name (required if logistics_provider_id not provided)',
  })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  package_ids: number[];

  @ApiProperty({ 
    required: false,
    description: 'Optional SSCC. If not provided, a new SSCC will be auto-generated',
    example: '123456789012345678',
  })
  @IsString()
  @IsOptional()
  sscc_barcode?: string;
}

