import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FailuresController } from './failures.controller';
import { FailuresService } from './failures.service';
import { Failure } from '../entities/failure.entity';
import { Building } from '../entities/building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Failure, Building])],
  controllers: [FailuresController],
  providers: [FailuresService],
  exports: [FailuresService],
})
export class FailuresModule {}
