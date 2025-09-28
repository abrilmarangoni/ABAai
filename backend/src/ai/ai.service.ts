import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface NLPResult {
  intent: 'order' | 'inquiry' | 'complaint' | 'greeting' | 'unknown';
  entities: {
    products?: Array<{ name: string; quantity: number; price?: number; originalRequest?: string }>;
    total?: number;
    uncertainty?: string[];
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
      sku: p.sku,
      available: p.available,
      stock: p.stock || 0,
      minStock: p.minStock || 0,
      trackStock: p.trackStock || false,
    }));

    // Detectar tipo de negocio basado en productos
    const businessType = this.detectBusinessType(products);
    
    const systemPrompt = `Eres ABA, un asistente conversacional experto y súper preciso para ${tenant.name} (${businessType}).

INSTRUCCIONES CRÍTICAS:
1. DEBES ser extremadamente preciso al identificar productos
2. SOLO reconocer productos que estén en la lista exacta
3. Si hay ambigüedad, pregunta por clarificación
4. Calcula precios exactos basado en cantidades
5. Usa nombres EXACTOS de productos de la lista

PRODUCTOS DISPONIBLES (NOMBRES EXACTOS):
${products.map(p => {
  const stockInfo = p.trackStock ? `[Stock: ${p.stock}${p.minStock ? `, Mín: ${p.minStock}` : ''}]` : '[Sin control de stock]';
  const descriptionInfo = p.description ? `\n  Descripción: ${p.description}` : '\n  Descripción: No disponible';
  return `- ${p.name} ($${p.price}) ${p.description ? `- ${p.description}` : ''} ${p.sku ? `[${p.sku}]` : ''} ${stockInfo}${descriptionInfo}`;
}).join('\n')}

REGLAS DE RECONOCIMIENTO:
- Si el cliente dice "pizza" pero solo hay "Pizza Margherita", NO asumas el tipo
- Si dice "camiseta" pero hay "Camiseta Básica" y "Camiseta Premium", pregunta cuál
- Si menciona cantidades implícitas ("un par de zapatos"), pregunta por cantidad exacta
- Si hay productos similares, pregunta por especificación
- SI UN PRODUCTO TIENE STOCK INSUFICIENTE, informa al cliente inmediatamente
- Si un producto tiene stock bajo (cerca del mínimo), menciona la disponibilidad limitada
- USA LAS DESCRIPCIONES para responder preguntas sobre ingredientes, características, alérgenos, etc.
- Si un cliente pregunta sobre detalles de un producto, proporciona la información de la descripción
- Si no hay descripción disponible, di "No tengo información adicional sobre este producto"

TIPOS DE INTENCIONES:
- "order": Cliente quiere comprar productos específicos
- "inquiry": Pregunta sobre productos, precios, disponibilidad
- "complaint": Queja o problema con pedido anterior
- "greeting": Saludo inicial
- "unknown": No puedes determinar la intención claramente

FORMATO DE RESPUESTA JSON EXACTO:
{
  "intent": "order|inquiry|complaint|greeting|unknown",
  "entities": {
    "products": [{"name": "NOMBRE_EXACTO_DEL_PRODUCTO", "quantity": numero_exacto}],
    "total": precio_total_calculado,
    "uncertainty": ["lista_de_productos_ambiguos_si_los_hay"]
  },
  "confidence": 0.0-1.0,
  "response": "Respuesta específica y precisa al cliente"
}

EJEMPLOS DE PRECISIÓN:
- Cliente: "Quiero una pizza" → Pregunta: "¿Qué tipo de pizza? Tenemos Pizza Margherita ($15.99) y Pizza Pepperoni ($18.50)"
- Cliente: "2 camisetas" → Pregunta: "¿Qué tipo de camisetas? Tenemos Camiseta Básica ($25) y Camiseta Premium ($35)"
- Cliente: "Quiero 3 pizzas margherita" → Confirma: "Perfecto, 3 Pizzas Margherita = $47.97"
- Cliente: "Quiero 10 camisetas básicas" pero solo hay 5 en stock → Informa: "Solo tenemos 5 Camisetas Básicas disponibles. ¿Te gustaría pedir las 5 disponibles o prefieres otro producto?"
- Cliente: "¿El café americano tiene azúcar?" → Responde usando la descripción del producto
- Cliente: "¿Qué ingredientes tiene la pizza margherita?" → Responde usando la descripción del producto`;

    const userPrompt = `Mensaje del cliente: "${messageText}"

Historial de conversación:
${conversationHistory.map(msg => `${msg.from}: ${msg.text}`).join('\n')}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4', // Usar GPT-4 para mayor precisión
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Temperatura más baja para mayor consistencia
      max_tokens: 800, // Más tokens para respuestas detalladas
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content;
    
    try {
      const parsedResponse = JSON.parse(response || '{}');
      
      // Validar que la respuesta tenga la estructura correcta
      if (!parsedResponse.intent || !parsedResponse.response) {
        throw new Error('Invalid response structure');
      }
      
      // Validar productos si es un pedido
      if (parsedResponse.intent === 'order' && parsedResponse.entities?.products) {
        parsedResponse.entities.products = this.validateProducts(
          parsedResponse.entities.products, 
          products
        );
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', response);
      
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0.1,
        response: 'Lo siento, estoy teniendo dificultades para procesar tu mensaje. ¿Podrías ser más específico sobre lo que necesitas?',
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

  private detectBusinessType(products: any[]): string {
    const productNames = products.map(p => p.name.toLowerCase()).join(' ');
    
    // Detectar tipo de negocio basado en palabras clave
    if (productNames.includes('pizza') || productNames.includes('hamburguesa') || 
        productNames.includes('café') || productNames.includes('comida')) {
      return 'Restaurante/Comida';
    }
    
    if (productNames.includes('camiseta') || productNames.includes('pantalón') || 
        productNames.includes('zapato') || productNames.includes('ropa')) {
      return 'Tienda de Ropa';
    }
    
    if (productNames.includes('limpieza') || productNames.includes('servicio') || 
        productNames.includes('reparación') || productNames.includes('instalación')) {
      return 'Servicios';
    }
    
    if (productNames.includes('torta') || productNames.includes('pastel') || 
        productNames.includes('dulce') || productNames.includes('postre')) {
      return 'Pastelería';
    }
    
    if (productNames.includes('medicina') || productNames.includes('farmacia') || 
        productNames.includes('vitamina')) {
      return 'Farmacia';
    }
    
    return 'Negocio General';
  }

  private validateProducts(aiProducts: any[], availableProducts: any[]): any[] {
    const validProducts = [];
    const availableNames = availableProducts.map(p => p.name.toLowerCase());
    
    for (const product of aiProducts) {
      const productName = product.name.toLowerCase();
      
      // Buscar coincidencia exacta o muy similar
      const exactMatch = availableProducts.find(p => 
        p.name.toLowerCase() === productName
      );
      
      if (exactMatch) {
        // Verificar stock si está habilitado el control
        if (exactMatch.trackStock && exactMatch.stock < (product.quantity || 1)) {
          // Producto encontrado pero sin stock suficiente
          validProducts.push({
            name: exactMatch.name,
            quantity: product.quantity || 1,
            price: exactMatch.price,
            stockAvailable: exactMatch.stock,
            insufficientStock: true
          });
        } else {
          validProducts.push({
            name: exactMatch.name, // Usar nombre exacto de la base de datos
            quantity: product.quantity || 1,
            price: exactMatch.price,
            stockAvailable: exactMatch.trackStock ? exactMatch.stock : null
          });
        }
      } else {
        // Buscar coincidencia parcial
        const partialMatch = availableProducts.find(p => 
          p.name.toLowerCase().includes(productName) || 
          productName.includes(p.name.toLowerCase())
        );
        
        if (partialMatch) {
          // Verificar stock si está habilitado el control
          if (partialMatch.trackStock && partialMatch.stock < (product.quantity || 1)) {
            validProducts.push({
              name: partialMatch.name,
              quantity: product.quantity || 1,
              price: partialMatch.price,
              originalRequest: product.name,
              stockAvailable: partialMatch.stock,
              insufficientStock: true
            });
          } else {
            validProducts.push({
              name: partialMatch.name,
              quantity: product.quantity || 1,
              price: partialMatch.price,
              originalRequest: product.name, // Guardar la solicitud original
              stockAvailable: partialMatch.trackStock ? partialMatch.stock : null
            });
          }
        }
      }
    }
    
    return validProducts;
  }
}
