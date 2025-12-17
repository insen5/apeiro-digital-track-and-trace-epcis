import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';
import { MasterDataModule } from '../../shared/master-data/master-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Batch]),
    GS1Module,
    MasterDataModule, // Provides MasterDataService to verify products exist in database
  ],
  providers: [BatchService],
  controllers: [BatchController],
  exports: [BatchService],
})
export class BatchesModule {}

