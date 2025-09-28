const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockBusinesses = [
  {
    id: '1',
    name: 'Café Central',
    slug: 'cafe-central',
    whatsapp_number: '+1234567890',
    menu_config: {
      "café": { "price": 1500, "variants": ["americano", "latte", "cappuccino"] },
      "sandwich": { "price": 3000, "variants": ["jamón", "pollo", "vegetariano"] },
      "empanada": { "price": 1200, "variants": ["carne", "pollo", "queso"] }
    }
  }
];

const mockOrders = [
  {
    id: '1',
    business_id: '1',
    customer_name: 'Juan Pérez',
    customer_phone: '+1234567890',
    items: [
      { name: 'café', quantity: 2, variant: 'americano', price: 1500 },
      { name: 'sandwich', quantity: 1, variant: 'pollo', price: 3000 }
    ],
    total_price: 6000,
    status: 'Pendiente',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    business_id: '1',
    customer_name: 'María García',
    customer_phone: '+1234567891',
    items: [
      { name: 'empanada', quantity: 3, variant: 'carne', price: 1200 }
    ],
    total_price: 3600,
    status: 'Pagado',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    business_id: '1',
    customer_name: 'Carlos López',
    customer_phone: '+1234567892',
    items: [
      { name: 'café', quantity: 1, variant: 'latte', price: 1500 },
      { name: 'sandwich', quantity: 1, variant: 'vegetariano', price: 3000 }
    ],
    total_price: 4500,
    status: 'Entregado',
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

const mockPlans = [
  {
    id: '1',
    name: 'Starter',
    slug: 'starter',
    price_monthly: 29.00,
    price_yearly: 290.00,
    orders_limit: 100,
    features: {
      menu_items: 5,
      whatsapp_support: true,
      email_support: true,
      basic_analytics: true,
      custom_branding: false
    }
  },
  {
    id: '2',
    name: 'Professional',
    slug: 'professional',
    price_monthly: 79.00,
    price_yearly: 790.00,
    orders_limit: 500,
    features: {
      menu_items: -1,
      whatsapp_support: true,
      priority_support: true,
      advanced_analytics: true,
      custom_branding: true,
      api_access: true
    }
  },
  {
    id: '3',
    name: 'Enterprise',
    slug: 'enterprise',
    price_monthly: 199.00,
    price_yearly: 1990.00,
    orders_limit: null,
    features: {
      menu_items: -1,
      whatsapp_support: true,
      dedicated_support: true,
      advanced_analytics: true,
      custom_branding: true,
      api_access: true,
      white_label: true,
      custom_integrations: true
    }
  }
];

// Mock subscription data
const mockSubscription = {
  id: '1',
  business_id: '1',
  plan_id: '1',
  status: 'active',
  orders_used: 45,
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  subscription_plans: mockPlans[0]
};

// Routes

// Get subscription plans
app.get('/api/subscription-plans', (req, res) => {
  console.log('📋 Getting subscription plans');
  res.json(mockPlans);
});

// Business registration
app.post('/api/businesses/register', (req, res) => {
  console.log('📝 Business registration:', req.body);
  
  const { name, slug, whatsapp_number, email, password } = req.body;
  
  // Simulate successful registration
  const newBusiness = {
    id: Date.now().toString(),
    name,
    slug,
    whatsapp_number,
    email,
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_trial: true,
    menu_config: {
      "café": { "price": 1500, "variants": ["americano", "latte", "cappuccino"] },
      "sandwich": { "price": 3000, "variants": ["jamón", "pollo", "vegetariano"] }
    }
  };
  
  const user = {
    id: Date.now().toString(),
    email,
    role: 'admin',
    business: newBusiness
  };
  
  res.json({
    business: newBusiness,
    user,
    trial_ends_at: newBusiness.trial_ends_at
  });
});

// Business login
app.post('/api/businesses/login', (req, res) => {
  console.log('🔐 Business login:', req.body);
  
  const { email, password } = req.body;
  
  // Simulate successful login
  const user = {
    id: '1',
    email,
    role: 'admin',
    business: mockBusinesses[0]
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.json({
    user,
    token
  });
});

// Get business info
app.get('/api/business', (req, res) => {
  console.log('🏢 Getting business info');
  res.json(mockBusinesses[0]);
});

// Get orders
app.get('/api/orders', (req, res) => {
  console.log('📦 Getting orders');
  res.json(mockOrders);
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
  console.log('🔄 Updating order:', req.params.id, req.body);
  
  const { id } = req.params;
  const { status } = req.body;
  
  // Find and update order
  const order = mockOrders.find(o => o.id === id);
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Get subscription info
app.get('/api/subscription', (req, res) => {
  console.log('💳 Getting subscription info');
  res.json(mockSubscription);
});

// Create checkout session (mock)
app.post('/api/create-checkout-session', (req, res) => {
  console.log('💳 Creating checkout session:', req.body);
  
  const { plan_id } = req.body;
  const sessionId = 'cs_mock_' + Date.now();
  
  res.json({ sessionId });
});

// Mock WhatsApp webhook
app.post('/webhook/:businessSlug', (req, res) => {
  console.log('📱 WhatsApp webhook received:', req.params.businessSlug, req.body);
  
  // Simulate processing
  const { Body, From, ProfileName } = req.body;
  
  console.log(`🤖 Mock bot would process: "${Body}" from ${ProfileName} (${From})`);
  
  res.status(200).send('OK - Mock processed');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Mock server running! 🎭'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎭 Mock server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook/:businessSlug`);
  console.log(`📊 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`💳 Pricing API: http://localhost:${PORT}/api/subscription-plans`);
  console.log(`\n🚀 Frontend: http://localhost:3000`);
  console.log(`🎯 Backend: http://localhost:${PORT}`);
  console.log(`\n✨ Ready to test! Try registering a business or logging in.`);
});

module.exports = app;
