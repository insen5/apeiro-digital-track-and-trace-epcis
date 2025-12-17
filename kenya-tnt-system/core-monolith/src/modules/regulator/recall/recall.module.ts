import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecallService } from './recall.service';
import { RecallController } from './recall.controller';
import { RecallRequest } from '../../../shared/domain/entities/recall-request.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecallRequest, Batch])],
  providers: [RecallService],
  controllers: [RecallController],
  exports: [RecallService],
})
export class RecallModule {}

