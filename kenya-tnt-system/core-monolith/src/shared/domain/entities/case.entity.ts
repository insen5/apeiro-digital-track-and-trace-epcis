import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Package } from './package.entity';
import { CasesProducts } from './cases-products.entity';
import { User } from './user.entity';

@Entity('case')
@Unique(['user_id', 'label'])
@Unique(['user_id', 'event_id'])
export class Case extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column()
  package_id: number;

  @ManyToOne(() => Package, (pkg) => pkg.cases)
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @OneToMany(() => CasesProducts, (cp) => cp.case, {
    cascade: true,
  })
  products: CasesProducts[];

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  event_id?: string;

  @Column({ default: false })
  is_dispatched: boolean;

  @Column({ nullable: true, name: 'sscc_barcode' })
  sscc_barcode?: string;

  @Column({ nullable: true, name: 'sscc_generated_at', type: 'timestamp' })
  sscc_generated_at?: Date;
}

