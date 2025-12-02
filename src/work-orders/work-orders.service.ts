import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from '../entities/work-order.entity';
import { BuildingsService } from '../buildings/buildings.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  GenerateMonthlyOrdersDto,
} from './dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    private readonly buildingsService: BuildingsService,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrder> {
    // Check for existing work order
    const existing = await this.workOrderRepository.findOne({
      where: {
        buildingId: createWorkOrderDto.buildingId,
        month: createWorkOrderDto.month,
        year: createWorkOrderDto.year,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Work order for this building already exists for ${createWorkOrderDto.month}/${createWorkOrderDto.year}`,
      );
    }

    const workOrder = this.workOrderRepository.create(createWorkOrderDto);
    return await this.workOrderRepository.save(workOrder);
  }

  async findAll(month?: number, year?: number): Promise<WorkOrder[]> {
    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;

    return await this.workOrderRepository.find({
      where,
      relations: ['building', 'building.client'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: ['building', 'building.client'],
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order with ID ${id} not found`);
    }

    return workOrder;
  }

  async update(
    id: string,
    updateWorkOrderDto: UpdateWorkOrderDto,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);

    // Auto-set timestamps based on status changes
    if (
      updateWorkOrderDto.statusOperativo === WorkOrderStatus.COMPLETED &&
      !workOrder.completedAt
    ) {
      workOrder.completedAt = new Date();
    }

    if (updateWorkOrderDto.isFacturado && !workOrder.invoicedAt) {
      workOrder.invoicedAt = new Date();
    }

    if (updateWorkOrderDto.isCobrado && !workOrder.paidAt) {
      workOrder.paidAt = new Date();
    }

    Object.assign(workOrder, updateWorkOrderDto);
    return await this.workOrderRepository.save(workOrder);
  }

  async remove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.remove(workOrder);
  }

  /**
   * Generates work orders for all active buildings for a given month/year
   * This is a batch operation that creates work orders automatically
   */
  async generateMonthlyOrders(
    dto: GenerateMonthlyOrdersDto,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    const { month, year } = dto;
    const buildings = await this.buildingsService.findAllActive();

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const building of buildings) {
      try {
        // Check if work order already exists
        const existing = await this.workOrderRepository.findOne({
          where: {
            buildingId: building.id,
            month,
            year,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create work order with current building price
        const workOrder = this.workOrderRepository.create({
          buildingId: building.id,
          month,
          year,
          priceSnapshot: building.price,
          statusOperativo: WorkOrderStatus.PENDING,
          isFacturado: false,
          isCobrado: false,
        });

        await this.workOrderRepository.save(workOrder);
        results.created++;
      } catch (error) {
        results.errors.push(
          `Building ${building.address}: ${error.message}`,
        );
      }
    }

    return results;
  }

  /**
   * Get dashboard KPIs for a specific month/year
   */
  async getDashboardKPIs(month: number, year: number) {
    const workOrders = await this.findAll(month, year);

    const total = workOrders.length;
    const completed = workOrders.filter(
      (wo) => wo.statusOperativo === WorkOrderStatus.COMPLETED,
    ).length;
    const invoiced = workOrders.filter((wo) => wo.isFacturado).length;
    const paid = workOrders.filter((wo) => wo.isCobrado).length;

    const totalRevenue = workOrders.reduce(
      (sum, wo) => sum + Number(wo.priceSnapshot),
      0,
    );
    const invoicedRevenue = workOrders
      .filter((wo) => wo.isFacturado)
      .reduce((sum, wo) => sum + Number(wo.priceSnapshot), 0);
    const paidRevenue = workOrders
      .filter((wo) => wo.isCobrado)
      .reduce((sum, wo) => sum + Number(wo.priceSnapshot), 0);

    return {
      month,
      year,
      workOrders: {
        total,
        completed,
        invoiced,
        paid,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      },
      revenue: {
        total: totalRevenue,
        invoiced: invoicedRevenue,
        paid: paidRevenue,
        invoicedRate: totalRevenue > 0 ? (invoicedRevenue / totalRevenue) * 100 : 0,
        collectionRate: invoicedRevenue > 0 ? (paidRevenue / invoicedRevenue) * 100 : 0,
      },
    };
  }
}
