import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('facility_administrators')
export class FacilityAdministrator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'facility_code', type: 'varchar', length: 100 })
  facilityCode: string;

  @Column({ name: 'facility_source', type: 'varchar', length: 10 })
  facilitySource: 'UAT' | 'PROD';

  @Column({ name: 'administrator_name', type: 'varchar', length: 500, nullable: true })
  administratorName: string;

  @Column({ name: 'administrator_email', type: 'varchar', length: 255, nullable: true })
  administratorEmail: string;

  @Column({ name: 'administrator_phone', type: 'varchar', length: 50, nullable: true })
  administratorPhone: string;

  @Column({ name: 'administrator_identifier', type: 'varchar', length: 100, nullable: true })
  administratorIdentifier: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
