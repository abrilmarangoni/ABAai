import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface NLPResult {
  intent: 'order' | 'inquiry' | 'complaint' | 'greeting' | 'unknown';
  entities: {
    products?: Array<{ name: string; quantity: number }>;
    total?: number;
  };
  confidence: number;
  response: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async processMessage(
    messageId: string,
    tenantId: string,
    customerPhone: string,
    messageText: string,
  ): Promise<NLPResult> {
    try {
      // Get tenant and products
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { products: true },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get conversation history
      const conversationHistory = await this.getConversationHistory(tenantId, customerPhone);

      // Process with OpenAI
      const nlpResult = await this.analyzeMessage(messageText, tenant, conversationHistory);

      // Update message with NLP metadata
      await this.prisma.message.update({
        where: { id: messageId },
        data: { nlpMeta: nlpResult },
      });

      return nlpResult;
    } catch (error) {
      console.error('Error processing message with AI:', error);
      throw error;
    }
  }

  private async analyzeMessage(
    messageText: string,
    tenant: any,
    conversationHistory: any[],
  ): Promise<NLPResult> {
    const products = tenant.products.map((p: any) => ({
      name: p.name,
      price: p.price,
      description: p.description,
    }));

    const systemPrompt = `Eres ABA, un asistente conversacional amigable para ${tenant.name}. 
    
Tu trabajo es:
1. Detectar la intención del cliente (order, inquiry, complaint, greeting, unknown)
2. Si es un pedido, extraer productos y cantidades
3. Generar una respuesta apropiada en español, corta y amigable

Productos disponibles:
${JSON.stringify(products)}

Responde en formato JSON:
{
  "intent": "order|inquiry|complaint|greeting|unknown",
  "entities": {
    "products": [{"name": "producto", "quantity": 2}],
    "total": 1500
  },
  "confidence": 0.95,
  "response": "Tu respuesta al cliente"
}`;

    const userPrompt = `Mensaje del cliente: "${messageText}"

Historial de conversación:
${conversationHistory.map(msg => `${msg.from}: ${msg.text}`).join('\n')}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    
    try {
      return JSON.parse(response || '{}');
    } catch {
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0.5,
        response: 'Lo siento, no pude entender tu mensaje. ¿Podrías ser más específico?',
      };
    }
  }

  private async getConversationHistory(tenantId: string, customerPhone: string, limit = 10) {
    return this.prisma.message.findMany({
      where: {
        tenantId,
        text: {
          contains: customerPhone,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        from: true,
        text: true,
        createdAt: true,
      },
    });
  }

  async createOrder(tenantId: string, customerPhone: string, nlpResult: NLPResult): Promise<any> {
    if (nlpResult.intent !== 'order' || !nlpResult.entities.products) {
      return null;
    }

    const products = nlpResult.entities.products;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { products: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Match products with tenant's catalog
    const orderItems = [];
    let totalPrice = 0;

    for (const item of products) {
      const product = tenant.products.find((p: any) => 
        p.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (product) {
        orderItems.push({
          productId: product.id,
          name: product.name,
          qty: item.quantity,
          price: product.price,
        });
        totalPrice += Number(product.price) * item.quantity;
      }
    }

    if (orderItems.length === 0) {
      return null;
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        customerName: 'Cliente', // TODO: Extract from conversation or ask
        customerPhone,
        items: orderItems,
        totalPrice,
        status: 'PENDIENTE',
      },
    });

    return order;
  }
}
