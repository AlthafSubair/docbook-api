import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationshipToPatients1794417828992 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE patients
      ADD COLUMN relationship VARCHAR(50) DEFAULT 'self';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE patients
      DROP COLUMN IF EXISTS relationship;
    `);
  }
}
