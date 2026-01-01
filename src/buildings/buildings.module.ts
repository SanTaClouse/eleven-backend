import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from '../entities/building.entity';
import { BuildingPriceHistory } from '../entities/building-price-history.entity';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Building, BuildingPriceHistory]),
    forwardRef(() => ClientsModule),
  ],
  controllers: [BuildingsController],
  providers: [BuildingsService],
  exports: [BuildingsService],
})
export class BuildingsModule {}
