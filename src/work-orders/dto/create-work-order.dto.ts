import { IsNumber, IsOptional, IsString, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { WorkOrderType } from '../../entities/work-order.entity';

export class CreateWorkOrderDto {
  @IsUUID()
  buildingId: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(2020)
  year: number;

  @IsEnum(WorkOrderType)
  @IsOptional()
  type?: WorkOrderType;

  @IsNumber()
  @Min(0)
  priceSnapshot: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
