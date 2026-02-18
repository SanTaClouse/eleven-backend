import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkOrderType } from '../../entities/work-order.entity';

export class BulkUpdateWorkOrdersDto {
  @ApiProperty({
    description: 'ID del cliente para filtrar órdenes de trabajo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Tipo de orden de trabajo para filtrar',
    enum: WorkOrderType,
    example: WorkOrderType.MANTENIMIENTO,
  })
  @IsEnum(WorkOrderType)
  @IsNotEmpty()
  type: WorkOrderType;

  @ApiProperty({
    description: 'Mes para filtrar órdenes de trabajo (1-12)',
    example: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @ApiProperty({
    description: 'Año para filtrar órdenes de trabajo',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    description: 'Establecer isFacturado a este valor para las órdenes coincidentes',
    example: true,
    required: false,
  })
  @IsOptional()
  isFacturado?: boolean;

  @ApiProperty({
    description: 'Establecer isCobrado a este valor para las órdenes coincidentes',
    example: true,
    required: false,
  })
  @IsOptional()
  isCobrado?: boolean;
}
