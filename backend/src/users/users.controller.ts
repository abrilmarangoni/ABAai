import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id/role')
  @Roles('OWNER')
  updateRole(@Param('id') id: string, @Body('role') role: string, @Request() req) {
    return this.usersService.updateRole(id, role, req.user.tenantId);
  }

  @Patch(':id/toggle-active')
  @Roles('OWNER', 'ADMIN')
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.usersService.toggleActive(id, req.user.tenantId);
  }
}