import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Failure } from '../entities/failure.entity';
import { Building } from '../entities/building.entity';
import { CreateFailureDto } from './dto';

@Injectable()
export class FailuresService {
  constructor(
    @InjectRepository(Failure)
    private readonly failureRepository: Repository<Failure>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  async createPublic(buildingId: string, dto: CreateFailureDto): Promise<Failure> {
    const building = await this.buildingRepository.findOne({ where: { id: buildingId } });
    if (!building) throw new NotFoundException(`Edificio ${buildingId} no encontrado`);

    const failure = this.failureRepository.create({
      buildingId,
      description: dto.description,
      reporterName: dto.reporterName || null,
      reportedByUserId: null,
      source: 'public',
    });
    return this.failureRepository.save(failure);
  }

  async createByTechnician(buildingId: string, dto: CreateFailureDto, userId: string): Promise<Failure> {
    const building = await this.buildingRepository.findOne({ where: { id: buildingId } });
    if (!building) throw new NotFoundException(`Edificio ${buildingId} no encontrado`);

    const failure = this.failureRepository.create({
      buildingId,
      description: dto.description,
      reporterName: dto.reporterName || null,
      reportedByUserId: userId,
      source: 'technician',
    });
    return this.failureRepository.save(failure);
  }

  async findByBuilding(buildingId: string): Promise<Failure[]> {
    return this.failureRepository.find({
      where: { buildingId },
      order: { reportedAt: 'DESC' },
      relations: ['reportedByUser'],
    });
  }
}
