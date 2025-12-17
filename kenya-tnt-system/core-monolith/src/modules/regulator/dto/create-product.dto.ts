import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Name of the product' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ description: 'Brand Name of the product' })
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @ApiProperty({
    description: 'Global Trade Item Number (GTIN)',
    example: '0123456789012',
  })
  @IsString()
  @IsNotEmpty()
  gtin: string;
}

