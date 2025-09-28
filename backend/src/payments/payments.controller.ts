import { Controller, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments for tenant' })
  @ApiQuery({ name: 'orderId', required: false, description: 'Filter by order ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'provider', required: false, description: 'Filter by provider' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll(@Request() req, @Query() filters: any) {
    return this.paymentsService.findAll(req.user.tenantId, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@Request() req) {
    return this.paymentsService.getStats(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentsService.findOne(id, req.user.tenantId);
  }
}
