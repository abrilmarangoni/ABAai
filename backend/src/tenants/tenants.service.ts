import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orders: true,
            products: true,
            users: true,
          },
        },
      },
    });
  }

  async updateWhatsAppConfig(tenantId: string, config: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappConfig: config,
      },
    });
  }

  async getConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        whatsappConfig: true,
        openaiQuota: true,
        isActive: true,
      },
    });

    return {
      ...tenant,
      whatsappConnected: !!tenant?.whatsappConfig,
    };
  }
}
