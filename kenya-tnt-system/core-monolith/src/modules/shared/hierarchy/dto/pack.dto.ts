import { IsArray, IsString, IsOptional, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PackDto {
  @ApiProperty({ description: 'Case IDs to pack into new package', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  case_ids: number[];

  @ApiProperty({ description: 'Shipment ID for the new package' })
  @IsNumber()
  shipment_id: number;

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
  pack_type: 'LITE' = 'LITE';
}

export class PackLargeDto extends PackDto {
  @ApiProperty({ description: 'Indicates this is a large pack operation' })
  pack_type: 'LARGE' = 'LARGE';
}

export class UnpackAllDto {
  @ApiProperty({ description: 'Package IDs to unpack', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  package_ids: number[];

  @ApiProperty({ description: 'Notes for this unpack operation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
