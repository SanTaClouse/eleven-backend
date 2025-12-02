import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkOrderStatus } from '../../entities/work-order.entity';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  statusOperativo?: WorkOrderStatus;

  @IsOptional()
  @IsBoolean()
  isFacturado?: boolean;

  @IsOptional()
  @IsBoolean()
  isCobrado?: boolean;

  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
