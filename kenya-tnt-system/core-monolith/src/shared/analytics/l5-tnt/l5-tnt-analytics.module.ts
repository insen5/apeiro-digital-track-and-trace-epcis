import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStatus } from '../../domain/entities/product-status.entity';
import { ProductDestruction } from '../../domain/entities/product-destruction.entity';
import { ProductReturns } from '../../domain/entities/product-returns.entity';
import { ProductVerifications } from '../../domain/entities/product-verifications.entity';
import { FacilityReceiving } from '../../domain/entities/facility-receiving.entity';
import { FacilityDispensing } from '../../domain/entities/facility-dispensing.entity';
import { FacilityInventory } from '../../domain/entities/facility-inventory.entity';
import { User } from '../../domain/entities/user.entity';
import { Batch } from '../../domain/entities/batch.entity';
import { PPBProduct } from '../../domain/entities/ppb-product.entity';
import { ProductStatusService } from './product-status.service';
import { ProductDestructionService } from './product-destruction.service';
import { ProductReturnsService } from './product-returns.service';
import { ProductVerificationsService } from './product-verifications.service';
import { FacilityOperationsService } from './facility-operations.service';
import { ProductStatusController } from './product-status.controller';
import { ProductDestructionController } from './product-destruction.controller';
import { ProductReturnsController } from './product-returns.controller';
import { ProductVerificationsController } from './product-verifications.controller';
import { FacilityOperationsController } from './facility-operations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductStatus,
      ProductDestruction,
      ProductReturns,
      ProductVerifications,
      FacilityReceiving,
      FacilityDispensing,
      FacilityInventory,
      User, // Required by ProductStatusService
      Batch, // Required by ProductReturnsService and ProductDestructionService
      PPBProduct, // Required by ProductReturnsService
    ]),
  ],
  providers: [
    ProductStatusService,
    ProductDestructionService,
    ProductReturnsService,
    ProductVerificationsService,
    FacilityOperationsService,
  ],
  controllers: [
    ProductStatusController,
    ProductDestructionController,
    ProductReturnsController,
    ProductVerificationsController,
    FacilityOperationsController,
  ],
  exports: [
    ProductStatusService,
    ProductDestructionService,
    ProductReturnsService,
    ProductVerificationsService,
    FacilityOperationsService,
  ],
})
export class L5TNTAnalyticsModule {}

