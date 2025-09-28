import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductsService } from '../products/products.service';

@Processor('message-processing')
@Injectable()
export class MessageProcessor {
  constructor(
    private aiService: AiService,
    private whatsappService: WhatsappService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private productsService: ProductsService,
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

      // If it's an order, create it (con mayor precisión)
      if (nlpResult.intent === 'order' && nlpResult.confidence >= 0.8) {
        // First check stock availability for all products
        const stockCheckResults = [];
        let allProductsAvailable = true;
        
        for (const product of nlpResult.entities.products || []) {
          // Buscar el producto real en la base de datos para obtener el ID
          const realProduct = await this.productsService.findByName(product.name, tenantId);
          
          if (!realProduct) {
            stockCheckResults.push({
              product: product.name,
              available: false,
              reason: 'Product not found'
            });
            allProductsAvailable = false;
            continue;
          }
          
          const stockCheck = await this.productsService.checkStockAvailability(
            realProduct.id,
            product.quantity,
            tenantId
          );
          
          stockCheckResults.push({
            product: product.name,
            available: stockCheck.available,
            reason: stockCheck.reason
          });
          
          if (!stockCheck.available) {
            allProductsAvailable = false;
          }
        }

        if (allProductsAvailable) {
          // Create order and update stock
          const order = await this.aiService.createOrder(tenantId, customerPhone, nlpResult);
          
          if (order) {
            // Update stock for all products in the order
            for (const product of nlpResult.entities.products || []) {
              const realProduct = await this.productsService.findByName(product.name, tenantId);
              if (realProduct) {
                await this.productsService.updateStock(realProduct.id, product.quantity, tenantId);
              }
            }
            
            // Notify tenant about new order
            await this.notificationsService.notifyNewOrder(tenantId, order);
            
            // Send detailed confirmation message
            const orderDetails = nlpResult.entities.products?.map(p => 
              `${p.quantity}x ${p.name} ($${p.price * p.quantity})`
            ).join(', ') || 'Productos';
            
            await this.whatsappService.sendMessage(
              tenantId,
              customerPhone,
              `✅ Pedido confirmado:\n${orderDetails}\n\n💰 Total: $${order.totalPrice}\n\n¿Cómo te gustaría pagar?`,
            );
          }
        } else {
          // Send stock unavailability message
          const unavailableProducts = stockCheckResults
            .filter(result => !result.available)
            .map(result => `• ${result.product}: ${result.reason}`)
            .join('\n');
          
          await this.whatsappService.sendMessage(
            tenantId,
            customerPhone,
            `❌ Lo siento, algunos productos no están disponibles:\n\n${unavailableProducts}\n\n¿Te gustaría modificar tu pedido?`,
          );
        }
      } else if (nlpResult.intent === 'order' && nlpResult.confidence < 0.8) {
        // Si hay productos ambiguos, preguntar por clarificación
        if (nlpResult.entities.uncertainty && nlpResult.entities.uncertainty.length > 0) {
          await this.whatsappService.sendMessage(
            tenantId,
            customerPhone,
            `Para procesar tu pedido correctamente, necesito más detalles:\n\n${nlpResult.entities.uncertainty.map(u => `• ${u}`).join('\n')}\n\n¿Podrías ser más específico?`,
          );
        } else {
          await this.whatsappService.sendMessage(
            tenantId,
            customerPhone,
            `No estoy seguro de entender tu pedido. ¿Podrías ser más específico sobre los productos que quieres?`,
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
