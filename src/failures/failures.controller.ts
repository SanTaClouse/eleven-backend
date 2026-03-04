import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FailuresService } from './failures.service';
import { CreateFailureDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('failures')
@Controller('failures')
export class FailuresController {
  constructor(private readonly failuresService: FailuresService) {}

  @Post('building/:buildingId/public')
  @ApiOperation({ summary: 'Reportar falla anónimamente (sin autenticación)' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Falla registrada' })
  createPublic(
    @Param('buildingId') buildingId: string,
    @Body() dto: CreateFailureDto,
  ) {
    return this.failuresService.createPublic(buildingId, dto);
  }

  @Post('building/:buildingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar falla (técnico autenticado)' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Falla registrada' })
  createByTechnician(
    @Param('buildingId') buildingId: string,
    @Body() dto: CreateFailureDto,
    @Request() req,
  ) {
    return this.failuresService.createByTechnician(buildingId, dto, req.user.id);
  }

  @Get('building/:buildingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener fallas de un edificio' })
  @ApiParam({ name: 'buildingId', description: 'UUID del edificio' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de fallas' })
  findByBuilding(@Param('buildingId') buildingId: string) {
    return this.failuresService.findByBuilding(buildingId);
  }
}
