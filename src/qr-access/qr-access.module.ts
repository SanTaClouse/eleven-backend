import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from '../entities/work-order.entity';
import { WorkOrderStatusHistory } from '../entities/work-order-status-history.entity';
import { Building } from '../entities/building.entity';
import { Failure } from '../entities/failure.entity';
import { QrAccessController } from './qr-access.controller';
import { QrAccessService } from './qr-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder, WorkOrderStatusHistory, Building, Failure]),
  ],
  controllers: [QrAccessController],
  providers: [QrAccessService],
})
export class QrAccessModule {}
