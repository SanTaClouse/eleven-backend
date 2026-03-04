import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArcaConfig } from '../entities/arca-config.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { ArcaController } from './arca.controller';
import { ArcaService } from './arca.service';
import { WorkOrdersModule } from '../work-orders/work-orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArcaConfig, WorkOrder]),
    forwardRef(() => WorkOrdersModule),
  ],
  controllers: [ArcaController],
  providers: [ArcaService],
  exports: [ArcaService],
})
export class ArcaModule {}
