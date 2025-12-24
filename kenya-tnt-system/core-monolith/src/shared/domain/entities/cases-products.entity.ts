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

  @Column()
  case_id: number;

  @ManyToOne(() => Case, (cases) => cases.products)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column()
  product_id: number;

  @ManyToOne(() => PPBProduct)
  @JoinColumn({ name: 'product_id' })
  product: PPBProduct;

  @Column()
  batch_id: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column('decimal', { precision: 15, scale: 2 }) // FIXED: NUMERIC instead of VARCHAR
  qty: number;

  @Column()
  from_number: number;

  @Column()
  count: number;
}

