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
  @ApiOperation({ summary: 'Get building portal info for QR access' })
  @ApiParam({ name: 'buildingId', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Building info and current work orders',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  getBuildingPortal(@Param('buildingId') buildingId: string) {
    return this.qrAccessService.getBuildingPortal(buildingId);
  }

  @Post(':buildingId/work-orders/:orderId/start')
  @ApiOperation({ summary: 'Start a work order' })
  @ApiParam({ name: 'buildingId', description: 'Building UUID' })
  @ApiParam({ name: 'orderId', description: 'Work Order UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work order started successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Work order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Work order cannot be started',
  })
  startWorkOrder(
    @Param('buildingId') buildingId: string,
    @Param('orderId') orderId: string,
    @Request() req,
  ) {
    return this.qrAccessService.startWorkOrder(buildingId, orderId, req.user.id);
  }

  @Post(':buildingId/work-orders/:orderId/complete')
  @ApiOperation({ summary: 'Complete a work order' })
  @ApiParam({ name: 'buildingId', description: 'Building UUID' })
  @ApiParam({ name: 'orderId', description: 'Work Order UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work order completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Work order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Work order cannot be completed',
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
  @ApiOperation({ summary: 'Get work order history for a building' })
  @ApiParam({ name: 'buildingId', description: 'Building UUID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work order history',
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
