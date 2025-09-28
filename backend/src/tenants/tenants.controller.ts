import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant info' })
  @ApiResponse({ status: 200, description: 'Tenant info retrieved successfully' })
  getCurrentTenant(@Request() req) {
    return this.tenantsService.findOne(req.user.tenantId);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get tenant configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  getConfig(@Request() req) {
    return this.tenantsService.getConfig(req.user.tenantId);
  }
}
