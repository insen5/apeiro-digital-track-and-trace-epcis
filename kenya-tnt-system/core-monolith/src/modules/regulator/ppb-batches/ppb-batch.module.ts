import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PPBBatch } from '../../../shared/domain/entities/ppb-batch.entity';
import { PPBBatchController } from './ppb-batch.controller';
import { ConsignmentsModule } from '../../shared/consignments/consignment.module'; // Use shared module

/**
 * PPB Consignments Module (Regulator)
 * 
 * Rationalized module - batches are viewed as part of consignments.
 * - ppb_batches table is used for metadata storage only (written by ConsignmentService)
 * - All endpoints use ConsignmentService
 * - No separate batch endpoints (batches are nested in consignments)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PPBBatch]), // Keep for metadata storage
    ConsignmentsModule, // For ConsignmentService
  ],
  controllers: [PPBBatchController],
  // No providers needed - all functionality via ConsignmentService
})
export class PPBBatchesModule {}

