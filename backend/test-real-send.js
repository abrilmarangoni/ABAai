// Test real WhatsApp message sending
const fetch = require('node-fetch');

async function testRealWhatsAppSending() {
  try {
    console.log('📱 Probando envío real de mensaje a WhatsApp...');
    
    const credentials = {
      phoneNumberId: '730688603472018',
      accessToken: 'EAASU456RZCtkBPhob7CZBhO07iUgvYXWoAp8fb9emzt89xKQGXZCAQLY7GwZBwx5ktv34NuVWbiyXHnXHpbXxLqw67MiSDiihRQGxZBk3TEmC7ZCkBjq7gPLrrH6FLn4CotyzqWdiZC2iAcZAm3odDmnTdu4KwkuAEXInqPB9VLDR2PBi1STS6p1F39bxvbLBrEBlEgZBwFKfy8ZCMxWGUdqEcUbAKte6FwSuD8DXcjS2M1gZDZD'
    };
    
    // Test message
    const testMessage = 'Prueba de IA en proceso. Pronto responderemos automáticamente.';
    const testPhoneNumber = '+5492235500594'; // Tu número para recibir el mensaje
    
    console.log(`📤 Enviando mensaje: "${testMessage}"`);
    console.log(`📱 A: ${testPhoneNumber}`);
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${credentials.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: testPhoneNumber,
        type: 'text',
        text: { body: testMessage }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Mensaje enviado exitosamente!');
      console.log('📋 Respuesta:', JSON.stringify(result, null, 2));
      console.log(`📨 Message ID: ${result.messages[0].id}`);
      console.log('\n🎉 ¡El sistema está funcionando!');
      console.log('📱 Revisa tu WhatsApp para ver el mensaje');
    } else {
      const error = await response.text();
      console.log('❌ Error enviando mensaje:');
      console.log(error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealWhatsAppSending();
