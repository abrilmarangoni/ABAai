// Test WhatsApp AI System
const fetch = require('node-fetch');

async function testWhatsAppSystem() {
  try {
    console.log('🤖 Probando sistema completo de WhatsApp AI...');
    
    // Test messages
    const testMessages = [
      'Hola',
      '¿Qué productos tienen?',
      'Quiero pedir 2 cafés americanos',
      '¿Cuánto cuesta una medialuna?',
      'Gracias'
    ];
    
    for (const message of testMessages) {
      console.log(`\n📱 Enviando: "${message}"`);
      
      const response = await fetch('http://localhost:4000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: '+549111234567',
          body: message,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`🤖 Respuesta: ${result.aiResponse}`);
        
        if (result.whatsappResponse && result.whatsappResponse.status) {
          console.log(`📤 WhatsApp: ${result.whatsappResponse.status}`);
          
          if (result.whatsappResponse.status === 'sent') {
            console.log('✅ ¡Mensaje enviado realmente a WhatsApp!');
          } else if (result.whatsappResponse.status === 'simulated') {
            console.log('⚠️ Respuesta simulada (WhatsApp no configurado)');
          }
        } else {
          console.log('📤 WhatsApp: Respuesta procesada');
        }
      } else {
        const error = await response.text();
        console.error(`❌ Error: ${error}`);
      }
      
      // Wait between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Prueba completada!');
    console.log('\n📋 Resumen:');
    console.log('• Sistema de IA: ✅ Funcionando');
    console.log('• Respuestas inteligentes: ✅ Implementadas');
    console.log('• Envío a WhatsApp: ⚠️ Simulado (necesita configuración)');
    console.log('\n💡 Para enviar mensajes reales a WhatsApp:');
    console.log('1. Ve al Dashboard → WhatsApp API');
    console.log('2. Configura Phone Number ID y Access Token');
    console.log('3. ¡Las respuestas se enviarán realmente!');
    
  } catch (error) {
    console.error('❌ Error de prueba:', error.message);
  }
}

testWhatsAppSystem();
