const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 4000;
const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// OpenAI Configuration (you'll need to add your API key)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

// WhatsApp API Integration
async function sendWhatsAppMessage(phoneNumberId, accessToken, to, message) {
  try {
    console.log('📤 Sending WhatsApp message:', { to, message });
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ WhatsApp message sent successfully:', result);
      return { success: true, messageId: result.messages[0].id };
    } else {
      const error = await response.text();
      console.error('❌ WhatsApp API error:', error);
      
      // Check if it's a recipient not allowed error
      if (error.includes('Recipient phone number not in allowed list')) {
        console.log('💡 Solución: Agrega el número a la lista de permitidos en Meta for Developers');
        console.log('📋 Ve a tu app → WhatsApp → Configuration → Webhook → Recipients');
        console.log(`📱 Agrega el número: ${to}`);
      }
      
      return { success: false, error: error };
    }
  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

// Simple response generator (temporary until OpenAI is configured)
function generateIntelligentResponse(messageText, products, businessName) {
  // For now, just return a simple message
  return 'Prueba de IA en proceso. Pronto responderemos automáticamente.';
}

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// AI Processing Functions
const processMessageWithAI = async (tenantId, messageText, customerPhone) => {
  try {
    console.log('🤖 Processing message with AI:', { tenantId, messageText, customerPhone });
    
    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    // Get tenant's products
    const products = await prisma.product.findMany({
      where: { tenantId: tenantId }
    });
    
    // Create AI prompt
    const aiPrompt = `Eres ABA, el asistente de IA de ${tenant.name}. 
    
INSTRUCCIONES:
- Responde en español, de forma amigable y profesional
- Eres un asistente para tomar pedidos por WhatsApp
- Si el cliente quiere hacer un pedido, extrae los productos y cantidades
- Si es una consulta, responde de forma útil
- Si es un saludo, saluda cordialmente

MENÚ DISPONIBLE:
${products.map(p => `- ${p.name}: $${p.price}`).join('\n')}

MENSAJE DEL CLIENTE: "${messageText}"

Responde de forma natural y útil. Si es un pedido, confirma los productos y cantidades.`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: aiPrompt
          },
          {
            role: 'user',
            content: messageText
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    let aiResponse;
    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      // Fallback to intelligent responses without OpenAI
      aiResponse = generateIntelligentResponse(messageText, products, tenant.name);
    } else {
      const aiData = await openaiResponse.json();
      aiResponse = aiData.choices[0].message.content;
    }

    // Determine intent
    let intent = 'unknown';
    let confidence = 0.8;
    
    if (messageText.toLowerCase().includes('pedido') || 
        messageText.toLowerCase().includes('quiero') ||
        messageText.toLowerCase().includes('necesito')) {
      intent = 'order';
      confidence = 0.9;
    } else if (messageText.toLowerCase().includes('hola') ||
               messageText.toLowerCase().includes('buenos')) {
      intent = 'greeting';
      confidence = 0.9;
    } else if (messageText.toLowerCase().includes('precio') ||
               messageText.toLowerCase().includes('cuesta')) {
      intent = 'inquiry';
      confidence = 0.8;
    }

    return {
      response: aiResponse,
      intent: intent,
      confidence: confidence
    };
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      response: 'Gracias por tu mensaje. Te responderé pronto.',
      intent: 'unknown',
      confidence: 0.5
    };
  }
};

// WhatsApp Webhook Handler
app.post('/api/webhooks/whatsapp', async (req, res) => {
  try {
    console.log('📱 WhatsApp webhook received:', req.body);
    
    const { from, body, timestamp } = req.body;
    
    if (!from || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find tenant by phone number in whatsappConfig
    const tenants = await prisma.tenant.findMany();
    let tenant = null;
    
    for (const t of tenants) {
      const config = JSON.parse(t.whatsappConfig || '{}');
      if (config.phoneNumber === from || config.connected) {
        tenant = t;
        break;
      }
    }
    
    // If no tenant found by phone, use the first connected tenant for testing
    if (!tenant) {
      tenant = tenants.find(t => {
        const config = JSON.parse(t.whatsappConfig || '{}');
        return config.connected;
      });
    }
    
    if (!tenant) {
      console.log('Tenant not found for phone:', from);
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Save incoming message
    const message = await prisma.message.create({
      data: {
        tenantId: tenant.id,
        from: 'customer',
        direction: 'inbound',
        text: body,
        createdAt: new Date(timestamp || Date.now())
      }
    });
    
    // Process with AI
    const aiResult = await processMessageWithAI(tenant.id, body, from);
    
    // Save AI response
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        orderId: null,
        from: 'aba',
        direction: 'outbound',
        text: aiResult.response,
        nlpMeta: JSON.stringify({
          intent: aiResult.intent,
          confidence: aiResult.confidence
        }),
        createdAt: new Date()
      }
    });
    
    // Send AI response back to WhatsApp
    console.log(`🤖 AI Response for ${from}: ${aiResult.response}`);
    
    // Check if WhatsApp API is configured
    const whatsappConfig = JSON.parse(tenant.whatsappConfig || '{}');
    if (whatsappConfig.phoneNumberId && whatsappConfig.accessToken) {
      console.log('📤 Enviando mensaje real a WhatsApp...');
      const sendResult = await sendWhatsAppMessage(whatsappConfig.phoneNumberId, whatsappConfig.accessToken, from, aiResult.response);
      if (sendResult.success) {
        console.log('✅ Mensaje enviado exitosamente a WhatsApp');
      } else {
        console.log('❌ Error enviando a WhatsApp:', sendResult.error);
      }
    } else {
      console.log('⚠️  WhatsApp API no configurada - mensaje solo guardado en BD');
      console.log('💡 Para enviar mensajes reales, configura Phone Number ID y Access Token en el dashboard');
    }
    
    // If it's an order, create order
    if (aiResult.intent === 'order' && aiResult.confidence > 0.7) {
      // Extract products from message (simplified)
      const products = await prisma.product.findMany({
        where: { tenantId: tenant.id }
      });
      
      let orderItems = [];
      let totalPrice = 0;
      
      // Simple product extraction (you can improve this)
      products.forEach(product => {
        const productName = product.name.toLowerCase();
        if (body.toLowerCase().includes(productName)) {
          // Extract quantity (simplified)
          const quantityMatch = body.match(new RegExp(`(\\d+)\\s*${productName}`, 'i'));
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          
          orderItems.push({
            productId: product.id,
            name: product.name,
            quantity: quantity,
            price: product.price
          });
          
          totalPrice += product.price * quantity;
        }
      });
      
      if (orderItems.length > 0) {
        const order = await prisma.order.create({
          data: {
            tenantId: tenant.id,
            customerName: 'Cliente WhatsApp',
            customerPhone: from,
            items: JSON.stringify(orderItems),
            totalPrice: totalPrice,
            status: 'PENDIENTE',
            paymentMethod: 'link',
            createdAt: new Date()
          }
        });
        
        console.log('📦 Order created:', order.id);
      }
    }
    
    // Send response back to WhatsApp
    console.log('🤖 AI Response:', aiResult.response);
    
    // Get WhatsApp config from tenant
    const whatsappConfig = JSON.parse(tenant.whatsappConfig || '{}');
    
    let whatsappResponse = {
      to: from,
      message: aiResult.response,
      timestamp: new Date().toISOString(),
      status: 'simulated'
    };
    
    // Try to send real WhatsApp message if configured
    if (whatsappConfig.phoneNumberId && whatsappConfig.accessToken) {
      console.log('📤 Attempting to send real WhatsApp message...');
      const sendResult = await sendWhatsAppMessage(
        whatsappConfig.phoneNumberId,
        whatsappConfig.accessToken,
        from,
        aiResult.response
      );
      
      if (sendResult.success) {
        whatsappResponse.status = 'sent';
        whatsappResponse.messageId = sendResult.messageId;
        console.log('✅ WhatsApp message sent successfully!');
      } else {
        whatsappResponse.status = 'failed';
        whatsappResponse.error = sendResult.error;
        console.log('❌ WhatsApp message failed:', sendResult.error);
      }
    } else {
      console.log('⚠️ WhatsApp not fully configured, simulating response');
    }
    
    console.log('📤 WhatsApp Response:', whatsappResponse);
    
    res.json({ 
      success: true, 
      message: 'Message processed and sent to WhatsApp',
      aiResponse: aiResult.response,
      whatsappResponse: whatsappResponse
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email });
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenantId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantName: user.tenant.name,
        role: user.role
      },
      access_token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { tenantName, ownerEmail, ownerPassword, ownerFirstName, ownerLastName } = req.body;
    
    console.log('📝 Register attempt:', { 
      tenantName, 
      ownerEmail, 
      ownerFirstName,
      ownerLastName
    });
    
    // Validate required fields
    if (!tenantName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'Nombre del negocio, email y contraseña son obligatorios'
      });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario con este email'
      });
    }
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        domain: tenantName.toLowerCase().replace(/\s+/g, '-'),
        whatsappConfig: JSON.stringify({ connected: false }),
        openaiQuota: 10000,
        isActive: true
      }
    });
    
    // Create user
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: ownerEmail,
        passwordHash: hashedPassword,
        firstName: ownerFirstName || 'Usuario',
        lastName: ownerLastName || 'Nuevo',
        role: 'OWNER',
        isActive: true
      }
    });
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenantId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantName: tenant.name,
        role: user.role
      },
      access_token: token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Tenant endpoints
app.get('/api/tenants/me', authenticateToken, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    const whatsappConfig = JSON.parse(tenant.whatsappConfig || '{}');
    
    res.json({
      id: tenant.id,
      name: tenant.name,
      whatsappConnected: whatsappConfig.connected || false,
      whatsappPhoneNumber: whatsappConfig.phoneNumber || null,
      subscriptionPlan: whatsappConfig.subscriptionPlan || 'starter',
      subscriptionStatus: whatsappConfig.subscriptionStatus || 'trial',
      createdAt: tenant.createdAt
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// WhatsApp Configuration
app.post('/api/whatsapp/connect', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, businessName } = req.body;
    
    console.log('📱 WhatsApp connect attempt:', { phoneNumber, businessName });
    
    // Validate phone number format - more flexible
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Número de teléfono requerido',
        message: 'Por favor ingresa tu número de WhatsApp'
      });
    }
    
    // Clean and validate phone number
    let cleanPhoneNumber = phoneNumber.trim();
    
    // Add + if not present and starts with number
    if (!cleanPhoneNumber.startsWith('+') && /^\d/.test(cleanPhoneNumber)) {
      cleanPhoneNumber = '+' + cleanPhoneNumber;
    }
    
    // Basic validation - should start with + and have at least 10 digits
    if (!cleanPhoneNumber.startsWith('+') || cleanPhoneNumber.length < 10) {
      return res.status(400).json({
        error: 'Formato de número inválido',
        message: 'El número debe incluir el código de país (ej: +549111234567)'
      });
    }
    
    // Update tenant WhatsApp config
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    const currentConfig = JSON.parse(tenant.whatsappConfig || '{}');
    const updatedConfig = {
      ...currentConfig,
      phoneNumber: cleanPhoneNumber,
      businessName: businessName || tenant.name,
      connected: true,
      connectedAt: new Date().toISOString(),
      webhookUrl: `https://api.aba.app/webhook/${tenant.domain}`,
      // Add these fields for real WhatsApp API integration
      phoneNumberId: '', // Will be set via /api/whatsapp/configure
      accessToken: '',   // Will be set via /api/whatsapp/configure
      appId: '',         // Will be set via /api/whatsapp/configure
      appSecret: ''      // Will be set via /api/whatsapp/configure
    };
    
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        whatsappConfig: JSON.stringify(updatedConfig)
      }
    });
    
    res.json({
      success: true,
      message: 'WhatsApp conectado exitosamente',
      webhookUrl: updatedConfig.webhookUrl,
      phoneNumber: cleanPhoneNumber
    });
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo conectar WhatsApp. Intenta nuevamente.'
    });
  }
});

app.post('/api/whatsapp/disconnect', authenticateToken, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    const currentConfig = JSON.parse(tenant.whatsappConfig || '{}');
    const updatedConfig = {
      ...currentConfig,
      connected: false,
      disconnectedAt: new Date().toISOString()
    };
    
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        whatsappConfig: JSON.stringify(updatedConfig)
      }
    });
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado exitosamente'
    });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Test endpoint to simulate WhatsApp messages
app.post('/api/test/whatsapp-message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('🧪 Test WhatsApp message:', { message });
    
    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    // Simulate incoming WhatsApp message
    const testPhone = '+549111234567';
    const testMessage = message || 'Hola, este es un mensaje de prueba';
    
    // Save incoming message
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        from: 'customer',
        direction: 'inbound',
        text: testMessage,
        createdAt: new Date()
      }
    });
    
    // Process with AI
    const aiResult = await processMessageWithAI(tenant.id, testMessage, testPhone);
    
    // Save AI response
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        orderId: null,
        from: 'aba',
        direction: 'outbound',
        text: aiResult.response,
        nlpMeta: JSON.stringify({
          intent: aiResult.intent,
          confidence: aiResult.confidence
        }),
        createdAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Mensaje de prueba procesado',
      incomingMessage: testMessage,
      aiResponse: aiResult.response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get WhatsApp messages for testing
app.get('/api/test/whatsapp-messages', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length
    });
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Configure WhatsApp API tokens
app.post('/api/whatsapp/configure', authenticateToken, async (req, res) => {
  try {
    const { phoneNumberId, accessToken, appId, appSecret } = req.body;
    
    console.log('🔧 WhatsApp configure attempt:', { phoneNumberId, appId });
    
    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({
        error: 'Phone Number ID y Access Token son requeridos',
        message: 'Por favor ingresa los tokens de WhatsApp Business API'
      });
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    const currentConfig = JSON.parse(tenant.whatsappConfig || '{}');
    const updatedConfig = {
      ...currentConfig,
      phoneNumberId: phoneNumberId,
      accessToken: accessToken,
      appId: appId || '',
      appSecret: appSecret || '',
      configured: true,
      configuredAt: new Date().toISOString()
    };
    
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        whatsappConfig: JSON.stringify(updatedConfig)
      }
    });
    
    res.json({
      success: true,
      message: 'WhatsApp API configurado exitosamente',
      phoneNumberId: phoneNumberId
    });
  } catch (error) {
    console.error('WhatsApp configure error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo configurar WhatsApp API. Intenta nuevamente.'
    });
  }
});

// WhatsApp Disconnect endpoint
app.post('/api/whatsapp/disconnect', authenticateToken, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    const updatedConfig = {
      connected: false,
      disconnectedAt: new Date().toISOString()
    };
    
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        whatsappConfig: JSON.stringify(updatedConfig)
      }
    });
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado exitosamente'
    });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo desconectar WhatsApp. Intenta nuevamente.'
    });
  }
});

// Products Management
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, price, sku, available } = req.body;
    
    const product = await prisma.product.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        price: parseFloat(price),
        sku: sku || '',
        available: available !== false
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, sku, available } = req.body;
    
    const product = await prisma.product.update({
      where: { 
        id: parseInt(id),
        tenantId: req.user.tenantId // Ensure user can only update their own products
      },
      data: {
        name,
        price: parseFloat(price),
        sku: sku || '',
        available: available !== false
      }
    });
    
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.product.delete({
      where: { 
        id: parseInt(id),
        tenantId: req.user.tenantId // Ensure user can only delete their own products
      }
    });
    
    res.json({ success: true, message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Subscription Management
app.get('/api/subscription-plans', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Starter',
      slug: 'starter',
      price: 29,
      currency: 'USD',
      interval: 'month',
      features: [
        'Hasta 100 pedidos/mes',
        'Soporte por email',
        'Dashboard básico',
        'WhatsApp Business API',
        'Procesamiento con IA'
      ],
      popular: false,
      trialDays: 14
    },
    {
      id: 2,
      name: 'Professional',
      slug: 'professional',
      price: 59,
      currency: 'USD',
      interval: 'month',
      features: [
        'Hasta 500 pedidos/mes',
        'Soporte prioritario',
        'Dashboard avanzado',
        'Analytics detallados',
        'WhatsApp Business API',
        'Procesamiento con IA',
        'Integración MercadoPago'
      ],
      popular: true,
      trialDays: 14
    },
    {
      id: 3,
      name: 'Enterprise',
      slug: 'enterprise',
      price: 99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Pedidos ilimitados',
        'Soporte 24/7',
        'Dashboard completo',
        'Analytics avanzados',
        'API personalizada',
        'WhatsApp Business API',
        'Procesamiento con IA',
        'Integración MercadoPago',
        'Múltiples usuarios'
      ],
      popular: false,
      trialDays: 14
    }
  ]);
});

app.post('/api/subscription/upgrade', authenticateToken, async (req, res) => {
  try {
    const { planSlug, paymentMethod } = req.body;
    
    console.log('💳 Subscription upgrade:', { planSlug, paymentMethod });
    
    const plans = {
      starter: { name: 'Starter', price: 29, ordersLimit: 100 },
      professional: { name: 'Professional', price: 59, ordersLimit: 500 },
      enterprise: { name: 'Enterprise', price: 99, ordersLimit: -1 }
    };
    
    const selectedPlan = plans[planSlug];
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Plan no válido' });
    }
    
    // Update tenant subscription
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }
    
    const currentConfig = JSON.parse(tenant.whatsappConfig || '{}');
    const updatedConfig = {
      ...currentConfig,
      subscriptionPlan: planSlug,
      subscriptionStatus: 'active',
      subscriptionStartedAt: new Date().toISOString(),
      subscriptionPrice: selectedPlan.price,
      ordersLimit: selectedPlan.ordersLimit
    };
    
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        whatsappConfig: JSON.stringify(updatedConfig)
      }
    });
    
    // Create payment record
    await prisma.payment.create({
      data: {
        tenantId: req.user.tenantId,
        orderId: null, // Subscription payment
        provider: paymentMethod || 'MERCADOPAGO',
        amount: selectedPlan.price,
        status: 'APPROVED',
        receivedAt: new Date(),
        metadata: JSON.stringify({
          type: 'subscription',
          plan: planSlug,
          interval: 'month'
        })
      }
    });
    
    res.json({
      success: true,
      message: `Suscripción ${selectedPlan.name} activada exitosamente`,
      plan: selectedPlan,
      paymentMethod: paymentMethod || 'MERCADOPAGO'
    });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Orders endpoints
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse items JSON for each order
    const ordersWithParsedItems = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    res.json(ordersWithParsedItems);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await prisma.order.findFirst({
      where: { 
        id: id,
        tenantId: req.user.tenantId 
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: id },
      data: { status: status }
    });
    
    res.json({
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items)
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Messages endpoint
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ABA AI Backend running',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    features: ['WhatsApp', 'Subscriptions', 'Orders', 'Payments', 'AI Processing']
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ABA AI Backend running on port', PORT);
  console.log('📱 Auth endpoints:');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/register');
  console.log('📱 WhatsApp endpoints:');
  console.log('   POST /api/whatsapp/connect');
  console.log('   POST /api/whatsapp/disconnect');
  console.log('   POST /api/whatsapp/configure');
  console.log('🤖 AI Processing:');
  console.log('   POST /api/webhooks/whatsapp');
  console.log('🧪 Test endpoints:');
  console.log('   POST /api/test/whatsapp-message');
  console.log('   GET /api/test/whatsapp-messages');
  console.log('💳 Subscription endpoints:');
  console.log('   GET /api/subscription-plans');
  console.log('   POST /api/subscription/upgrade');
  console.log('📊 Data endpoints:');
  console.log('   GET /api/tenants/me');
  console.log('   GET /api/orders');
  console.log('   PUT /api/orders/:id/status');
  console.log('   GET /api/products');
  console.log('   POST /api/products');
  console.log('   GET /api/messages');
  console.log('');
  console.log('🔐 Test credentials:');
  console.log('   Email: owner@cafe-del-centro.com');
  console.log('   Password: password123');
  console.log('');
  console.log('✨ Ready for WhatsApp AI Processing!');
  console.log('🤖 OpenAI API Key:', OPENAI_API_KEY ? 'Configured' : 'NOT CONFIGURED');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});