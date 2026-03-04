import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArcaService } from './arca.service';
import { SaveArcaConfigDto } from './dto/arca-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkOrder } from '../entities/work-order.entity';

@ApiTags('arca')
@Controller('arca')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ArcaController {
  constructor(
    private readonly arcaService: ArcaService,
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración ARCA (sin datos sensibles completos)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuración ARCA' })
  getConfig() {
    return this.arcaService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Guardar configuración ARCA' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuración guardada' })
  saveConfig(@Body() dto: SaveArcaConfigDto) {
    return this.arcaService.saveConfig(dto);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Probar conexión WSAA con el certificado configurado' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resultado de la prueba de conexión' })
  testConnection() {
    return this.arcaService.testConnection();
  }

  @Post('emitir/:workOrderId')
  @ApiOperation({
    summary: 'Emitir factura ARCA manualmente para una orden de trabajo',
    description: 'Útil para reintentar si la emisión automática falló. La orden debe estar facturada (isFacturado=true) pero sin CAE.',
  })
  @ApiParam({ name: 'workOrderId', description: 'UUID de la orden de trabajo' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Factura emitida exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Orden de trabajo no encontrada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'La orden ya tiene CAE' })
  emitirManual(@Param('workOrderId') workOrderId: string) {
    return this.arcaService.emitirFacturaPorId(workOrderId, this.workOrderRepository);
  }
}
