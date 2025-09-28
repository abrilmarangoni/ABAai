// Test OpenAI API Key
const fetch = require('node-fetch');

async function testOpenAI() {
  try {
    console.log('🤖 Probando OpenAI API...');
    
    const apiKey = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres ABA, un asistente de WhatsApp para un negocio. Responde en español de forma amigable.'
          },
          {
            role: 'user',
            content: 'Hola, quiero pedir 2 cafés americanos'
          }
        ],
        max_tokens: 100
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API funcionando correctamente!');
      console.log('🤖 Respuesta:', data.choices[0].message.content);
    } else {
      const error = await response.text();
      console.error('❌ Error OpenAI:', error);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testOpenAI();
