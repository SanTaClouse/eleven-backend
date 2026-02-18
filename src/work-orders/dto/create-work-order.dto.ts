import { IsNumber, IsOptional, IsString, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderType } from '../../entities/work-order.entity';

export class CreateWorkOrderDto {
  @ApiProperty({
    description: 'UUID del edificio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  buildingId: string;

  @ApiProperty({
    description: 'Mes de la orden de trabajo (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Año de la orden de trabajo',
    example: 2024,
    minimum: 2020,
  })
  @IsNumber()
  @Min(2020)
  year: number;

  @ApiPropertyOptional({
    description: 'Tipo de orden de trabajo',
    enum: WorkOrderType,
    example: WorkOrderType.MANTENIMIENTO,
  })
  @IsEnum(WorkOrderType)
  @IsOptional()
  type?: WorkOrderType;

  @ApiProperty({
    description: 'Precio snapshot al momento de crear la orden',
    example: 25000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  priceSnapshot: number;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Mantenimiento preventivo mensual',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
