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
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto);
    return await this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return await this.clientRepository.find({
      relations: ['buildings'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithStats(month?: number, year?: number): Promise<any[]> {
    const query = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.buildings', 'building')
      .leftJoin('building.workOrders', 'workOrder')
      .select([
        'client.id',
        'client.name',
        'client.phone',
        'client.email',
        'client.address',
        'client.taxId',
        'client.isActive',
        'client.createdAt',
        'COUNT(DISTINCT building.id) as buildingsCount',
      ])
      .groupBy('client.id');

    if (month && year) {
      query
        .addSelect(
          'SUM(CASE WHEN workOrder.month = :month AND workOrder.year = :year THEN workOrder.priceSnapshot ELSE 0 END)',
          'monthlyRevenue',
        )
        .setParameters({ month, year });
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
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    return await this.clientRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }
}
