import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { ClientsModule } from './clients/clients.module';
import { BuildingsModule } from './buildings/buildings.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    ClientsModule,
    BuildingsModule,
    WorkOrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
