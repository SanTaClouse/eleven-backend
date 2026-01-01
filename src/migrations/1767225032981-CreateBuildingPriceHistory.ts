import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateBuildingPriceHistory1767225032981 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "building_price_history",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "buildingId",
                        type: "uuid",
                    },
                    {
                        name: "oldPrice",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: "newPrice",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "reason",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "changedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "building_price_history",
            new TableForeignKey({
                columnNames: ["buildingId"],
                referencedColumnNames: ["id"],
                referencedTableName: "buildings",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("building_price_history");
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("buildingId") !== -1
        );
        await queryRunner.dropForeignKey("building_price_history", foreignKey);
        await queryRunner.dropTable("building_price_history");
    }

}
