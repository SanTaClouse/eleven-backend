import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus, WorkOrderType } from '../entities/work-order.entity';
import { BuildingsService } from '../buildings/buildings.service';
import { ClientsService } from '../clients/clients.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  GenerateMonthlyOrdersDto,
  BulkUpdateWorkOrdersDto,
} from './dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    private readonly buildingsService: BuildingsService,
    @Inject(forwardRef(() => ClientsService))
    private readonly clientsService: ClientsService,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrder> {
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

    // Auto-set timestamp when invoice is uploaded
    if (updateWorkOrderDto.invoiceUrl && !workOrder.invoiceUploadedAt) {
      workOrder.invoiceUploadedAt = new Date();
    }

    // Clear timestamp if invoice is removed
    if (updateWorkOrderDto.invoiceUrl === null && workOrder.invoiceUploadedAt) {
      workOrder.invoiceUploadedAt = null;
      workOrder.invoiceFileName = null;
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
        // Check if work order already exists for MANTENIMIENTO type
        const existing = await this.workOrderRepository.findOne({
          where: {
            buildingId: building.id,
            month,
            year,
            type: WorkOrderType.MANTENIMIENTO,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create work order with current building price and type MANTENIMIENTO
        const workOrder = this.workOrderRepository.create({
          buildingId: building.id,
          month,
          year,
          type: WorkOrderType.MANTENIMIENTO,
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

    // Update client rankings after generating monthly orders
    await this.clientsService.updateClientRankings();

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

  /**
   * Bulk update work orders by client, type, month and year
   * Updates isFacturado and/or isCobrado for all matching work orders in the specified period
   */
  async bulkUpdate(dto: BulkUpdateWorkOrdersDto): Promise<{ updated: number }> {
    const { clientId, type, month, year, isFacturado, isCobrado } = dto;

    // Find all work orders for the specified client, type, month and year that need updating
    const query = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoin('workOrder.building', 'building')
      .where('building.clientId = :clientId', { clientId })
      .andWhere('workOrder.type = :type', { type })
      .andWhere('workOrder.month = :month', { month })
      .andWhere('workOrder.year = :year', { year });

    // Only update orders that actually need to change
    if (isFacturado !== undefined) {
      query.andWhere('workOrder.isFacturado != :isFacturado', { isFacturado });
    }
    if (isCobrado !== undefined) {
      query.andWhere('workOrder.isCobrado != :isCobrado', { isCobrado });
    }

    const workOrders = await query.getMany();
    const now = new Date();

    // Update each order
    for (const workOrder of workOrders) {
      const updateData: any = {};

      if (isFacturado !== undefined) {
        updateData.isFacturado = isFacturado;
        if (isFacturado && !workOrder.invoicedAt) {
          updateData.invoicedAt = now;
        }
      }

      if (isCobrado !== undefined) {
        updateData.isCobrado = isCobrado;
        if (isCobrado && !workOrder.paidAt) {
          updateData.paidAt = now;
        }
      }

      await this.workOrderRepository.update(workOrder.id, updateData);
    }

    return { updated: workOrders.length };
  }
}
