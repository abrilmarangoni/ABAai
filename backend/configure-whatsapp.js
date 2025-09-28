// Configure WhatsApp API with real credentials
const fetch = require('node-fetch');

async function configureWhatsAppAPI() {
  try {
    console.log('🔧 Configurando API de WhatsApp con credenciales reales...');
    
    const credentials = {
      phoneNumberId: '730688603472018',
      accessToken: 'EAASU456RZCtkBPhob7CZBhO07iUgvYXWoAp8fb9emzt89xKQGXZCAQLY7GwZBwx5ktv34NuVWbiyXHnXHpbXxLqw67MiSDiihRQGxZBk3TEmC7ZCkBjq7gPLrrH6FLn4CotyzqWdiZC2iAcZAm3odDmnTdu4KwkuAEXInqPB9VLDR2PBi1STS6p1F39bxvbLBrEBlEgZBwFKfy8ZCMxWGUdqEcUbAKte6FwSuD8DXcjS2M1gZDZD',
      appId: '1113870200956427',
      appSecret: 'placeholder' // Not needed for sending messages
    };
    
    console.log('📋 Credenciales:');
    console.log(`- Phone Number ID: ${credentials.phoneNumberId}`);
    console.log(`- WhatsApp Business Account ID: ${credentials.appId}`);
    console.log(`- Access Token: ${credentials.accessToken.substring(0, 20)}...`);
    
    // Test the credentials by getting phone number info
    console.log('\n🧪 Probando credenciales...');
    const testResponse = await fetch(`https://graph.facebook.com/v17.0/${credentials.phoneNumberId}?access_token=${credentials.accessToken}`);
    
    if (testResponse.ok) {
      const phoneInfo = await testResponse.json();
      console.log('✅ Credenciales válidas!');
      console.log(`📞 Número: ${phoneInfo.display_phone_number}`);
      console.log(`📊 Estado: ${phoneInfo.status}`);
      console.log(`🏢 Business Account: ${phoneInfo.business_account_id}`);
      
      // Now configure in our system
      console.log('\n🔧 Configurando en el sistema ABA...');
      
      // First, we need to get a valid token for our API
      // For now, let's create a simple test
      console.log('📝 Para configurar en el dashboard:');
      console.log('1. Ve al Dashboard → WhatsApp');
      console.log('2. En "Configurar API" ingresa:');
      console.log(`   - Phone Number ID: ${credentials.phoneNumberId}`);
      console.log(`   - Access Token: ${credentials.accessToken}`);
      console.log('3. Haz clic en "Configurar API"');
      console.log('4. ¡Listo! Ahora enviará mensajes reales');
      
    } else {
      const error = await testResponse.text();
      console.log('❌ Error con las credenciales:');
      console.log(error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

configureWhatsAppAPI();
