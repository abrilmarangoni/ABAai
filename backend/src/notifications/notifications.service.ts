import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: this.configService.get('SENDGRID_API_KEY'),
      },
    });
  }

  async notifyNewOrder(tenantId: string, order: any): Promise<void> {
    // Get tenant owner
    const owner = await this.prisma.user.findFirst({
      where: {
        tenantId,
        role: 'OWNER',
      },
    });

    if (!owner) {
      console.warn(`No owner found for tenant ${tenantId}`);
      return;
    }

    // Send email notification
    const mailOptions = {
      from: this.configService.get('FROM_EMAIL'),
      to: owner.email,
      subject: `Nuevo pedido en ${order.tenant?.name || 'tu negocio'}`,
      html: `
        <h2>¡Nuevo pedido recibido!</h2>
        <p><strong>Cliente:</strong> ${order.customerName}</p>
        <p><strong>Teléfono:</strong> ${order.customerPhone}</p>
        <p><strong>Total:</strong> $${order.totalPrice}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${JSON.parse(order.items).map((item: any) => 
            `<li>${item.qty}x ${item.name} - $${item.price}</li>`
          ).join('')}
        </ul>
        <p><a href="${this.configService.get('BASE_URL')}/dashboard/orders/${order.id}">Ver pedido en dashboard</a></p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email notification sent to ${owner.email}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }

    // Send Telegram notification
    await this.sendTelegramNotification(`
🛒 *Nuevo Pedido*
Cliente: ${order.customerName}
Teléfono: ${order.customerPhone}
Total: $${order.totalPrice}
[Ver en dashboard](${this.configService.get('BASE_URL')}/dashboard/orders/${order.id})
    `);
  }

  async notifyEscalation(tenantId: string, data: {
    customerPhone: string;
    message: string;
    confidence: number;
  }): Promise<void> {
    await this.sendTelegramNotification(`
⚠️ *Escalación Requerida*
Cliente: ${data.customerPhone}
Mensaje: ${data.message}
Confianza: ${(data.confidence * 100).toFixed(1)}%
    `);
  }

  async notifyPaymentReceived(tenantId: string, order: any): Promise<void> {
    await this.sendTelegramNotification(`
💰 *Pago Recibido*
Pedido: #${order.id}
Cliente: ${order.customerName}
Total: $${order.totalPrice}
    `);
  }

  private async sendTelegramNotification(message: string): Promise<void> {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get('TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      console.warn('Telegram credentials not configured');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send Telegram notification:', await response.text());
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  }
}
