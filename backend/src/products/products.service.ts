import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.product.findFirst({
      where: { id, tenantId },
    });
  }

  async create(createProductDto: CreateProductDto, tenantId: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        tenantId,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto, tenantId: string) {
    return this.prisma.product.update({
      where: { id, tenantId },
      data: updateProductDto,
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.product.delete({
      where: { id, tenantId },
    });
  }
}
