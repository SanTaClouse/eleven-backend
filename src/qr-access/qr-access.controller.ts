import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QrAccessService } from './qr-access.service';
import { CompleteWorkOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('qr-access')
@Controller('qr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QrAccessController {
  constructor(private readonly qrAccessService: QrAccessService) {}

  @Get(':buildingId')
  @ApiOperation({ summary: 'Obtener información del portal del edificio para acceso QR' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información del edificio y órdenes de trabajo actuales',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Edificio no encontrado',
  })
  getBuildingPortal(@Param('buildingId') buildingId: string) {
    return this.qrAccessService.getBuildingPortal(buildingId);
  }

  @Post(':buildingId/work-orders/:orderId/start')
  @ApiOperation({ summary: 'Iniciar una orden de trabajo' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiParam({ name: 'orderId', description: 'UUID de la orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orden de trabajo iniciada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden de trabajo no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La orden de trabajo no puede ser iniciada',
  })
  startWorkOrder(
    @Param('buildingId') buildingId: string,
    @Param('orderId') orderId: string,
    @Request() req,
  ) {
    return this.qrAccessService.startWorkOrder(buildingId, orderId, req.user.id);
  }

  @Post(':buildingId/work-orders/:orderId/complete')
  @ApiOperation({ summary: 'Completar una orden de trabajo' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiParam({ name: 'orderId', description: 'UUID de la orden de trabajo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orden de trabajo completada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden de trabajo no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La orden de trabajo no puede ser completada',
  })
  completeWorkOrder(
    @Param('buildingId') buildingId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CompleteWorkOrderDto,
    @Request() req,
  ) {
    return this.qrAccessService.completeWorkOrder(
      buildingId,
      orderId,
      req.user.id,
      dto,
    );
  }

  @Get(':buildingId/history')
  @ApiOperation({ summary: 'Obtener historial de órdenes de trabajo de un edificio' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiQuery({ name: 'limit', required: false, description: 'Número de elementos a devolver' })
  @ApiQuery({ name: 'offset', required: false, description: 'Número de elementos a omitir' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de órdenes de trabajo',
  })
  getHistory(
    @Param('buildingId') buildingId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.qrAccessService.getHistory(
      buildingId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }
}
