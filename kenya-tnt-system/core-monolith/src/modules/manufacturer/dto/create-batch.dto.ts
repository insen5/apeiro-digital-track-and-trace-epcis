import { IsDateString, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ description: 'Product ID (from PPB catalog)' })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ description: 'Batch number (will be generated if not provided)' })
  @IsString()
  @IsOptional()
  batch_no?: string;

  @ApiProperty({ description: 'Expiry date' })
  @IsDateString()
  @IsNotEmpty()
  expiry: Date;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @IsNotEmpty()
  qty: number;
}

