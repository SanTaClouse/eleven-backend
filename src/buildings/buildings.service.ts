import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from '../entities/building.entity';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    const building = this.buildingRepository.create(createBuildingDto);
    return await this.buildingRepository.save(building);
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
    return await this.buildingRepository.save(building);
  }

  async remove(id: string): Promise<void> {
    const building = await this.findOne(id);
    await this.buildingRepository.remove(building);
  }
}
