import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CaseProductDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  batch_id: number;

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

  @ApiProperty({
    description: 'SSCC (Serial Shipping Container Code) - 18 digits. Required for case creation.',
    example: '123456789012345678',
  })
  @IsString()
  @IsNotEmpty()
  @Length(18, 18, { message: 'SSCC must be exactly 18 digits' })
  sscc: string;

  @ApiProperty({ type: [CaseProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseProductDto)
  products: CaseProductDto[];
}

