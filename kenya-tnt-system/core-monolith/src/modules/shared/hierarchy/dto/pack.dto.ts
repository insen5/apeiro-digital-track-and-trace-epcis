import { IsArray, IsString, IsOptional, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PackDto {
  @ApiProperty({ description: 'Case IDs to pack into new package', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  caseIds: number[];

  @ApiProperty({ description: 'Shipment ID for the new package' })
  @IsNumber()
  shipmentId: number;

  @ApiProperty({ description: 'Label for the new package', required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ description: 'Notes for this pack operation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PackLiteDto extends PackDto {
  @ApiProperty({ description: 'Indicates this is a lite (small) pack operation' })
  packType: 'LITE' = 'LITE';
}

export class PackLargeDto extends PackDto {
  @ApiProperty({ description: 'Indicates this is a large pack operation' })
  packType: 'LARGE' = 'LARGE';
}

export class UnpackAllDto {
  @ApiProperty({ description: 'Package IDs to unpack', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  packageIds: number[];

  @ApiProperty({ description: 'Notes for this unpack operation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
