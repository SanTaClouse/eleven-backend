import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from '../entities/work-order.entity';
import { BuildingsModule } from '../buildings/buildings.module';
import { ClientsModule } from '../clients/clients.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder]),
    BuildingsModule,
    forwardRef(() => ClientsModule),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
