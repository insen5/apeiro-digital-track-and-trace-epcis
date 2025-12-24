import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveShipmentDto {
  @ApiProperty({ description: 'Parent SSCC from manufacturer' })
  @IsString()
  @IsNotEmpty()
  sscc_barcode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  pickup_date: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  expected_delivery_date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickup_location: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destination_address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carrier: string;
}

