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

  // Stock management methods
  async updateStock(productId: string, quantity: number, tenantId: string) {
    return this.prisma.product.update({
      where: { id: productId, tenantId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }

  async checkStockAvailability(productId: string, requestedQuantity: number, tenantId: string) {
    const product = await this.findOne(productId, tenantId);
    
    if (!product) {
      return { available: false, reason: 'Product not found' };
    }

    if (!product.trackStock) {
      return { available: true, reason: 'Stock tracking disabled' };
    }

    if (product.stock < requestedQuantity) {
      return { 
        available: false, 
        reason: `Insufficient stock. Available: ${product.stock}, Requested: ${requestedQuantity}` 
      };
    }

    return { available: true, reason: 'Stock available' };
  }

  async getLowStockProducts(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        trackStock: true,
      },
    });

    return products.filter(product => 
      product.minStock && product.stock <= product.minStock
    );
  }
}
