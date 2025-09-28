const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Sample menu for AI processing
const MENU = {
  "café": { price: 1500, variants: ["americano", "latte", "cappuccino", "mocha"] },
  "café frío": { price: 2000, variants: ["caramelo", "vainilla", "chocolate"] },
  "sandwich": { price: 3000, variants: ["jamón", "pollo", "vegetariano"] },
  "empanada": { price: 1200, variants: ["carne", "pollo", "queso"] },
  "jugo": { price: 1800, variants: ["naranja", "manzana", "piña"] }
};

// AI function to process order messages
async function processOrderMessage(message) {
  try {
    const prompt = `
    Eres un asistente de un café que procesa pedidos por WhatsApp. 
    Analiza el siguiente mensaje del cliente y extrae la información del pedido.
    
    Menú disponible:
    ${JSON.stringify(MENU, null, 2)}
    
    Mensaje del cliente: "${message}"
    
    Responde SOLO con un JSON válido que contenga:
    {
      "isOrder": true/false,
      "items": [{"name": "producto", "quantity": número, "variant": "variante", "price": precio}],
      "total": precio_total,
      "customerName": "nombre si se menciona",
      "confirmation": "mensaje de confirmación para el cliente"
    }
    
    Si no es un pedido, responde con isOrder: false.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('Error processing order with AI:', error);
    return {
      isOrder: false,
      items: [],
      total: 0,
      customerName: "",
      confirmation: "Lo siento, no pude procesar tu pedido. Por favor intenta de nuevo."
    };
  }
}

// Save order to database
async function saveOrder(orderData, customerPhone) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: orderData.customerName || 'Cliente',
          customer_phone: customerPhone,
          items: orderData.items,
          total_price: orderData.total,
          status: 'Pendiente',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error saving order:', error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Error saving order:', error);
    return null;
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    const messageResponse = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: to
    });
    
    console.log('WhatsApp message sent:', messageResponse.sid);
    return messageResponse;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

// Webhook endpoint for WhatsApp
app.post('/webhook', async (req, res) => {
  try {
    const { Body, From, ProfileName } = req.body;
    
    console.log('Received WhatsApp message:', { Body, From, ProfileName });
    
    // Process the message with AI
    const orderData = await processOrderMessage(Body);
    
    let responseMessage = '';
    
    if (orderData.isOrder) {
      // Save order to database
      const savedOrder = await saveOrder(orderData, From);
      
      if (savedOrder) {
        responseMessage = `${orderData.confirmation}\n\nPedido #${savedOrder.id} registrado exitosamente.`;
      } else {
        responseMessage = "Hubo un error al procesar tu pedido. Por favor intenta de nuevo.";
      }
    } else {
      // Handle non-order messages
      responseMessage = `Hola ${ProfileName || 'cliente'}! 👋\n\nSoy el asistente de pedidos del café. Puedes hacer tu pedido escribiendo algo como:\n\n• "Quiero 2 cafés de vainilla"\n• "Un sandwich de pollo"\n• "3 empanadas de carne"\n\n¿En qué puedo ayudarte?`;
    }
    
    // Send response back to WhatsApp
    await sendWhatsAppMessage(From, responseMessage);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// API endpoint to get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// API endpoint to update order status
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook`);
  console.log(`📊 Orders API: http://localhost:${PORT}/api/orders`);
});

module.exports = app;
