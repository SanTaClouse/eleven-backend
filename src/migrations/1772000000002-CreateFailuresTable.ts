import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFailuresTable1772000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "failures" (
        "id"                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "buildingId"           UUID NOT NULL REFERENCES "buildings"("id") ON DELETE CASCADE,
        "description"          TEXT NOT NULL,
        "reporterName"         VARCHAR(255),
        "reportedByUserId"     UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "source"               VARCHAR(20) NOT NULL,
        "reportedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_failures_buildingId" ON "failures" ("buildingId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "failures"`);
  }
}
