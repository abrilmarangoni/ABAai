const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate business users
const authenticateBusiness = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get business by WhatsApp number
async function getBusinessByWhatsAppNumber(whatsappNumber) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching business:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}

// AI function to process order messages with business-specific menu
async function processOrderMessage(message, menuConfig) {
  try {
    const prompt = `
    Eres un asistente de un negocio que procesa pedidos por WhatsApp. 
    Analiza el siguiente mensaje del cliente y extrae la información del pedido.
    
    Menú disponible:
    ${JSON.stringify(menuConfig, null, 2)}
    
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
async function saveOrder(orderData, customerPhone, businessId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          business_id: businessId,
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

// Send WhatsApp message using business-specific Twilio credentials
async function sendWhatsAppMessage(to, message, business) {
  try {
    const twilioClient = twilio(business.twilio_account_sid, business.twilio_auth_token);
    
    const messageResponse = await twilioClient.messages.create({
      body: message,
      from: business.twilio_whatsapp_number,
      to: to
    });
    
    console.log('WhatsApp message sent:', messageResponse.sid);
    return messageResponse;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

// Business registration endpoint
app.post('/api/businesses/register', async (req, res) => {
  try {
    const { name, slug, whatsapp_number, email, password, menu_config } = req.body;

    // Check if business already exists
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingBusiness) {
      return res.status(400).json({ error: 'Business slug already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([
        {
          name,
          slug,
          whatsapp_number,
          menu_config: menu_config || {},
          is_active: true
        }
      ])
      .select()
      .single();

    if (businessError) {
      console.error('Error creating business:', businessError);
      return res.status(500).json({ error: 'Failed to create business' });
    }

    // Create business user
    const { data: user, error: userError } = await supabase
      .from('business_users')
      .insert([
        {
          business_id: business.id,
          email,
          password_hash: passwordHash,
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.json({ business, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error registering business:', error);
    res.status(500).json({ error: 'Failed to register business' });
  }
});

// Business login endpoint
app.post('/api/businesses/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with business info
    const { data: user, error } = await supabase
      .from('business_users')
      .select(`
        *,
        businesses (*)
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        businessId: user.business_id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        business: user.businesses 
      } 
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Multi-tenant webhook endpoint
app.post('/webhook/:businessSlug', async (req, res) => {
  try {
    const { businessSlug } = req.params;
    const { Body, From, ProfileName } = req.body;
    
    console.log('Received WhatsApp message:', { businessSlug, Body, From, ProfileName });
    
    // Get business by slug
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', businessSlug)
      .eq('is_active', true)
      .single();

    if (error || !business) {
      console.error('Business not found:', businessSlug);
      return res.status(404).send('Business not found');
    }

    // Initialize OpenAI with business-specific API key
    const openai = new OpenAI({
      apiKey: business.openai_api_key || process.env.OPENAI_API_KEY,
    });

    // Process the message with AI using business menu
    const orderData = await processOrderMessage(Body, business.menu_config);
    
    let responseMessage = '';
    
    if (orderData.isOrder) {
      // Save order to database
      const savedOrder = await saveOrder(orderData, From, business.id);
      
      if (savedOrder) {
        responseMessage = `${orderData.confirmation}\n\nPedido #${savedOrder.id.slice(-8)} registrado exitosamente.`;
      } else {
        responseMessage = "Hubo un error al procesar tu pedido. Por favor intenta de nuevo.";
      }
    } else {
      // Handle non-order messages
      responseMessage = `Hola ${ProfileName || 'cliente'}! 👋\n\nSoy el asistente de pedidos de ${business.name}. Puedes hacer tu pedido escribiendo algo como:\n\n• "Quiero 2 cafés de vainilla"\n• "Un sandwich de pollo"\n• "3 empanadas de carne"\n\n¿En qué puedo ayudarte?`;
    }
    
    // Send response back to WhatsApp using business credentials
    await sendWhatsAppMessage(From, responseMessage, business);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Get orders for specific business
app.get('/api/orders', authenticateBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', req.user.businessId)
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

// Update order status
app.put('/api/orders/:id', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .eq('business_id', req.user.businessId)
      .select();

    if (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get business info
app.get('/api/business', authenticateBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', req.user.businessId)
      .single();

    if (error) {
      console.error('Error fetching business:', error);
      return res.status(500).json({ error: 'Failed to fetch business' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multi-tenant server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook/:businessSlug`);
  console.log(`📊 Orders API: http://localhost:${PORT}/api/orders`);
});

module.exports = app;
