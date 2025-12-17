import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HierarchyService } from './hierarchy.service';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyChange } from '../../../shared/domain/entities/hierarchy-change.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { CasesProducts } from '../../../shared/domain/entities/cases-products.entity';
import { GS1Module } from '../../../shared/gs1/gs1.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HierarchyChange,
      Package,
      Case,
      CasesProducts,
    ]),
    GS1Module,
  ],
  controllers: [HierarchyController],
  providers: [HierarchyService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
