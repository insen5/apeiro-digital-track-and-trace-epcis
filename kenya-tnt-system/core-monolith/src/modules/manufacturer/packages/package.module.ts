import { Module } from '@nestjs/common';
import { PackagesModule as SharedPackagesModule } from '../../shared/packages/package.module';
import { ManufacturerPackageController } from './package.controller';

/**
 * Manufacturer Packages Module
 * 
 * Thin wrapper that provides manufacturer-specific endpoints.
 * Uses shared PackageService.
 */
@Module({
  imports: [SharedPackagesModule], // Import shared packages module
  controllers: [ManufacturerPackageController],
  exports: [SharedPackagesModule], // Re-export for backward compatibility
})
export class PackagesModule {}
