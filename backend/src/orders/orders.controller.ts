import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('test')
  async test(@Body() data: any) {
    return { message: 'Test endpoint working', data };
  }

  @Post('manual')
  async createManual(@Body() orderData: any) {
    // Hardcoded tenant for testing
    const testTenantId = 'test-tenant-id';
    return this.ordersService.create(testTenantId, orderData);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() orderData: any) {
    return this.ordersService.create(req.user.tenantId, orderData);
  }

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.ordersService.findAll(req.user.tenantId, filters);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.ordersService.getStats(req.user.tenantId);
  }

  @Get('recent')
  getRecent(@Request() req, @Query('limit') limit?: string) {
    return this.ordersService.getRecentOrders(req.user.tenantId, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto, @Request() req) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user.tenantId);
  }
}
