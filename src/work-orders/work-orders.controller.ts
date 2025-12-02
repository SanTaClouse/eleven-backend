import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  GenerateMonthlyOrdersDto,
} from './dto';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Post('generate-monthly')
  generateMonthlyOrders(@Body() dto: GenerateMonthlyOrdersDto) {
    return this.workOrdersService.generateMonthlyOrders(dto);
  }

  @Get()
  findAll(@Query('month') month?: number, @Query('year') year?: number) {
    return this.workOrdersService.findAll(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('dashboard-kpis')
  getDashboardKPIs(@Query('month') month: number, @Query('year') year: number) {
    return this.workOrdersService.getDashboardKPIs(Number(month), Number(year));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }
}
