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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Client successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filter by month (1-12) to get revenue stats',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter by year to get revenue stats',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of clients retrieved successfully',
  })
  findAll(@Query('month') month?: number, @Query('year') year?: number) {
    if (month && year) {
      return this.clientsService.findAllWithStats(month, year);
    }
    return this.clientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post('update-rankings')
  @ApiOperation({ summary: 'Update client rankings based on revenue' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client rankings updated successfully',
  })
  async updateRankings() {
    await this.clientsService.updateClientRankings();
    return { message: 'Client rankings updated successfully' };
  }
}
