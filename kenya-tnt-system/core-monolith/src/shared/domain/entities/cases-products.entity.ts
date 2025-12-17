import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';
import { Batch } from './batch.entity';
import { PPBProduct } from './ppb-product.entity';

@Entity('cases_products')
export class CasesProducts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'caseId' })
  caseId: number;

  @ManyToOne(() => Case, (cases) => cases.products)
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column({ name: 'productId' })
  productId: number;

  @ManyToOne(() => PPBProduct)
  @JoinColumn({ name: 'productId' })
  product: PPBProduct;

  @Column({ name: 'batchId' })
  batchId: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column('decimal', { precision: 15, scale: 2 }) // FIXED: NUMERIC instead of VARCHAR
  qty: number;

  @Column({ name: 'fromNumber' })
  fromNumber: number;

  @Column()
  count: number;
}

