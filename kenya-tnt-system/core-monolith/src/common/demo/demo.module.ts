import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { GS1Module } from '../../shared/gs1/gs1.module';

@Module({
  imports: [GS1Module],
  controllers: [DemoController],
})
export class DemoModule {}

