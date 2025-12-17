import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiTopicConsumerService } from './multi-topic-consumer.service';
import { MasterDataModule } from '../../../modules/shared/master-data/master-data.module';
import { ConsignmentsModule } from '../../../modules/shared/consignments/consignment.module';

/**
 * Kafka Module
 * 
 * Handles Kafka message consumption for:
 * - PPB consignment instantiation (full consignment JSON)
 * - Master data sync (manufacturers, suppliers, premises)
 * 
 * Note: PPB batch data is no longer processed separately - all PPB data
 * comes via consignment JSON through ConsignmentService.
 */
@Module({
  imports: [
    ConfigModule,
    MasterDataModule, // For MasterDataService
    ConsignmentsModule, // For ConsignmentService (PPB consignment import)
  ],
  providers: [MultiTopicConsumerService],
  exports: [MultiTopicConsumerService],
})
export class KafkaModule {}

