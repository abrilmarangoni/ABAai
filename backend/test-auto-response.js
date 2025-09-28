// Test automatic response to your WhatsApp number
const fetch = require('node-fetch');

async function testAutomaticResponse() {
  try {
    console.log('📱 Probando respuesta automática a tu WhatsApp...');
    
    // Simulate someone writing to your WhatsApp
    const customerMessage = 'Hola, quiero hacer un pedido';
    const yourWhatsAppNumber = '+5492235500594'; // Tu número conectado
    
    console.log(`📤 Simulando mensaje de cliente: "${customerMessage}"`);
    console.log(`📱 A tu número: ${yourWhatsAppNumber}`);
    
    const response = await fetch('http://localhost:4000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '+549111234567', // Número del cliente que te escribe
        body: customerMessage,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`🤖 Respuesta automática: ${result.aiResponse}`);
      console.log('✅ ¡Sistema funcionando!');
      console.log('');
      console.log('📋 Flujo completo:');
      console.log('1. Cliente escribe a tu WhatsApp');
      console.log('2. Sistema recibe el mensaje');
      console.log('3. Sistema responde automáticamente');
      console.log('4. Cliente recibe: "Prueba de IA en proceso"');
    } else {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error de prueba:', error.message);
  }
}

testAutomaticResponse();
