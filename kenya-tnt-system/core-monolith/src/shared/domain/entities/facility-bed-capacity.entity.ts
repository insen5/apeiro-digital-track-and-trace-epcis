import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('facility_bed_capacity')
export class FacilityBedCapacity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'facility_code', type: 'varchar', length: 100 })
  facilityCode: string;

  @Column({ name: 'facility_source', type: 'varchar', length: 10 })
  facilitySource: 'UAT' | 'PROD';

  @Column({ name: 'total_beds', type: 'int', default: 0 })
  totalBeds: number;

  @Column({ name: 'normal_beds', type: 'int', default: 0 })
  normalBeds: number;

  @Column({ name: 'icu_beds', type: 'int', default: 0 })
  icuBeds: number;

  @Column({ name: 'hdu_beds', type: 'int', default: 0 })
  hduBeds: number;

  @Column({ name: 'dialysis_beds', type: 'int', default: 0 })
  dialysisBeds: number;

  @Column({ name: 'number_of_cots', type: 'int', default: 0 })
  numberOfCots: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
