import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ description: 'Product ID (from PPB catalog)' })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Batch number (will be generated if not provided)' })
  @IsString()
  batchno?: string;

  @ApiProperty({ description: 'Expiry date' })
  @IsDateString()
  @IsNotEmpty()
  expiry: Date;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @IsNotEmpty()
  qty: number;
}

