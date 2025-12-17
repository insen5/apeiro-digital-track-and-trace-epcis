import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForwardShipmentDto {
  @ApiProperty({ description: 'Received shipment ID to forward' })
  @IsNumber()
  @IsNotEmpty()
  receivedShipmentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  pickupDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  expectedDeliveryDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerId?: string;
}

