import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.messagesService.findAll(req.user.tenantId, filters);
  }
}