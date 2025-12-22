import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add 'name' column to 'buildings' table
 *
 * Purpose: Add a name field to identify buildings by a short name (e.g., "CAM2")
 * in addition to the full address.
 *
 * Safety: This migration uses ALTER TABLE to add the column without affecting
 * existing data. The column is nullable to ensure compatibility with existing records.
 */
export class AddNameColumnToBuildings1766407300000 implements MigrationInterface {
  name = 'AddNameColumnToBuildings1766407300000';

  /**
   * up() - Applies the migration
   *
   * What it does:
   * 1. Adds a new column 'name' to the 'buildings' table
   * 2. Type: varchar(150) - allows short building names
   * 3. Nullable: true - existing records won't break (they'll have NULL)
   * 4. No default value - explicit NULL for existing records
   *
   * Safe for production: ✅
   * - Uses ALTER TABLE (doesn't recreate the table)
   * - Doesn't modify existing data
   * - Doesn't require downtime
   * - PostgreSQL compatible
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'buildings',
      new TableColumn({
        name: 'name',
        type: 'varchar',
        length: '150',
        isNullable: true,
        comment: 'Short name or identifier for the building (e.g., CAM2)',
      }),
    );

    // Optional: Add an index for faster searches by name
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_buildings_name" ON "buildings" ("name")`,
    // );
  }

  /**
   * down() - Reverts the migration
   *
   * What it does:
   * 1. Removes the 'name' column from the 'buildings' table
   * 2. Data in this column will be permanently lost
   *
   * Use case: Rollback in case of issues
   *
   * Warning: ⚠️ Running down() will DELETE all building names
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional: Drop the index if you created it
    // await queryRunner.query(`DROP INDEX "IDX_buildings_name"`);

    await queryRunner.dropColumn('buildings', 'name');
  }
}
