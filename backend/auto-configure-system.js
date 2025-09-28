// Configure WhatsApp API credentials in the system
const fetch = require('node-fetch');

async function configureSystemCredentials() {
  try {
    console.log('🔧 Configurando credenciales en el sistema ABA...');
    
    const credentials = {
      phoneNumberId: '730688603472018',
      accessToken: 'EAASU456RZCtkBPhob7CZBhO07iUgvYXWoAp8fb9emzt89xKQGXZCAQLY7GwZBwx5ktv34NuVWbiyXHnXHpbXxLqw67MiSDiihRQGxZBk3TEmC7ZCkBjq7gPLrrH6FLn4CotyzqWdiZC2iAcZAm3odDmnTdu4KwkuAEXInqPB9VLDR2PBi1STS6p1F39bxvbLBrEBlEgZBwFKfy8ZCMxWGUdqEcUbAKte6FwSuD8DXcjS2M1gZDZD',
      appId: '1113870200956427'
    };
    
    console.log('📋 Credenciales a configurar:');
    console.log(`- Phone Number ID: ${credentials.phoneNumberId}`);
    console.log(`- Access Token: ${credentials.accessToken.substring(0, 20)}...`);
    console.log(`- App ID: ${credentials.appId}`);
    
    // Test login to get a valid token
    console.log('\n🔐 Obteniendo token de autenticación...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.access_token;
      console.log('✅ Token obtenido exitosamente');
      
      // Configure WhatsApp API
      console.log('\n📱 Configurando API de WhatsApp...');
      const configResponse = await fetch('http://localhost:4000/api/whatsapp/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumberId: credentials.phoneNumberId,
          accessToken: credentials.accessToken,
          appId: credentials.appId,
          appSecret: 'placeholder'
        })
      });
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('✅ API de WhatsApp configurada exitosamente!');
        console.log('📋 Respuesta:', configData);
        
        console.log('\n🎉 ¡Sistema completamente configurado!');
        console.log('📱 Ahora cuando alguien escriba a tu WhatsApp:');
        console.log('1. ✅ Recibirá el mensaje automáticamente');
        console.log('2. ✅ El sistema responderá con IA');
        console.log('3. ✅ Los mensajes se guardarán en el dashboard');
        console.log('4. ⚠️  Para envío real, agrega números a la lista de permitidos');
        
      } else {
        const error = await configResponse.text();
        console.log('❌ Error configurando API:');
        console.log(error);
      }
      
    } else {
      console.log('❌ Error obteniendo token de autenticación');
      console.log('💡 Asegúrate de que el backend esté corriendo y tengas datos de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

configureSystemCredentials();
