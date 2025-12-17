import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum ProductStatusEnum {
  ACTIVE = 'ACTIVE',
  LOST = 'LOST',
  STOLEN = 'STOLEN',
  DAMAGED = 'DAMAGED',
  SAMPLE = 'SAMPLE',
  EXPORT = 'EXPORT',
  DISPENSING = 'DISPENSING',
}

export class CreateProductStatusDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  productId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  batchId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sgtin?: string;

  @ApiProperty({ enum: ProductStatusEnum })
  @IsEnum(ProductStatusEnum)
  status: ProductStatusEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  actorType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

