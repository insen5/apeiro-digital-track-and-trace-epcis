import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveShipmentDto {
  @ApiProperty({ description: 'Parent SSCC from manufacturer' })
  @IsString()
  @IsNotEmpty()
  ssccBarcode: string;

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
}

