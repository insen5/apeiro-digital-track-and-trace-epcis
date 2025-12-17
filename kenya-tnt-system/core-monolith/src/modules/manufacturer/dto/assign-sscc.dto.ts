import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSSCCDto {
  @ApiProperty({
    description: 'Optional SSCC. If not provided, a new SSCC will be generated',
    required: false,
    example: '123456789012345678',
  })
  @IsOptional()
  @IsString()
  @Length(18, 18, { message: 'SSCC must be exactly 18 digits' })
  sscc?: string;
}

