// Test simple WhatsApp system
const fetch = require('node-fetch');

async function testSimpleWhatsApp() {
  try {
    console.log('📱 Probando sistema simple de WhatsApp...');
    
    const testMessage = 'Hola, ¿cómo están?';
    console.log(`📤 Enviando: "${testMessage}"`);
    
    const response = await fetch('http://localhost:4000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '+549111234567',
        body: testMessage,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`🤖 Respuesta: ${result.aiResponse}`);
      console.log('✅ Sistema funcionando correctamente!');
    } else {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error de prueba:', error.message);
  }
}

testSimpleWhatsApp();
