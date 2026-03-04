import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddArcaFieldsToWorkOrders1772000000000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('work_orders');

    const hasCAE = table?.columns.find(col => col.name === 'cae');
    if (!hasCAE) {
      await queryRunner.addColumn('work_orders', new TableColumn({
        name: 'cae',
        type: 'varchar',
        length: '14',
        isNullable: true,
      }));
    }

    const hasCaeVencimiento = table?.columns.find(col => col.name === 'caeVencimiento');
    if (!hasCaeVencimiento) {
      await queryRunner.addColumn('work_orders', new TableColumn({
        name: 'caeVencimiento',
        type: 'date',
        isNullable: true,
      }));
    }

    const hasComprobanteNro = table?.columns.find(col => col.name === 'comprobanteNro');
    if (!hasComprobanteNro) {
      await queryRunner.addColumn('work_orders', new TableColumn({
        name: 'comprobanteNro',
        type: 'int',
        isNullable: true,
      }));
    }

    const hasTipoComprobante = table?.columns.find(col => col.name === 'tipoComprobante');
    if (!hasTipoComprobante) {
      await queryRunner.addColumn('work_orders', new TableColumn({
        name: 'tipoComprobante',
        type: 'int',
        isNullable: true,
      }));
    }

    const hasArcaError = table?.columns.find(col => col.name === 'arcaError');
    if (!hasArcaError) {
      await queryRunner.addColumn('work_orders', new TableColumn({
        name: 'arcaError',
        type: 'text',
        isNullable: true,
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('work_orders', 'arcaError');
    await queryRunner.dropColumn('work_orders', 'tipoComprobante');
    await queryRunner.dropColumn('work_orders', 'comprobanteNro');
    await queryRunner.dropColumn('work_orders', 'caeVencimiento');
    await queryRunner.dropColumn('work_orders', 'cae');
  }
}
