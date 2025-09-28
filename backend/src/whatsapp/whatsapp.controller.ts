import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WhatsappService, WhatsAppWebhookPayload } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    return this.whatsappService.handleWebhook(payload);
  }

  @Get('webhook')
  async verifyWebhook(@Query() query: any) {
    return this.whatsappService.verifyWebhook(
      query['hub.mode'],
      query['hub.verify_token'],
      query['hub.challenge']
    );
  }

  @Post('send-message')
  async sendMessage(@Body() body: { phoneNumber: string; message: string; tenantId: string }) {
    return this.whatsappService.sendMessage(body.phoneNumber, body.message, body.tenantId);
  }
}