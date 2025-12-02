import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from '../entities/work-order.entity';
import { BuildingsModule } from '../buildings/buildings.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder]), BuildingsModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
