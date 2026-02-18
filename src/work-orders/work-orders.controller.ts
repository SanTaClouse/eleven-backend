import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  GenerateMonthlyOrdersDto,
  BulkUpdateWorkOrdersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('work-orders')
@Controller('work-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Orden de trabajo creada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe una orden de trabajo para este edificio/mes/año',
  })
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Post('generate-monthly')
  @ApiOperation({
    summary: 'Generar órdenes de trabajo para todos los edificios activos',
    description:
      'Operación por lotes que crea órdenes de trabajo para todos los edificios activos de un mes/año dado. Omite edificios que ya tienen órdenes para ese período.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Resumen de generación de órdenes de trabajo',
    schema: {
      example: {
        created: 25,
        skipped: 5,
        errors: [],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mes o año inválido',
  })
  generateMonthlyOrders(@Body() dto: GenerateMonthlyOrdersDto) {
    return this.workOrdersService.generateMonthlyOrders(dto);
  }

  @Post('bulk-update')
  @ApiOperation({
    summary: 'Actualización masiva de órdenes de trabajo por cliente y tipo',
    description:
      'Actualiza isFacturado y/o isCobrado para todas las órdenes de trabajo que coincidan con el cliente y tipo especificados',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen de actualización masiva',
    schema: {
      example: {
        updated: 12,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  bulkUpdate(@Body() dto: BulkUpdateWorkOrdersDto) {
    return this.workOrdersService.bulkUpdate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las órdenes de trabajo' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filtrar por mes (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filtrar por año',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de órdenes de trabajo obtenida exitosamente',
  })
  findAll(@Query('month') month?: number, @Query('year') year?: number) {
    // Validate month
    if (month !== undefined) {
      const monthNum = Number(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new BadRequestException('El mes debe estar entre 1 y 12');
      }
    }

    // Validate year
    if (year !== undefined) {
      const yearNum = Number(year);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
        throw new BadRequestException('El año debe estar entre 2020 y 2100');
      }
    }

    return this.workOrdersService.findAll(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('dashboard-kpis')
  @ApiOperation({
    summary: 'Obtener KPIs del dashboard para un mes específico',
    description:
      'Devuelve tasas de completado, estadísticas de facturación y métricas de cobro para el período especificado',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mes (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs obtenidos exitosamente',
    schema: {
      example: {
        month: 12,
        year: 2024,
        workOrders: {
          total: 60,
          completed: 45,
          invoiced: 38,
          paid: 30,
          completionRate: 75,
        },
        revenue: {
          total: 125400,
          invoiced: 98200,
          paid: 85000,
          invoicedRate: 78.3,
          collectionRate: 86.5,
        },
      },
    },
  })
  getDashboardKPIs(@Query('month') month: number, @Query('year') year: number) {
    // Validate month
    const monthNum = Number(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('El mes debe estar entre 1 y 12');
    }

    // Validate year
    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestException('El año debe estar entre 2020 y 2100');
    }

    return this.workOrdersService.getDashboardKPIs(monthNum, yearNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una orden de trabajo por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orden de trabajo encontrada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden de trabajo no encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Get(':id/status-history')
  @ApiOperation({
    summary: 'Obtener historial de cambios de estado de una orden de trabajo',
    description: 'Devuelve todos los cambios de estado con marcas de tiempo para auditoría',
  })
  @ApiParam({ name: 'id', description: 'UUID de la orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de estados obtenido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden de trabajo no encontrada',
  })
  getStatusHistory(@Param('id') id: string) {
    return this.workOrdersService.getStatusHistory(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una orden de trabajo',
    description:
      'Actualiza el estado de la orden de trabajo y establece automáticamente las marcas de tiempo (completedAt, invoicedAt, paidAt)',
  })
  @ApiParam({ name: 'id', description: 'UUID de la orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orden de trabajo actualizada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden de trabajo no encontrada',
  })
  update(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una orden de trabajo' })
  @ApiParam({ name: 'id', description: 'UUID de la orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orden de trabajo eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden de trabajo no encontrada',
  })
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }
}
