import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseService } from './case.service';
import { Case } from '../../../shared/domain/entities/case.entity';
import { Batch } from '../../../shared/domain/entities/batch.entity';
import { CasesProducts } from '../../../shared/domain/entities/cases-products.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';
import { MasterDataModule } from '../master-data/master-data.module';

/**
 * Shared Cases Module
 * 
 * Provides case creation and SSCC assignment services.
 * Used by manufacturers, distributors, and consignment import.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Batch, CasesProducts, Package, User]),
    GS1Module,
    MasterDataModule,
  ],
  providers: [CaseService],
  exports: [CaseService], // Export for use in manufacturer/distributor controllers
})
export class CasesModule {}

