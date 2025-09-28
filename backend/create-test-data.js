const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🌱 Creating test data...');
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Mi Negocio',
        domain: 'mi-negocio',
        whatsappConfig: JSON.stringify({ connected: false }),
        openaiQuota: 10000,
        isActive: true
      }
    });
    
    console.log('✅ Tenant created:', tenant.name);
    
    // Create user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Usuario',
        lastName: 'Prueba',
        role: 'OWNER',
        isActive: true
      }
    });
    
    console.log('✅ User created:', user.email);
    
    // Create products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          tenantId: tenant.id,
          name: 'Café Americano',
          price: 5.50,
          sku: 'CAFE-001',
          available: true
        }
      }),
      prisma.product.create({
        data: {
          tenantId: tenant.id,
          name: 'Medialuna',
          price: 3.50,
          sku: 'MED-001',
          available: true
        }
      })
    ]);
    
    console.log('✅ Products created:', products.length);
    
    console.log('🎉 Test data created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
