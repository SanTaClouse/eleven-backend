import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateWorkOrderStatusHistory1735999300000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "work_order_status_history",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "workOrderId",
                        type: "uuid",
                    },
                    {
                        name: "fromStatus",
                        type: "enum",
                        enum: ["pending", "in_progress", "completed", "cancelled"],
                    },
                    {
                        name: "toStatus",
                        type: "enum",
                        enum: ["pending", "in_progress", "completed", "cancelled"],
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create foreign key
        await queryRunner.createForeignKey(
            "work_order_status_history",
            new TableForeignKey({
                columnNames: ["workOrderId"],
                referencedColumnNames: ["id"],
                referencedTableName: "work_orders",
                onDelete: "CASCADE",
            })
        );

        // Create index for performance
        await queryRunner.createIndex(
            "work_order_status_history",
            new TableIndex({
                name: "IDX_work_order_status_history_workOrderId_createdAt",
                columnNames: ["workOrderId", "createdAt"],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("work_order_status_history");
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("workOrderId") !== -1
        );
        await queryRunner.dropForeignKey("work_order_status_history", foreignKey);
        await queryRunner.dropIndex("work_order_status_history", "IDX_work_order_status_history_workOrderId_createdAt");
        await queryRunner.dropTable("work_order_status_history");
    }

}
