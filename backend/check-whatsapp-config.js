// Test real WhatsApp message sending
const fetch = require('node-fetch');

async function testRealWhatsAppSending() {
  try {
    console.log('📱 Probando envío real a WhatsApp...');
    
    // Get your tenant info
    const tenantResponse = await fetch('http://localhost:4000/api/tenants/me', {
      headers: {
        'Authorization': 'Bearer ' + process.env.TEST_TOKEN || 'test-token'
      }
    });
    
    if (!tenantResponse.ok) {
      console.log('❌ Necesitas estar logueado para probar');
      console.log('💡 Ve al dashboard y usa la pestaña "Probador"');
      return;
    }
    
    const tenant = await tenantResponse.json();
    const whatsappConfig = JSON.parse(tenant.whatsappConfig || '{}');
    
    console.log('📋 Configuración actual:');
    console.log(`- Número: ${whatsappConfig.phoneNumber}`);
    console.log(`- Conectado: ${whatsappConfig.connected}`);
    console.log(`- Phone Number ID: ${whatsappConfig.phoneNumberId || 'NO CONFIGURADO'}`);
    console.log(`- Access Token: ${whatsappConfig.accessToken ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    
    if (!whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
      console.log('');
      console.log('🔧 PROBLEMA IDENTIFICADO:');
      console.log('❌ Faltan las credenciales de Meta WhatsApp Business API');
      console.log('');
      console.log('📋 Para que funcione necesitas:');
      console.log('1. Phone Number ID de Meta WhatsApp Business');
      console.log('2. Access Token de Meta WhatsApp Business');
      console.log('');
      console.log('💡 SOLUCIÓN TEMPORAL:');
      console.log('Ve al dashboard → WhatsApp → Configurar API');
      console.log('O usa la pestaña "Probador" para simular mensajes');
    } else {
      console.log('✅ Configuración completa, probando envío...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealWhatsAppSending();
