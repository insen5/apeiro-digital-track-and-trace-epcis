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
  supplierId?: number;

  @ApiProperty({ 
    required: false,
    description: 'Premise ID from master data (pickup/destination location)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  premiseId?: number;

  @ApiProperty({ 
    required: false,
    description: 'Logistics Provider ID from master data (carrier)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  logisticsProviderId?: number;

  // Legacy fields (for backward compatibility - required if master data IDs not provided)
  @ApiProperty({ 
    required: false,
    description: 'Customer name (required if supplierId not provided)',
  })
  @IsString()
  @IsOptional()
  customer?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  pickupDate: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  expectedDeliveryDate: Date;

  @ApiProperty({ 
    required: false,
    description: 'Pickup location (required if premiseId not provided)',
  })
  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @ApiProperty({ 
    required: false,
    description: 'Destination address (required if premiseId not provided)',
  })
  @IsString()
  @IsOptional()
  destinationAddress?: string;

  @ApiProperty({ 
    required: false,
    description: 'Carrier name (required if logisticsProviderId not provided)',
  })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  packageIds: number[];

  @ApiProperty({ 
    required: false,
    description: 'Optional SSCC. If not provided, a new SSCC will be auto-generated',
    example: '123456789012345678',
  })
  @IsString()
  @IsOptional()
  ssccBarcode?: string;
}

