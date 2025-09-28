import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders for tenant' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Request() req, @Query() filters: any) {
    return this.ordersService.findAll(req.user.tenantId, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@Request() req) {
    return this.ordersService.getStats(req.user.tenantId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent orders' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent orders' })
  @ApiResponse({ status: 200, description: 'Recent orders retrieved successfully' })
  getRecent(@Request() req, @Query('limit') limit?: string) {
    return this.ordersService.getRecentOrders(req.user.tenantId, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto, @Request() req) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user.tenantId);
  }
}
