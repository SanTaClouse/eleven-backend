import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Client } from '../entities/client.entity';
import { Building } from '../entities/building.entity';
import { WorkOrder } from '../entities/work-order.entity';

config();

export const typeOrmConfig: DataSourceOptions = process.env.DATABASE_URL
  ? {
      // Production: Use DATABASE_URL from Railway/Render/etc
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Client, Building, WorkOrder],
      migrations: ['dist/migrations/*.js'],
      synchronize: false, // NEVER use synchronize in production - use migrations
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // migrationsRun is handled in main.ts only on first startup
    }
  : {
      // Development: Use individual variables
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'eleven_db',
      entities: [User, Client, Building, WorkOrder],
      migrations: ['dist/migrations/*.js'],
      synchronize: true,
      logging: true,
    };

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
