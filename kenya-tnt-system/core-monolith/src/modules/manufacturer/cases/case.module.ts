import { Module } from '@nestjs/common';
import { CasesModule as SharedCasesModule } from '../../shared/cases/case.module';
import { ManufacturerCaseController } from './case.controller';

/**
 * Manufacturer Cases Module
 * 
 * Thin wrapper that provides manufacturer-specific endpoints.
 * Uses shared CaseService.
 */
@Module({
  imports: [SharedCasesModule], // Import shared cases module
  controllers: [ManufacturerCaseController],
  exports: [SharedCasesModule], // Re-export for backward compatibility
})
export class CasesModule {}
