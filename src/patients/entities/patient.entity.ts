import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'patients' })
@Index('idx_patients_phone', ['phone'])
export class Patient {
  @PrimaryGeneratedColumn('identity', {
    name: 'patient_id',
    type: 'bigint',
  })
  patientId!: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 20,
  })
  phone!: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 150,
  })
  fullName!: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email!: string | null;

  @Column({
    name: 'dob',
    type: 'date',
    nullable: true,
  })
  dob!: string | null;

  @Column({
    name: 'sex',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  sex!: string | null;

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
