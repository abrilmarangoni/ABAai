import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: {
    orderId?: string;
    status?: string;
    provider?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.provider) {
      where.provider = filters.provider;
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

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      hasMore: (filters?.offset || 0) + payments.length < total,
    };
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        order: {
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getStats(tenantId: string) {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.payment.count({ where: { tenantId } }),
      this.prisma.payment.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.payment.count({ where: { tenantId, status: 'APPROVED' } }),
      this.prisma.payment.count({ where: { tenantId, status: 'REJECTED' } }),
    ]);

    const revenueResult = await this.prisma.payment.aggregate({
      where: {
        tenantId,
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      totalRevenue: revenueResult._sum.amount || 0,
    };
  }
}
