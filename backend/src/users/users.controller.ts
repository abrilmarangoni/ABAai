import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users for tenant' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id/role')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  updateRole(@Param('id') id: string, @Body('role') role: string, @Request() req) {
    return this.usersService.updateRole(id, role, req.user.tenantId);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.usersService.toggleActive(id, req.user.tenantId);
  }
}
