
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'clinics' })
export class Clinic {
  @PrimaryGeneratedColumn('identity', {
    name: 'clinic_id',
    type: 'bigint',
  })
  clinicId!: string;

  @Column({
    name: 'clinic_name',
    type: 'varchar',
    length: 150,
  })
  clinicName!: string;

  @Column({
    name: 'slug',
    type: 'varchar',
    length: 180,
  })
  slug!: string;

  @Column({
    name: 'clinic_phone',
    type: 'varchar',
    length: 20,
  })
  clinicPhone!: string;

  @Column({
    name: 'clinic_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  clinicEmail!: string | null;

  @Column({
    name: 'address',
    type: 'text',
    nullable: true,
  })
  address!: string | null;

  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude!: string | null;

  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude!: string | null;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'Asia/Kolkata',
  })
  timezone!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt!: Date | null;
}
