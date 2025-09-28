import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MercadopagoService {
  private client: MercadoPagoConfig;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get('MERCADOPAGO_ACCESS_TOKEN'),
    });
  }

  async createPaymentPreference(orderId: string): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tenant: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const items = JSON.parse(order.items as string);

    const preference = new Preference(this.client);
    
    const preferenceData = {
      items: items.map((item: any) => ({
        title: item.name,
        quantity: item.qty,
        unit_price: Number(item.price),
        currency_id: 'ARS',
      })),
      payer: {
        name: order.customerName,
        phone: {
          number: order.customerPhone,
        },
      },
      external_reference: orderId,
      notification_url: `${this.configService.get('BASE_URL')}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${this.configService.get('BASE_URL')}/payment/success`,
        failure: `${this.configService.get('BASE_URL')}/payment/failure`,
        pending: `${this.configService.get('BASE_URL')}/payment/pending`,
      },
      auto_return: 'approved',
    };

    try {
      const response = await preference.create({ body: preferenceData });
      
      // Create payment record
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          tenantId: order.tenantId,
          provider: 'MERCADOPAGO',
          providerPaymentId: response.id,
          amount: order.totalPrice,
          status: 'PENDING',
        },
      });

      return response.init_point;
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    try {
      const { type, data } = payload;

      if (type === 'payment') {
        const paymentId = data.id;
        await this.updatePaymentStatus(paymentId);
      }
    } catch (error) {
      console.error('Error processing MercadoPago webhook:', error);
      throw error;
    }
  }

  private async updatePaymentStatus(paymentId: string): Promise<void> {
    try {
      // Get payment from MercadoPago
      const payment = new Payment(this.client);
      const paymentData = await payment.get({ id: paymentId });

      // Find payment record in database
      const dbPayment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: paymentId },
        include: { order: true },
      });

      if (!dbPayment) {
        console.warn(`Payment record not found for MercadoPago payment ${paymentId}`);
        return;
      }

      // Update payment status
      const status = this.mapMercadoPagoStatus(paymentData.status);
      
      await this.prisma.payment.update({
        where: { id: dbPayment.id },
        data: {
          status,
          receivedAt: status === 'APPROVED' ? new Date() : null,
          metadata: JSON.stringify(paymentData),
        },
      });

      // Update order status if payment approved
      if (status === 'APPROVED') {
        await this.prisma.order.update({
          where: { id: dbPayment.orderId },
          data: { 
            status: 'PAGADO',
            paymentMethod: 'MERCADOPAGO',
            paymentRef: paymentId,
          },
        });

        // Notify about payment received
        await this.notificationsService.notifyPaymentReceived(
          dbPayment.tenantId,
          dbPayment.order,
        );
      }

    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  private mapMercadoPagoStatus(status: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' {
    switch (status) {
      case 'approved':
        return 'APPROVED';
      case 'rejected':
      case 'cancelled':
        return 'REJECTED';
      case 'pending':
      case 'in_process':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    // TODO: Implement webhook signature verification
    // This is important for production security
    return true;
  }
}
