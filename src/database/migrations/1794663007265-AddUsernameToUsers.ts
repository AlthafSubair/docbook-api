import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameToUsers1794663007265 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN username VARCHAR(50);
    `);

    // Backfill any existing users if present
    await queryRunner.query(`
      UPDATE users
      SET username = LOWER(SPLIT_PART(full_name, ' ', 1))
      WHERE username IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN username SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_users_clinic_username
      ON users (clinic_id, LOWER(username))
      WHERE deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_users_clinic_username;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS username;
    `);
  }
}
