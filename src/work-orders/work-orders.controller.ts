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
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  GenerateMonthlyOrdersDto,
} from './dto';

@ApiTags('work-orders')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Work order successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Work order already exists for this building/month/year',
  })
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Post('generate-monthly')
  @ApiOperation({
    summary: 'Generate work orders for all active buildings',
    description:
      'Batch operation that creates work orders for all active buildings for a given month/year. Skips buildings that already have orders for that period.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Work orders generation summary',
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
    description: 'Invalid month or year',
  })
  generateMonthlyOrders(@Body() dto: GenerateMonthlyOrdersDto) {
    return this.workOrdersService.generateMonthlyOrders(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work orders' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filter by month (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter by year',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of work orders retrieved successfully',
  })
  findAll(@Query('month') month?: number, @Query('year') year?: number) {
    return this.workOrdersService.findAll(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('dashboard-kpis')
  @ApiOperation({
    summary: 'Get dashboard KPIs for a specific month',
    description:
      'Returns completion rates, revenue stats, and collection metrics for the specified period',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Month (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Year',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs retrieved successfully',
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
    return this.workOrdersService.getDashboardKPIs(Number(month), Number(year));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work order by ID' })
  @ApiParam({ name: 'id', description: 'Work Order UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work order found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Work order not found',
  })
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a work order',
    description:
      'Updates work order status and automatically sets timestamps (completedAt, invoicedAt, paidAt)',
  })
  @ApiParam({ name: 'id', description: 'Work Order UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work order successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Work order not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work order' })
  @ApiParam({ name: 'id', description: 'Work Order UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work order successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Work order not found',
  })
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }
}
