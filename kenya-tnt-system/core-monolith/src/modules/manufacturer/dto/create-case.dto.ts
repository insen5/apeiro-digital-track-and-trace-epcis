import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CaseProductDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  batchId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  qty: number;
}

export class CreateCaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ type: [CaseProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseProductDto)
  products: CaseProductDto[];
}

