import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { MercadopagoModule } from '../mercadopago/mercadopago.module';

@Module({
  imports: [WhatsappModule, MercadopagoModule],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
