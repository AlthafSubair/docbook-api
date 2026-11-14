import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAllRefreshTokensTables1794669000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop clinic_refresh_tokens trigger and table if exists
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_clinic_refresh_tokens_updated_at ON clinic_refresh_tokens;
      DROP TABLE IF EXISTS clinic_refresh_tokens CASCADE;
    `);

    // Drop patient_refresh_tokens trigger and table if exists
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_patient_refresh_tokens_updated_at ON patient_refresh_tokens;
      DROP TABLE IF EXISTS patient_refresh_tokens CASCADE;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Pure stateless JWT architecture: refresh tokens are verified cryptographically
    // and stored in HttpOnly cookies / client sessions without database persistence.
  }
}
