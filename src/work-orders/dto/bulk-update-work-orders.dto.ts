import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkOrderType } from '../../entities/work-order.entity';

export class BulkUpdateWorkOrdersDto {
  @ApiProperty({
    description: 'Client ID to filter work orders',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Work order type to filter',
    enum: WorkOrderType,
    example: WorkOrderType.MANTENIMIENTO,
  })
  @IsEnum(WorkOrderType)
  @IsNotEmpty()
  type: WorkOrderType;

  @ApiProperty({
    description: 'Month to filter work orders (1-12)',
    example: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @ApiProperty({
    description: 'Year to filter work orders',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    description: 'Set isFacturado to this value for matching orders',
    example: true,
    required: false,
  })
  @IsOptional()
  isFacturado?: boolean;

  @ApiProperty({
    description: 'Set isCobrado to this value for matching orders',
    example: true,
    required: false,
  })
  @IsOptional()
  isCobrado?: boolean;
}
