import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          payments: true,
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      hasMore: (filters?.offset || 0) + orders.length < total,
    };
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        payments: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderStatusDto.status,
        updatedAt: new Date(),
      },
    });
  }

  async getStats(tenantId: string) {
    const [total, pending, paid, delivered, cancelled] = await Promise.all([
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.order.count({ where: { tenantId, status: 'PENDIENTE' } }),
      this.prisma.order.count({ where: { tenantId, status: 'PAGADO' } }),
      this.prisma.order.count({ where: { tenantId, status: 'ENTREGADO' } }),
      this.prisma.order.count({ where: { tenantId, status: 'CANCELADO' } }),
    ]);

    const revenueResult = await this.prisma.order.aggregate({
      where: {
        tenantId,
        status: { in: ['PAGADO', 'ENTREGADO'] },
      },
      _sum: {
        totalPrice: true,
      },
    });

    return {
      total,
      pending,
      paid,
      delivered,
      cancelled,
      totalRevenue: revenueResult._sum.totalPrice || 0,
    };
  }

  async getRecentOrders(tenantId: string, limit = 10) {
    return this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        payments: true,
      },
    });
  }
}
