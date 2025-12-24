import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Supplier } from './supplier.entity';

/**
 * SupplierRole - Normalized supplier roles
 * 
 * Created by V07 migration to normalize the roles array from suppliers table.
 * Allows suppliers to have multiple roles without JSONB arrays.
 */
@Entity('supplier_roles')
@Unique(['supplierId', 'role'])
export class SupplierRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'supplier_id' })
  supplierId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'varchar', length: 50 })
  role: string; // e.g., "National Distributor", "Wholesaler", "Importer"
}




