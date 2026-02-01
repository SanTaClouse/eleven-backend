import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddExecutedAtToWorkOrders1738400000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("work_orders");

        // Add executedAt column only if it doesn't exist
        const hasExecutedAt = table?.columns.find(col => col.name === "executedAt");
        if (!hasExecutedAt) {
            await queryRunner.addColumn("work_orders", new TableColumn({
                name: "executedAt",
                type: "timestamp",
                isNullable: true,
            }));
        }

        // Migrate existing data: set executedAt = completedAt for completed orders
        await queryRunner.query(`
            UPDATE work_orders
            SET "executedAt" = "completedAt"
            WHERE "completedAt" IS NOT NULL AND "executedAt" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("work_orders", "executedAt");
    }

}
