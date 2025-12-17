import { Module } from '@nestjs/common';
import { ConsignmentsModule as SharedConsignmentsModule } from '../../shared/consignments/consignment.module';
import { ManufacturerConsignmentController } from './consignment.controller';

/**
 * Manufacturer Consignments Module
 * 
 * Thin wrapper that provides manufacturer-specific endpoints.
 * Uses shared ConsignmentService with manufacturer filtering.
 */
@Module({
  imports: [SharedConsignmentsModule], // Import shared consignments module
  controllers: [ManufacturerConsignmentController],
  exports: [SharedConsignmentsModule], // Re-export for backward compatibility
})
export class ConsignmentsModule {}

