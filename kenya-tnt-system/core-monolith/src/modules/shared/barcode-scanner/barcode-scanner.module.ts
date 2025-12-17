import { Module } from '@nestjs/common';
import { BarcodeScannerController } from './barcode-scanner.controller';
import { GS1Module } from '../../../shared/gs1/gs1.module';

@Module({
  imports: [GS1Module],
  controllers: [BarcodeScannerController],
})
export class BarcodeScannerModule {}
