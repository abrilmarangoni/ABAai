import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages for tenant' })
  @ApiQuery({ name: 'orderId', required: false, description: 'Filter by order ID' })
  @ApiQuery({ name: 'customerPhone', required: false, description: 'Filter by customer phone' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  findAll(@Request() req, @Query() filters: any) {
    return this.messagesService.findAll(req.user.tenantId, filters);
  }

  @Get('conversation')
  @ApiOperation({ summary: 'Get conversation with customer' })
  @ApiQuery({ name: 'customerPhone', required: true, description: 'Customer phone number' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  getConversation(@Request() req, @Query('customerPhone') customerPhone: string) {
    return this.messagesService.getConversation(req.user.tenantId, customerPhone);
  }
}
