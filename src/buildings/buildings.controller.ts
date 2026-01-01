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
} from '@nestjs/common';
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
  @ApiOperation({ summary: 'Create a new building' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Building successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingsService.create(createBuildingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all buildings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of buildings retrieved successfully',
  })
  findAll() {
    return this.buildingsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active buildings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active buildings retrieved successfully',
  })
  findAllActive() {
    return this.buildingsService.findAllActive();
  }

  @Get(':id/deactivation-impact')
  @ApiOperation({ summary: 'Get deactivation impact for a building' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deactivation impact information retrieved',
  })
  getDeactivationImpact(@Param('id') id: string) {
    return this.buildingsService.getDeactivationImpact(id);
  }

  @Get(':id/price-history')
  @ApiOperation({ summary: 'Get price history for a building' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history retrieved successfully',
  })
  getPriceHistory(@Param('id') id: string) {
    return this.buildingsService.getPriceHistory(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a building by ID' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Building found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a building' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Building successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(id, updateBuildingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a building (soft delete)' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Building successfully deactivated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  remove(@Param('id') id: string) {
    return this.buildingsService.remove(id);
  }
}
