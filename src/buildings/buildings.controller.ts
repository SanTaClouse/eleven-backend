import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('buildings')
@Controller('buildings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo edificio' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Edificio creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingsService.create(createBuildingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los edificios' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de edificios obtenida exitosamente',
  })
  findAll() {
    return this.buildingsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener todos los edificios activos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de edificios activos obtenida exitosamente',
  })
  findAllActive() {
    return this.buildingsService.findAllActive();
  }

  @Get(':id/deactivation-impact')
  @ApiOperation({ summary: 'Obtener impacto de desactivación de un edificio' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información del impacto de desactivación obtenida',
  })
  getDeactivationImpact(@Param('id') id: string) {
    return this.buildingsService.getDeactivationImpact(id);
  }

  @Get(':id/price-history')
  @ApiOperation({ summary: 'Obtener historial de precios de un edificio' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de precios obtenido exitosamente',
  })
  getPriceHistory(@Param('id') id: string) {
    return this.buildingsService.getPriceHistory(id);
  }

  @Get(':id/qr-code')
  @ApiOperation({ summary: 'Generar imagen de código QR para el portal del edificio' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Imagen del código QR (PNG)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Edificio no encontrado',
  })
  @Header('Content-Type', 'image/png')
  async getQrCode(@Param('id') id: string, @Res() res: Response) {
    const qrBuffer = await this.buildingsService.generateQrCode(id);
    res.set({
      'Content-Disposition': `attachment; filename="qr-edificio-${id}.png"`,
      'Cache-Control': 'no-cache',
    });
    res.send(qrBuffer);
  }

  @Get(':id/qr-url')
  @ApiOperation({ summary: 'Obtener URL del portal QR de un edificio' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URL del portal QR',
  })
  getQrUrl(@Param('id') id: string) {
    return { url: this.buildingsService.getQrUrl(id) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un edificio por ID' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Edificio encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Edificio no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un edificio' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Edificio actualizado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Edificio no encontrado',
  })
  update(
    @Param('id') id: string,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(id, updateBuildingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un edificio (borrado lógico)' })
  @ApiParam({ name: 'id', description: 'UUID del edificio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Edificio desactivado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Edificio no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.buildingsService.remove(id);
  }
}
