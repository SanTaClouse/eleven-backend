import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
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
    description: 'URL to the uploaded invoice (S3/Cloudinary)',
    example: 'https://storage.example.com/invoices/2024-12-001.pdf',
  })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

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
}
