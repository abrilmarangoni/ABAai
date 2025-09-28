const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenants() {
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('📊 Tenants encontrados:', tenants.length);
    
    tenants.forEach((tenant, index) => {
      const config = JSON.parse(tenant.whatsappConfig || '{}');
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   - WhatsApp conectado: ${config.connected || false}`);
      console.log(`   - Número: ${config.phoneNumber || 'No configurado'}`);
      console.log('');
    });
    
    // Conectar el primer tenant a WhatsApp para pruebas
    if (tenants.length > 0) {
      const tenant = tenants[0];
      const config = {
        phoneNumber: '+549111234567',
        businessName: tenant.name,
        connected: true,
        connectedAt: new Date().toISOString()
      };
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          whatsappConfig: JSON.stringify(config)
        }
      });
      
      console.log('✅ Tenant conectado a WhatsApp para pruebas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants();
