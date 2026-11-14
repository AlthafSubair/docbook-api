import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Clinic } from '../../clinics/entities/clinic.entity.js';
import { UserRole } from '../enums/user.enums.js';

@Entity({ name: 'users' })
@Index('idx_users_clinic_id', ['clinicId'])
export class User {
  @PrimaryGeneratedColumn('identity', {
    name: 'user_id',
    type: 'bigint',
  })
  userId!: string;

  @Column({
    name: 'clinic_id',
    type: 'bigint',
  })
  clinicId!: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 150,
  })
  fullName!: string;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 50,
  })
  username!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
  })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
  })
  passwordHash!: string;

  @Column({
    name: 'is_email_verified',
    type: 'boolean',
    default: false,
  })
  isEmailVerified!: boolean;

  @Column({
    name: 'is_phone_verified',
    type: 'boolean',
    default: false,
  })
  isPhoneVerified!: boolean;

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

  @ManyToOne(() => Clinic, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic?: Clinic;
}
