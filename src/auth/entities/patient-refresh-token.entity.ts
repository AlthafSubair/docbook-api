import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'patient_refresh_tokens' })
@Index('idx_patient_refresh_tokens_phone', ['phone'])
export class PatientRefreshToken {
  @PrimaryGeneratedColumn('identity', {
    name: 'token_id',
    type: 'bigint',
  })
  tokenId!: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 20,
  })
  phone!: string;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 255,
  })
  tokenHash!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'is_revoked',
    type: 'boolean',
    default: false,
  })
  isRevoked!: boolean;

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
}
