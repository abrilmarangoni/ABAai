// Test WhatsApp connection with real phone
const fetch = require('node-fetch');

async function testRealWhatsApp() {
  try {
    console.log('📱 Probando conexión con WhatsApp real...');
    
    // Test message
    const testMessage = 'Hola, este es un mensaje de prueba desde ABA AI';
    console.log(`📤 Enviando: "${testMessage}"`);
    
    const response = await fetch('http://localhost:4000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '+5492235500594', // Tu número real
        body: testMessage,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`🤖 Respuesta: ${result.aiResponse}`);
      console.log('✅ ¡Mensaje procesado correctamente!');
      console.log('📱 Revisa tu WhatsApp para ver la respuesta automática');
    } else {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error de prueba:', error.message);
  }
}

testRealWhatsApp();
