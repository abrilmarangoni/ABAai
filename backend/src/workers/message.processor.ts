import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('message-processing')
@Injectable()
export class MessageProcessor {
  constructor(
    private aiService: AiService,
    private whatsappService: WhatsappService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Process('process-message')
  async handleMessageProcessing(job: Job<{
    messageId: string;
    tenantId: string;
    customerPhone: string;
    messageText: string;
    mediaUrl?: string;
  }>) {
    const { messageId, tenantId, customerPhone, messageText } = job.data;

    try {
      // Process message with AI
      const nlpResult = await this.aiService.processMessage(
        messageId,
        tenantId,
        customerPhone,
        messageText,
      );

      // Send response to customer
      await this.whatsappService.sendMessage(
        tenantId,
        customerPhone,
        nlpResult.response,
      );

      // If it's an order, create it
      if (nlpResult.intent === 'order' && nlpResult.confidence >= 0.6) {
        const order = await this.aiService.createOrder(tenantId, customerPhone, nlpResult);
        
        if (order) {
          // Notify tenant about new order
          await this.notificationsService.notifyNewOrder(tenantId, order);
          
          // Send confirmation message
          await this.whatsappService.sendMessage(
            tenantId,
            customerPhone,
            `¡Perfecto! He creado tu pedido por $${order.totalPrice}. ¿Cómo te gustaría pagar?`,
          );
        }
      }

      // If confidence is low, escalate to human
      if (nlpResult.confidence < 0.6) {
        await this.notificationsService.notifyEscalation(tenantId, {
          customerPhone,
          message: messageText,
          confidence: nlpResult.confidence,
        });
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error message to customer
      await this.whatsappService.sendMessage(
        tenantId,
        customerPhone,
        'Lo siento, estoy teniendo problemas técnicos. Por favor intenta de nuevo en unos minutos.',
      );
    }
  }
}
