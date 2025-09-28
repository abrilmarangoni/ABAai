import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Café del Centro',
      domain: 'cafe-del-centro',
      whatsappConfig: JSON.stringify({
        phoneNumber: '+549111234567',
        connected: false
      }),
      openaiQuota: 10000,
      isActive: true
    }
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create owner user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'owner@cafe-del-centro.com',
      passwordHash: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'OWNER',
      isActive: true
    }
  });

  console.log('✅ Created owner user:', owner.email);

  // Create some products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Café Americano',
        description: 'Café americano tradicional',
        price: 500,
        sku: 'CAF-001',
        available: true
      }
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Café Cortado',
        description: 'Café con un poco de leche',
        price: 400,
        sku: 'CAF-002',
        available: true
      }
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Medialuna',
        description: 'Medialuna dulce',
        price: 300,
        sku: 'MED-001',
        available: true
      }
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Tostado',
        description: 'Sandwich tostado',
        price: 800,
        sku: 'TOS-001',
        available: true
      }
    })
  ]);

  console.log('✅ Created products:', products.length);

  // Create some sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerName: 'María González',
        customerPhone: '+549111234567',
        items: JSON.stringify([
          { productId: products[0].id, name: 'Café Americano', quantity: 2, price: 500 },
          { productId: products[2].id, name: 'Medialuna', quantity: 1, price: 300 }
        ]),
        totalPrice: 1300,
        status: 'PENDIENTE',
        paymentMethod: 'MERCADOPAGO'
      }
    }),
    prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerName: 'Carlos López',
        customerPhone: '+549111234568',
        items: JSON.stringify([
          { productId: products[1].id, name: 'Café Cortado', quantity: 1, price: 400 },
          { productId: products[3].id, name: 'Tostado', quantity: 1, price: 800 }
        ]),
        totalPrice: 1200,
        status: 'PAGADO',
        paymentMethod: 'COMPROBANTE'
      }
    }),
    prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerName: 'Ana Martínez',
        customerPhone: '+549111234569',
        items: JSON.stringify([
          { productId: products[0].id, name: 'Café Americano', quantity: 1, price: 500 },
          { productId: products[1].id, name: 'Café Cortado', quantity: 1, price: 400 },
          { productId: products[2].id, name: 'Medialuna', quantity: 2, price: 300 }
        ]),
        totalPrice: 1500,
        status: 'ENTREGADO',
        paymentMethod: 'EFECTIVO'
      }
    })
  ]);

  console.log('✅ Created orders:', orders.length);

  // Create some sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        tenantId: tenant.id,
        orderId: orders[0].id,
        from: 'CUSTOMER',
        direction: 'INBOUND',
        text: 'Hola, quiero 2 cafés americanos y una medialuna',
        nlpMeta: JSON.stringify({
          intent: 'order',
          entities: ['café americano', 'medialuna'],
          confidence: 0.9
        })
      }
    }),
    prisma.message.create({
      data: {
        tenantId: tenant.id,
        orderId: orders[0].id,
        from: 'ABA',
        direction: 'OUTBOUND',
        text: 'Perfecto! Tu pedido es: 2 Cafés Americanos ($1000) + 1 Medialuna ($300) = Total: $1300. ¿Confirmas?'
      }
    }),
    prisma.message.create({
      data: {
        tenantId: tenant.id,
        orderId: orders[0].id,
        from: 'CUSTOMER',
        direction: 'INBOUND',
        text: 'Sí, confirmo. ¿Cómo pago?'
      }
    })
  ]);

  console.log('✅ Created messages:', messages.length);

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Test credentials:');
  console.log('   Email: owner@cafe-del-centro.com');
  console.log('   Password: password123');
  console.log('');
  console.log('📊 Sample data created:');
  console.log(`   - 1 Tenant: ${tenant.name}`);
  console.log(`   - 1 User: ${owner.email}`);
  console.log(`   - ${products.length} Products`);
  console.log(`   - ${orders.length} Orders`);
  console.log(`   - ${messages.length} Messages`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
