import { MigrationInterface, QueryRunner } from "typeorm";

export class RenamePriceToUnitPriceInBuildings1773000000000 implements MigrationInterface {
    name = 'RenamePriceToUnitPriceInBuildings1773000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buildings" RENAME COLUMN "price" TO "unit_price"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buildings" RENAME COLUMN "unit_price" TO "price"`);
    }
}
