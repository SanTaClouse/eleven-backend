import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const building = this.buildingRepository.create(createBuildingDto);
    const savedBuilding = await this.buildingRepository.save(building);

    // Update client rankings after creating a building
    await this.clientsService.updateClientRankings();

    return savedBuilding;
  }

  async findAll(): Promise<Building[]> {
    return await this.buildingRepository.find({
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
    const building = await this.findOne(id);
    Object.assign(building, updateBuildingDto);
    const updatedBuilding = await this.buildingRepository.save(building);

    // Update client rankings after updating a building (price may have changed)
    await this.clientsService.updateClientRankings();

    return updatedBuilding;
  }

  async remove(id: string): Promise<void> {
    const building = await this.findOne(id);
    await this.buildingRepository.remove(building);
  }
}
