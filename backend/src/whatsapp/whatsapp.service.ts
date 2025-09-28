import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          document?: {
            id: string;
            mime_type: string;
            sha256: string;
            filename: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

@Injectable()
export class WhatsappService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('message-processing') private messageQueue: Queue,
  ) {}

  async handleWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const { messages, metadata } = change.value;
            
            if (messages) {
              for (const message of messages) {
                await this.processIncomingMessage(message, metadata);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  private async processIncomingMessage(message: any, metadata: any): Promise<void> {
    // Find tenant by phone number
    const tenant = await this.findTenantByPhoneNumber(metadata.phone_number_id);
    
    if (!tenant) {
      console.warn(`No tenant found for phone number: ${metadata.phone_number_id}`);
      return;
    }

    // Create message record
    const messageRecord = await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        from: 'CUSTOMER',
        direction: 'INBOUND',
        text: message.text?.body || '',
        mediaUrl: message.image?.id || message.document?.id,
      },
    });

    // Queue message for AI processing
    await this.messageQueue.add('process-message', {
      messageId: messageRecord.id,
      tenantId: tenant.id,
      customerPhone: message.from,
      messageText: message.text?.body || '',
      mediaUrl: message.image?.id || message.document?.id,
    });
  }

  private async findTenantByPhoneNumber(phoneNumberId: string): Promise<any> {
    // This would need to be implemented based on your WhatsApp config storage
    // For now, we'll use a simple approach
    const tenants = await this.prisma.tenant.findMany({
      where: {
        whatsappConfig: {
          contains: phoneNumberId
        },
      },
    });

    return tenants[0];
  }

  async sendMessage(tenantId: string, to: string, message: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.whatsappConfig) {
      throw new Error('WhatsApp not configured for tenant');
    }

    // TODO: Implement actual WhatsApp API call
    console.log(`Sending message to ${to}: ${message}`);
    
    // Create outbound message record
    await this.prisma.message.create({
      data: {
        tenantId,
        from: 'ABA',
        direction: 'OUTBOUND',
        text: message,
      },
    });
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string> {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    
    throw new Error('Webhook verification failed');
  }
}
