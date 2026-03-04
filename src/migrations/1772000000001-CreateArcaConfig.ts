import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateArcaConfig1772000000001 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('arca_config');
    if (!tableExists) {
      await queryRunner.createTable(new Table({
        name: 'arca_config',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'cuit',
            type: 'varchar',
            length: '11',
          },
          {
            name: 'razonSocial',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'domicilioFiscal',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'puntoVenta',
            type: 'int',
          },
          {
            name: 'certificado',
            type: 'text',
          },
          {
            name: 'clavePrivada',
            type: 'text',
          },
          {
            name: 'produccion',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('arca_config', true);
  }
}
