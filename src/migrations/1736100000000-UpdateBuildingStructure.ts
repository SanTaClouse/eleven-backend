import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBuildingStructure1736100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna floorsCount existe
    const hasFloorsCount = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'buildings' AND column_name = 'floorsCount'`,
    );

    // Verificar si stops ya existe
    const hasStops = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'buildings' AND column_name = 'stops'`,
    );

    // Caso 1: floorsCount existe y stops no existe -> renombrar
    if (hasFloorsCount.length > 0 && hasStops.length === 0) {
      // Antes de renombrar, actualizar cualquier valor NULL a 0
      await queryRunner.query(
        `UPDATE "buildings" SET "floorsCount" = 0 WHERE "floorsCount" IS NULL`,
      );

      // Renombrar la columna
      await queryRunner.query(
        `ALTER TABLE "buildings" RENAME COLUMN "floorsCount" TO "stops"`,
      );
    }
    // Caso 2: stops existe pero floorsCount también (synchronize pudo haber creado stops)
    else if (hasFloorsCount.length > 0 && hasStops.length > 0) {
      // Copiar datos de floorsCount a stops si stops está vacío
      await queryRunner.query(
        `UPDATE "buildings" SET "stops" = "floorsCount" WHERE "stops" IS NULL`,
      );

      // Eliminar floorsCount
      await queryRunner.query(
        `ALTER TABLE "buildings" DROP COLUMN "floorsCount"`,
      );
    }
    // Caso 3: Solo stops existe -> asegurar que no hay NULLs
    else if (hasStops.length > 0) {
      await queryRunner.query(
        `UPDATE "buildings" SET "stops" = 0 WHERE "stops" IS NULL`,
      );
    }

    // Verificar si carLifts ya existe
    const hasCarLifts = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'buildings' AND column_name = 'carLifts'`,
    );

    // Agregar columna carLifts solo si no existe
    if (hasCarLifts.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "buildings" ADD COLUMN "carLifts" integer NULL`,
      );
    }

    // Verificar si gates ya existe
    const hasGates = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'buildings' AND column_name = 'gates'`,
    );

    // Agregar columna gates solo si no existe
    if (hasGates.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "buildings" ADD COLUMN "gates" integer NULL`,
      );
    }

    // Agregar constraints solo si no existen
    const constraints = await queryRunner.query(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'buildings' AND constraint_name IN ('CHK_stops_positive', 'CHK_carLifts_positive', 'CHK_gates_positive')`,
    );

    const existingConstraints = constraints.map((c: any) => c.constraint_name);

    if (!existingConstraints.includes('CHK_stops_positive')) {
      await queryRunner.query(
        `ALTER TABLE "buildings" ADD CONSTRAINT "CHK_stops_positive" CHECK ("stops" >= 0)`,
      );
    }

    if (!existingConstraints.includes('CHK_carLifts_positive')) {
      await queryRunner.query(
        `ALTER TABLE "buildings" ADD CONSTRAINT "CHK_carLifts_positive" CHECK ("carLifts" IS NULL OR "carLifts" >= 0)`,
      );
    }

    if (!existingConstraints.includes('CHK_gates_positive')) {
      await queryRunner.query(
        `ALTER TABLE "buildings" ADD CONSTRAINT "CHK_gates_positive" CHECK ("gates" IS NULL OR "gates" >= 0)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar constraints
    await queryRunner.query(
      `ALTER TABLE "buildings" DROP CONSTRAINT IF EXISTS "CHK_gates_positive"`,
    );

    await queryRunner.query(
      `ALTER TABLE "buildings" DROP CONSTRAINT IF EXISTS "CHK_carLifts_positive"`,
    );

    await queryRunner.query(
      `ALTER TABLE "buildings" DROP CONSTRAINT IF EXISTS "CHK_stops_positive"`,
    );

    // Eliminar columnas nuevas
    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "gates"`);

    await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "carLifts"`);

    // Renombrar stops de vuelta a floorsCount
    await queryRunner.query(
      `ALTER TABLE "buildings" RENAME COLUMN "stops" TO "floorsCount"`,
    );
  }
}
