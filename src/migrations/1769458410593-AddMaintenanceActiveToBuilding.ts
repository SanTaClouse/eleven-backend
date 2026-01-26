import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaintenanceActiveToBuilding1769458410593 implements MigrationInterface {
    name = 'AddMaintenanceActiveToBuilding1769458410593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buildings" ADD "maintenanceActive" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buildings" DROP COLUMN "maintenanceActive"`);
    }
}