import { Injectable, NotFoundException, Inject, forwardRef, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Building } from '../entities/building.entity';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    @Inject(forwardRef(() => ClientsService))
    private readonly clientsService: ClientsService,
  ) {}

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    // Validar que no exista un edificio con la misma dirección
    const existingBuilding = await this.buildingRepository.findOne({
      where: { address: createBuildingDto.address },
    });

    if (existingBuilding) {
      throw new ConflictException(
        `Ya existe un edificio con la dirección: ${createBuildingDto.address}`,
      );
    }

    const building = this.buildingRepository.create(createBuildingDto);
    const savedBuilding = await this.buildingRepository.save(building);

    // Update client rankings after creating a building
    await this.clientsService.updateClientRankings();

    return savedBuilding;
  }

  async findAll(includeInactive = false): Promise<Building[]> {
    const whereCondition = includeInactive ? {} : { isActive: true };
    return await this.buildingRepository.find({
      where: whereCondition,
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<Building[]> {
    return await this.buildingRepository.find({
      where: { isActive: true },
      relations: ['client'],
    });
  }

  async findOne(id: string): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { id },
      relations: ['client', 'workOrders'],
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    return building;
  }

  async update(
    id: string,
    updateBuildingDto: UpdateBuildingDto,
  ): Promise<Building> {
    // Buscar el edificio SIN cargar relaciones para evitar problemas con TypeORM
    const building = await this.buildingRepository.findOne({
      where: { id },
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    // Si se está actualizando la dirección, validar que no exista otro edificio con esa dirección
    if (updateBuildingDto.address && updateBuildingDto.address !== building.address) {
      const existingBuilding = await this.buildingRepository.findOne({
        where: { address: updateBuildingDto.address, id: Not(id) },
      });

      if (existingBuilding) {
        throw new ConflictException(
          `Ya existe otro edificio con la dirección: ${updateBuildingDto.address}`,
        );
      }
    }

    // Si se está actualizando el clientId, limpiar la relación cargada
    if (updateBuildingDto.clientId) {
      delete building.client;
    }

    Object.assign(building, updateBuildingDto);
    await this.buildingRepository.save(building);

    // Update client rankings after updating a building (price may have changed)
    await this.clientsService.updateClientRankings();

    // Retornar con relaciones cargadas
    return this.findOne(id);
  }

  /**
   * Obtiene información sobre el impacto de desactivar un edificio
   * Retorna cantidad de órdenes de trabajo que se verían afectadas
   */
  async getDeactivationImpact(id: string): Promise<{
    workOrdersCount: number;
  }> {
    const result = await this.buildingRepository
      .createQueryBuilder('building')
      .leftJoin('building.workOrders', 'workOrder')
      .select('COUNT(workOrder.id)', 'workOrdersCount')
      .where('building.id = :id', { id })
      .getRawOne();

    return {
      workOrdersCount: parseInt(result.workOrdersCount || '0'),
    };
  }

  /**
   * Desactiva un edificio (soft delete)
   * Las órdenes de trabajo se mantienen intactas para preservar historial
   */
  async remove(id: string): Promise<void> {
    const building = await this.findOne(id);

    // Desactivar edificio
    building.isActive = false;
    building.deletedAt = new Date();
    await this.buildingRepository.save(building);

    // Las órdenes de trabajo NO se desactivan - se mantienen para historial
  }
}
