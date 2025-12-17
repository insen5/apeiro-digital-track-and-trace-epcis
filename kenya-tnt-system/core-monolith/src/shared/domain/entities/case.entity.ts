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
@Unique(['userId', 'label'])
@Unique(['userId', 'eventId'])
export class Case extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ name: 'packageId' })
  packageId: number;

  @ManyToOne(() => Package, (pkg) => pkg.cases)
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @OneToMany(() => CasesProducts, (cp) => cp.case, {
    cascade: true,
  })
  products: CasesProducts[];

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'eventId', nullable: true })
  eventId?: string;

  @Column({ name: 'isDispatched', default: false })
  isDispatched: boolean;

  @Column({ nullable: true, name: 'sscc_barcode' })
  ssccBarcode?: string;

  @Column({ nullable: true, name: 'sscc_generated_at', type: 'timestamp' })
  ssccGeneratedAt?: Date;
}

