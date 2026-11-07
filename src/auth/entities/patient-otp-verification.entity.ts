import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Entity class representing patient OTP (One-Time Password) verifications in the database.
 * This entity stores information related to OTP verification processes for patients.
 */

@Entity({ name: 'patient_otp_verifications' })
@Index('idx_patient_otp_phone_created', ['phone', 'createdAt']) // Index for optimizing queries by phone and creation date
export class PatientOtpVerification {
  @PrimaryGeneratedColumn('identity', {
    name: 'otp_id',
    type: 'bigint',
  })
  otpId!: string;

  @Column({
    name: 'phone',
    type: 'varchar',
  /**
   * Column to store the patient's phone number associated with the OTP.
   * Maximum length of 20 characters.
   */
    length: 20,
  })
  phone!: string;

  @Column({
    name: 'otp_hash',
    type: 'varchar',
    length: 255,
  })
  otpHash!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'attempts_count',
    type: 'int',
    default: 0,
  })
  attemptsCount!: number;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt!: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt!: Date;
}
