import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForwardShipmentDto {
  @ApiProperty({ description: 'Received shipment ID to forward' })
  @IsNumber()
  @IsNotEmpty()
  received_shipment_id: number;

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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customer_id?: string;
}

