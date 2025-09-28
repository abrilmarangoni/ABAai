import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async handleWhatsAppWebhook(payload: any): Promise<void> {
    // This will be implemented by the WhatsappService
    console.log('WhatsApp webhook received:', payload);
  }

  async handleMercadoPagoWebhook(payload: any): Promise<void> {
    // This will be implemented by the MercadopagoService
    console.log('MercadoPago webhook received:', payload);
  }
}
