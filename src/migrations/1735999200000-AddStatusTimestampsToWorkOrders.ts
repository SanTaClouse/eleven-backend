import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddStatusTimestampsToWorkOrders1735999200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add startedAt column
        await queryRunner.addColumn("work_orders", new TableColumn({
            name: "startedAt",
            type: "timestamp",
            isNullable: true,
        }));

        // Add cancelledAt column
        await queryRunner.addColumn("work_orders", new TableColumn({
            name: "cancelledAt",
            type: "timestamp",
            isNullable: true,
        }));

        // Drop the old unique index
        const table = await queryRunner.getTable("work_orders");
        const oldUniqueIndex = table.indices.find(
            index => index.columnNames.includes("buildingId") &&
                     index.columnNames.includes("month") &&
                     index.columnNames.includes("year") &&
                     index.columnNames.includes("type") &&
                     index.isUnique
        );

        if (oldUniqueIndex) {
            await queryRunner.dropIndex("work_orders", oldUniqueIndex);
        }

        // Create new non-unique index
        await queryRunner.createIndex("work_orders", new TableIndex({
            name: "IDX_work_orders_building_month_year_type",
            columnNames: ["buildingId", "month", "year", "type"],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the non-unique index
        await queryRunner.dropIndex("work_orders", "IDX_work_orders_building_month_year_type");

        // Recreate the unique index
        await queryRunner.createIndex("work_orders", new TableIndex({
            name: "IDX_work_orders_building_month_year_type_unique",
            columnNames: ["buildingId", "month", "year", "type"],
            isUnique: true,
        }));

        // Drop the columns
        await queryRunner.dropColumn("work_orders", "cancelledAt");
        await queryRunner.dropColumn("work_orders", "startedAt");
    }

}
