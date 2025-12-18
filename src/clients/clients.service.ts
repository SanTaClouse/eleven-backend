import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) { }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto);
    const savedClient = await this.clientRepository.save(client);

    // Update rankings after creating a client
    await this.updateClientRankings();

    return savedClient;
  }

  async findAll(includeInactive = false): Promise<Client[]> {
    const whereCondition = includeInactive ? {} : { isActive: true };
    return await this.clientRepository.find({
      where: whereCondition,
      relations: ['buildings'],
      order: {
        clientRank: 'ASC',
        createdAt: 'DESC'
      },
    });
  }

  async findAllWithStats(month?: number, year?: number): Promise<any[]> {
    const query = this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.buildings', 'building')
      .leftJoin('building.workOrders', 'workOrder')
      .select('client.id', 'id')
      .addSelect('client.name', 'name')
      .addSelect('client.phone', 'phone')
      .addSelect('client.email', 'email')
      .addSelect('client.address', 'address')
      .addSelect('client.taxId', 'taxId')
      .addSelect('client.isActive', 'isActive')
      .addSelect('client.createdAt', 'createdAt')
      .addSelect('client.clientRank', 'clientRank')
      .addSelect('COUNT(DISTINCT building.id)', 'buildingsCount')
      .groupBy('client.id')
      .addGroupBy('client.name')
      .addGroupBy('client.phone')
      .addGroupBy('client.email')
      .addGroupBy('client.address')
      .addGroupBy('client.taxId')
      .addGroupBy('client.isActive')
      .addGroupBy('client.createdAt')
      .addGroupBy('client.clientRank');

    if (month && year) {
      query
        .addSelect(
          'COALESCE(SUM(CASE WHEN workOrder.month = :month AND workOrder.year = :year THEN workOrder.priceSnapshot ELSE 0 END), 0)',
          'monthlyRevenue',
        )
        .setParameters({ month, year });
    } else {
      query.addSelect('0', 'monthlyRevenue');
    }

    return await query.getRawMany();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['buildings'],
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    Object.assign(client, updateClientDto);
    return await this.clientRepository.save(client);
  }

  /**
   * Obtiene información sobre el impacto de desactivar un cliente
   * Retorna cantidad de edificios y órdenes de trabajo que se verían afectados
   */
  async getDeactivationImpact(id: string): Promise<{
    buildingsCount: number;
    workOrdersCount: number;
  }> {
    const result = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.buildings', 'building')
      .leftJoin('building.workOrders', 'workOrder')
      .select('COUNT(DISTINCT building.id)', 'buildingsCount')
      .addSelect('COUNT(workOrder.id)', 'workOrdersCount')
      .where('client.id = :id', { id })
      .getRawOne();

    return {
      buildingsCount: parseInt(result.buildingsCount || '0'),
      workOrdersCount: parseInt(result.workOrdersCount || '0'),
    };
  }

  /**
   * Desactiva un cliente (soft delete) y sus edificios asociados
   * Las órdenes de trabajo se mantienen intactas para preservar historial
   */
  async remove(id: string): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['buildings'],
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Desactivar cliente
    client.isActive = false;
    client.deletedAt = new Date();
    await this.clientRepository.save(client);

    // Desactivar todos los edificios del cliente
    if (client.buildings && client.buildings.length > 0) {
      const buildingIds = client.buildings.map(b => b.id);
      await this.clientRepository.manager
        .createQueryBuilder()
        .update('buildings')
        .set({ isActive: false, deletedAt: new Date() })
        .whereInIds(buildingIds)
        .execute();
    }
  }

  /**
   * Calcula y actualiza el ranking de clientes basado en su facturación mensual promedio
   * El cliente con mayor facturación promedio obtiene el ranking #1
   */
  async updateClientRankings(): Promise<void> {
    // Obtener todos los clientes con su facturación total
    const clients = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.buildings', 'building')
      .leftJoin('building.workOrders', 'workOrder')
      .select('client.id', 'id')
      .addSelect('COALESCE(AVG(building.price), 0)', 'avgRevenue')
      .groupBy('client.id')
      .orderBy('"avgRevenue"', 'DESC')
      .getRawMany();

    // Asignar rankings (1 = mayor facturación)
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      await this.clientRepository.update(client.id, {
        clientRank: i + 1,
        monthlyRevenue: parseFloat(client.avgRevenue || 0),
      });
    }
  }
}
