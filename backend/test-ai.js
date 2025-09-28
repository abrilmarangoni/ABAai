// Script para probar la IA de WhatsApp
const fetch = require('node-fetch');

async function testWhatsAppAI() {
  try {
    console.log('🤖 Probando IA de WhatsApp...');
    
    // Simular mensaje de WhatsApp
    const testMessage = {
      from: '+549111234567',
      body: 'Hola, quiero hacer un pedido de 2 cafés americanos',
      timestamp: new Date().toISOString()
    };
    
    console.log('📱 Enviando mensaje de prueba:', testMessage.body);
    
    // Enviar al webhook
    const response = await fetch('http://localhost:4000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ IA procesó el mensaje exitosamente');
      console.log('🤖 Respuesta de la IA:', result.aiResponse);
    } else {
      const error = await response.text();
      console.error('❌ Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error de prueba:', error.message);
  }
}

// Ejecutar prueba
testWhatsAppAI();
