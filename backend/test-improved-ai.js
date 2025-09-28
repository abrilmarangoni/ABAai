// Test improved AI system
const fetch = require('node-fetch');

async function testImprovedAI() {
  try {
    console.log('🤖 Probando sistema de IA mejorado...');
    
    const testMessages = [
      'Hola',
      '¿Cuánto cuesta un café americano?',
      'Quiero pedir 2 cafés americanos',
      '¿Qué productos tienen?',
      'Gracias'
    ];
    
    for (const message of testMessages) {
      console.log(`\n📱 Mensaje: "${message}"`);
      
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
      } else {
        const error = await response.text();
        console.error(`❌ Error: ${error}`);
      }
      
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Prueba completada!');
    
  } catch (error) {
    console.error('❌ Error de prueba:', error.message);
  }
}

testImprovedAI();
