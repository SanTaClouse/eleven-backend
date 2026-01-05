import { IsBoolean, IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus, WorkOrderType } from '../../entities/work-order.entity';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({
    description: 'Work order operational status',
    enum: WorkOrderStatus,
    example: WorkOrderStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  statusOperativo?: WorkOrderStatus;

  @ApiPropertyOptional({
    description: 'Whether the work order has been invoiced',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFacturado?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the invoice has been paid/collected',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCobrado?: boolean;

  @ApiPropertyOptional({
    description: 'URL to the uploaded invoice in Firebase Storage',
    example: 'https://firebasestorage.googleapis.com/v0/b/eleven-db-facturas.appspot.com/...',
  })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @ApiPropertyOptional({
    description: 'File name of the invoice in Firebase Storage',
    example: 'invoices/cliente-edificio-2024-12.pdf',
  })
  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @ApiPropertyOptional({
    description: 'Additional observations or notes',
    example: 'Equipment needed replacement - charged separately',
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({
    description: 'Type of work order',
    enum: WorkOrderType,
    example: WorkOrderType.MANTENIMIENTO,
  })
  @IsOptional()
  @IsEnum(WorkOrderType)
  type?: WorkOrderType;

  @ApiPropertyOptional({
    description: 'Price snapshot - can only be edited for non-maintenance work orders',
    example: 45000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceSnapshot?: number;
}
