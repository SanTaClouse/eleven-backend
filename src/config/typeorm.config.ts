import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Client } from '../entities/client.entity';
import { Building } from '../entities/building.entity';
import { WorkOrder } from '../entities/work-order.entity';

config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'eleven_db',
  entities: [Client, Building, WorkOrder],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development', // Only in dev
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
