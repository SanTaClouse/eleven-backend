import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from '../entities/work-order.entity';
import { WorkOrderStatusHistory } from '../entities/work-order-status-history.entity';
import { Building } from '../entities/building.entity';
import { CompleteWorkOrderDto } from './dto';

@Injectable()
export class QrAccessService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderStatusHistory)
    private readonly statusHistoryRepository: Repository<WorkOrderStatusHistory>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  /**
   * Get building info and current month's work orders for QR portal
   */
  async getBuildingPortal(buildingId: string) {
    const building = await this.buildingRepository.findOne({
      where: { id: buildingId },
      relations: ['client'],
    });

    if (!building) {
      throw new NotFoundException(`Edificio no encontrado`);
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get work orders for current month (pending and in progress)
    const workOrders = await this.workOrderRepository.find({
      where: {
        buildingId,
        month: currentMonth,
        year: currentYear,
        statusOperativo: In([WorkOrderStatus.PENDING, WorkOrderStatus.IN_PROGRESS]),
      },
      order: { createdAt: 'ASC' },
    });

    const pending = workOrders.filter(
      (wo) => wo.statusOperativo === WorkOrderStatus.PENDING,
    );
    const inProgress = workOrders.filter(
      (wo) => wo.statusOperativo === WorkOrderStatus.IN_PROGRESS,
    );

    return {
      building: {
        id: building.id,
        name: building.name,
        address: building.address,
        elevatorsCount: building.elevatorsCount,
        clientName: building.client?.name || 'Sin cliente',
      },
      workOrders: {
        pending: pending.map((wo) => this.mapWorkOrderSummary(wo)),
        inProgress: inProgress.map((wo) => this.mapWorkOrderSummary(wo)),
      },
      currentMonth,
      currentYear,
    };
  }

  /**
   * Start a work order (mark as IN_PROGRESS)
   */
  async startWorkOrder(buildingId: string, orderId: string, userId: string) {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: orderId, buildingId },
    });

    if (!workOrder) {
      throw new NotFoundException(`Orden de trabajo no encontrada`);
    }

    if (workOrder.statusOperativo !== WorkOrderStatus.PENDING) {
      throw new BadRequestException(
        `Solo se pueden iniciar órdenes pendientes. Estado actual: ${workOrder.statusOperativo}`,
      );
    }

    const oldStatus = workOrder.statusOperativo;
    workOrder.statusOperativo = WorkOrderStatus.IN_PROGRESS;
    workOrder.startedAt = new Date();

    await this.workOrderRepository.save(workOrder);

    // Log status change
    const historyEntry = this.statusHistoryRepository.create({
      workOrderId: workOrder.id,
      fromStatus: oldStatus,
      toStatus: WorkOrderStatus.IN_PROGRESS,
    });
    await this.statusHistoryRepository.save(historyEntry);

    return {
      success: true,
      message: 'Trabajo iniciado',
      workOrder: this.mapWorkOrderSummary(workOrder),
    };
  }

  /**
   * Complete a work order (mark as COMPLETED)
   */
  async completeWorkOrder(
    buildingId: string,
    orderId: string,
    userId: string,
    dto: CompleteWorkOrderDto,
  ) {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: orderId, buildingId },
    });

    if (!workOrder) {
      throw new NotFoundException(`Orden de trabajo no encontrada`);
    }

    if (workOrder.statusOperativo !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Solo se pueden completar órdenes en progreso. Estado actual: ${workOrder.statusOperativo}`,
      );
    }

    const oldStatus = workOrder.statusOperativo;
    workOrder.statusOperativo = WorkOrderStatus.COMPLETED;
    workOrder.completedAt = new Date();
    workOrder.executedAt = new Date();

    if (dto.observations) {
      workOrder.observations = dto.observations;
    }

    await this.workOrderRepository.save(workOrder);

    // Log status change
    const historyEntry = this.statusHistoryRepository.create({
      workOrderId: workOrder.id,
      fromStatus: oldStatus,
      toStatus: WorkOrderStatus.COMPLETED,
    });
    await this.statusHistoryRepository.save(historyEntry);

    return {
      success: true,
      message: 'Trabajo completado',
      workOrder: this.mapWorkOrderSummary(workOrder),
    };
  }

  /**
   * Get work order history for a building
   */
  async getHistory(buildingId: string, limit = 20, offset = 0) {
    const building = await this.buildingRepository.findOne({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException(`Edificio no encontrado`);
    }

    const [workOrders, total] = await this.workOrderRepository.findAndCount({
      where: { buildingId },
      order: { executedAt: 'DESC', completedAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      buildingName: building.name || building.address,
      items: workOrders.map((wo) => this.mapHistoryItem(wo)),
      total,
      hasMore: offset + workOrders.length < total,
    };
  }

  private mapWorkOrderSummary(wo: WorkOrder) {
    return {
      id: wo.id,
      type: wo.type,
      status: wo.statusOperativo,
      month: wo.month,
      year: wo.year,
      startedAt: wo.startedAt,
      createdAt: wo.createdAt,
    };
  }

  private mapHistoryItem(wo: WorkOrder) {
    return {
      id: wo.id,
      type: wo.type,
      status: wo.statusOperativo,
      executedAt: wo.executedAt,
      completedAt: wo.completedAt,
      startedAt: wo.startedAt,
      createdAt: wo.createdAt,
      observations: wo.observations,
    };
  }
}
