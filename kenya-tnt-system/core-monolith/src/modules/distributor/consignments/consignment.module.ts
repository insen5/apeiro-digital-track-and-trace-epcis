import { Module } from '@nestjs/common';
import { ConsignmentsModule as SharedConsignmentsModule } from '../../shared/consignments/consignment.module';
import { DistributorConsignmentController } from './consignment.controller';

/**
 * Distributor Consignments Module
 * 
 * Thin wrapper that provides distributor-specific query endpoints.
 * Uses shared ConsignmentService with distributor filtering.
 */
@Module({
  imports: [SharedConsignmentsModule], // Import shared consignments module
  controllers: [DistributorConsignmentController],
  exports: [SharedConsignmentsModule], // Re-export for backward compatibility
})
export class DistributorConsignmentsModule {}

