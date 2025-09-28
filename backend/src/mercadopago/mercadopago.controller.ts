import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MercadopagoService } from './mercadopago.service';

@ApiTags('MercadoPago')
@Controller('webhooks/mercadopago')
export class MercadopagoController {
  constructor(private mercadopagoService: MercadopagoService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive MercadoPago webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async receiveWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ): Promise<{ status: string }> {
    // Verify webhook signature
    const isValid = await this.mercadopagoService.verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
    );

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    await this.mercadopagoService.handleWebhook(payload);
    return { status: 'ok' };
  }
}
