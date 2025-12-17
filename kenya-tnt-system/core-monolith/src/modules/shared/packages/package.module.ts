import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageService } from './package.service';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';
import { MasterDataModule } from '../master-data/master-data.module';

/**
 * Shared Packages Module
 * 
 * Provides package creation and SSCC assignment services.
 * Used by manufacturers (create packages) and distributors (repackage, assign SSCC).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Package, Case, User]),
    GS1Module,
    MasterDataModule,
  ],
  providers: [PackageService],
  exports: [PackageService], // Export for use in manufacturer/distributor controllers
})
export class PackagesModule {}

