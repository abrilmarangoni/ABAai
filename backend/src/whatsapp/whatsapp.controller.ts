import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WhatsappService, WhatsAppWebhookPayload } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get()
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  @ApiQuery({ name: 'hub.mode', description: 'Verification mode' })
  @ApiQuery({ name: 'hub.challenge', description: 'Challenge string' })
  @ApiQuery({ name: 'hub.verify_token', description: 'Verification token' })
  @ApiResponse({ status: 200, description: 'Webhook verified' })
  @ApiResponse({ status: 403, description: 'Verification failed' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ): Promise<string> {
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async receiveWebhook(@Body() payload: WhatsAppWebhookPayload): Promise<{ status: string }> {
    await this.whatsappService.handleWebhook(payload);
    return { status: 'ok' };
  }
}
