const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockUsers = [
  {
    id: 1,
    email: 'owner@cafe-del-centro.com',
    password: 'password123',
    tenantName: 'Café del Centro',
    firstName: 'Juan',
    lastName: 'Pérez'
  }
];

const mockOrders = [
  {
    id: 1,
    customerName: 'María González',
    customerPhone: '+549111234567',
    items: [
      { name: 'Café Americano', quantity: 2, price: 500 },
      { name: 'Medialuna', quantity: 1, price: 300 }
    ],
    totalPrice: 1300,
    status: 'PENDIENTE',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    customerName: 'Carlos López',
    customerPhone: '+549111234568',
    items: [
      { name: 'Café Cortado', quantity: 1, price: 400 },
      { name: 'Tostado', quantity: 1, price: 800 }
    ],
    totalPrice: 1200,
    status: 'PAGADO',
    createdAt: '2024-01-15T11:15:00Z'
  }
];

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Login attempt:', { email, password: '***' });
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Credenciales inválidas',
      message: 'Email o contraseña incorrectos'
    });
  }
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantName: user.tenantName
    },
    access_token: token
  });
});

app.post('/api/auth/register', (req, res) => {
  const { tenantName, ownerEmail, ownerPassword, ownerFirstName, ownerLastName } = req.body;
  
  console.log('📝 Register attempt:', { 
    tenantName, 
    ownerEmail, 
    ownerPassword: '***',
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
  const existingUser = mockUsers.find(u => u.email === ownerEmail);
  if (existingUser) {
    return res.status(409).json({
      error: 'Usuario ya existe',
      message: 'Ya existe un usuario con este email'
    });
  }
  
  // Create new user
  const newUser = {
    id: mockUsers.length + 1,
    email: ownerEmail,
    password: ownerPassword,
    tenantName: tenantName,
    firstName: ownerFirstName || 'Usuario',
    lastName: ownerLastName || 'Nuevo'
  };
  
  mockUsers.push(newUser);
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      tenantName: newUser.tenantName
    },
    access_token: token
  });
});

// Tenant endpoints
app.get('/api/tenants/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('🏢 Getting tenant info:', { token: token?.substring(0, 20) + '...' });
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  // Mock tenant data
  res.json({
    id: 1,
    name: 'Café del Centro',
    whatsappConnected: false,
    createdAt: '2024-01-01T00:00:00Z'
  });
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('📦 Getting orders:', { token: token?.substring(0, 20) + '...' });
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  res.json(mockOrders);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('🔄 Updating order:', id, { status });
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  const order = mockOrders.find(o => o.id === parseInt(id));
  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  
  order.status = status;
  
  res.json(order);
});

// Subscription plans endpoint
app.get('/api/subscription-plans', (req, res) => {
  console.log('📋 Getting subscription plans');
  
  res.json([
    {
      id: 1,
      name: 'Starter',
      price: 29,
      currency: 'USD',
      features: ['Hasta 100 pedidos/mes', 'Soporte por email', 'Dashboard básico'],
      popular: false
    },
    {
      id: 2,
      name: 'Professional',
      price: 59,
      currency: 'USD',
      features: ['Hasta 500 pedidos/mes', 'Soporte prioritario', 'Dashboard avanzado', 'Analytics'],
      popular: true
    },
    {
      id: 3,
      name: 'Enterprise',
      price: 99,
      currency: 'USD',
      features: ['Pedidos ilimitados', 'Soporte 24/7', 'Dashboard completo', 'Analytics avanzados', 'API personalizada'],
      popular: false
    }
  ]);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ABA AI Mock Server running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎭 ABA AI Mock Server running on port', PORT);
  console.log('📱 Auth endpoints:');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/register');
  console.log('📊 Data endpoints:');
  console.log('   GET /api/tenants/me');
  console.log('   GET /api/orders');
  console.log('   PUT /api/orders/:id/status');
  console.log('📋 Plans endpoint:');
  console.log('   GET /api/subscription-plans');
  console.log('');
  console.log('🔐 Test credentials:');
  console.log('   Email: owner@cafe-del-centro.com');
  console.log('   Password: password123');
  console.log('');
  console.log('✨ Ready to test! Try registering or logging in.');
});
