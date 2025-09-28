import { Controller, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.paymentsService.findAll(req.user.tenantId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentsService.findOne(id, req.user.tenantId);
  }
}