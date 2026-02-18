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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cliente creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filtrar por mes (1-12) para obtener estadísticas de facturación',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filtrar por año para obtener estadísticas de facturación',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de clientes obtenida exitosamente',
  })
  findAll(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    if (month && year) {
      return this.clientsService.findAllWithStats(month, year);
    }
    return this.clientsService.findAll();
  }

  @Get(':id/deactivation-impact')
  @ApiOperation({ summary: 'Obtener impacto de desactivación de un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información del impacto de desactivación obtenida',
  })
  getDeactivationImpact(@Param('id') id: string) {
    return this.clientsService.getDeactivationImpact(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente actualizado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un cliente (borrado lógico)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente desactivado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post('update-rankings')
  @ApiOperation({ summary: 'Actualizar rankings de clientes basado en facturación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rankings de clientes actualizados exitosamente',
  })
  async updateRankings() {
    await this.clientsService.updateClientRankings();
    return { message: 'Rankings de clientes actualizados exitosamente' };
  }
}
