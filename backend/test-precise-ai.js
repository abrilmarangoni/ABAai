// Test de IA Súper Precisa
const fetch = require('node-fetch');

async function testPreciseAI() {
  try {
    console.log('🧠 Probando IA Súper Precisa...');
    
    const apiKey = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
    
    // Simular productos de diferentes negocios
    const testCases = [
      {
        businessName: "Pizzería Don Mario",
        businessType: "Restaurante/Comida",
        products: [
          { name: "Pizza Margherita", price: 15.99, description: "Pizza con tomate y mozzarella" },
          { name: "Pizza Pepperoni", price: 18.50, description: "Pizza con pepperoni y queso" },
          { name: "Coca Cola 500ml", price: 3.50, description: "Bebida gaseosa" }
        ],
        testMessages: [
          "Quiero una pizza",
          "2 pizzas margherita y 1 coca cola",
          "Quiero pedir 3 pizzas pepperoni"
        ]
      },
      {
        businessName: "Tienda Fashion",
        businessType: "Tienda de Ropa",
        products: [
          { name: "Camiseta Básica", price: 25.00, description: "Camiseta de algodón" },
          { name: "Camiseta Premium", price: 35.00, description: "Camiseta de algodón premium" },
          { name: "Jeans Azules", price: 45.99, description: "Pantalón de mezclilla" }
        ],
        testMessages: [
          "Quiero 2 camisetas",
          "Necesito una camiseta básica y unos jeans",
          "¿Cuánto cuesta la camiseta premium?"
        ]
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🏪 Probando: ${testCase.businessName} (${testCase.businessType})`);
      console.log('📦 Productos:', testCase.products.map(p => `${p.name} ($${p.price})`).join(', '));
      
      for (const message of testCase.testMessages) {
        console.log(`\n👤 Cliente: "${message}"`);
        
        const systemPrompt = `Eres ABA, un asistente conversacional experto y súper preciso para ${testCase.businessName} (${testCase.businessType}).

INSTRUCCIONES CRÍTICAS:
1. DEBES ser extremadamente preciso al identificar productos
2. SOLO reconocer productos que estén en la lista exacta
3. Si hay ambigüedad, pregunta por clarificación
4. Calcula precios exactos basado en cantidades
5. Usa nombres EXACTOS de productos de la lista

PRODUCTOS DISPONIBLES (NOMBRES EXACTOS):
${testCase.products.map(p => `- ${p.name} ($${p.price}) ${p.description ? `- ${p.description}` : ''}`).join('\n')}

REGLAS DE RECONOCIMIENTO:
- Si el cliente dice "pizza" pero solo hay "Pizza Margherita", NO asumas el tipo
- Si dice "camiseta" pero hay "Camiseta Básica" y "Camiseta Premium", pregunta cuál
- Si menciona cantidades implícitas ("un par de zapatos"), pregunta por cantidad exacta
- Si hay productos similares, pregunta por especificación

FORMATO DE RESPUESTA JSON EXACTO:
{
  "intent": "order|inquiry|complaint|greeting|unknown",
  "entities": {
    "products": [{"name": "NOMBRE_EXACTO_DEL_PRODUCTO", "quantity": numero_exacto}],
    "total": precio_total_calculado,
    "uncertainty": ["lista_de_productos_ambiguos_si_los_hay"]
  },
  "confidence": 0.0-1.0,
  "response": "Respuesta específica y precisa al cliente"
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Mensaje del cliente: "${message}"` }
            ],
            temperature: 0.3,
            max_tokens: 800
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = JSON.parse(data.choices[0].message.content);
          
          console.log(`🤖 ABA: ${aiResponse.response}`);
          console.log(`📊 Intención: ${aiResponse.intent} (Confianza: ${aiResponse.confidence})`);
          
          if (aiResponse.entities.products) {
            console.log(`🛒 Productos detectados:`, aiResponse.entities.products);
          }
          
          if (aiResponse.entities.uncertainty) {
            console.log(`❓ Ambiguidades:`, aiResponse.entities.uncertainty);
          }
          
          if (aiResponse.entities.total) {
            console.log(`💰 Total calculado: $${aiResponse.entities.total}`);
          }
        } else {
          console.error('❌ Error en la API:', await response.text());
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPreciseAI();
