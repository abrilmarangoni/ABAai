import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: {
    orderId?: string;
    customerPhone?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.customerPhone) {
      where.text = {
        contains: filters.customerPhone,
      };
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

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
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
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      total,
      hasMore: (filters?.offset || 0) + messages.length < total,
    };
  }

  async getConversation(tenantId: string, customerPhone: string) {
    return this.prisma.message.findMany({
      where: {
        tenantId,
        text: {
          contains: customerPhone,
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }
}
