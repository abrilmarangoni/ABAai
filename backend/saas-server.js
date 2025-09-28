const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// Check subscription limits
const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const { data: subscription } = await supabase
      .from('business_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('business_id', req.user.businessId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return res.status(403).json({ error: 'No active subscription' });
    }

    // Check if business is in trial
    const { data: business } = await supabase
      .from('businesses')
      .select('is_trial, trial_ends_at')
      .eq('id', req.user.businessId)
      .single();

    if (business.is_trial && new Date(business.trial_ends_at) < new Date()) {
      return res.status(403).json({ error: 'Trial period expired' });
    }

    // Check order limits
    if (subscription.subscription_plans.orders_limit && 
        subscription.orders_used >= subscription.subscription_plans.orders_limit) {
      return res.status(403).json({ error: 'Order limit reached' });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Error checking subscription' });
  }
};

// Get business by WhatsApp number
async function getBusinessByWhatsAppNumber(whatsappNumber) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        business_subscriptions!inner (
          *,
          subscription_plans (*)
        )
      `)
      .eq('whatsapp_number', whatsappNumber)
      .eq('is_active', true)
      .eq('business_subscriptions.status', 'active')
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

// Track usage
async function trackUsage(businessId, subscriptionId, orderCount = 1) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily usage
    const { data: existingUsage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('business_id', businessId)
      .eq('tracking_date', today)
      .single();

    if (existingUsage) {
      await supabase
        .from('usage_tracking')
        .update({ 
          orders_count: existingUsage.orders_count + orderCount 
        })
        .eq('id', existingUsage.id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert([{
          business_id: businessId,
          subscription_id: subscriptionId,
          orders_count: orderCount,
          tracking_date: today
        }]);
    }

    // Update subscription usage
    await supabase
      .from('business_subscriptions')
      .update({ 
        orders_used: supabase.raw('orders_used + ?', [orderCount])
      })
      .eq('id', subscriptionId);

  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

// AI function to process order messages
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

// Send WhatsApp message
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

// Business registration with subscription
app.post('/api/businesses/register', async (req, res) => {
  try {
    const { name, slug, whatsapp_number, email, password, plan_slug } = req.body;

    // Check if business already exists
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingBusiness) {
      return res.status(400).json({ error: 'Business slug already exists' });
    }

    // Get subscription plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug || 'starter')
      .single();

    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        business_slug: slug
      }
    });

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([
        {
          name,
          slug,
          whatsapp_number,
          billing_email: email,
          stripe_customer_id: stripeCustomer.id,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
          is_trial: true,
          menu_config: {
            "café": { "price": 1500, "variants": ["americano", "latte", "cappuccino"] },
            "sandwich": { "price": 3000, "variants": ["jamón", "pollo", "vegetariano"] }
          }
        }
      ])
      .select()
      .single();

    if (businessError) {
      console.error('Error creating business:', businessError);
      return res.status(500).json({ error: 'Failed to create business' });
    }

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('business_subscriptions')
      .insert([
        {
          business_id: business.id,
          plan_id: plan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return res.status(500).json({ error: 'Failed to create subscription' });
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

    res.json({ 
      business, 
      subscription,
      user: { id: user.id, email: user.email, role: user.role },
      trial_ends_at: business.trial_ends_at
    });
  } catch (error) {
    console.error('Error registering business:', error);
    res.status(500).json({ error: 'Failed to register business' });
  }
});

// Get subscription plans
app.get('/api/subscription-plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', 'asc');

    if (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({ error: 'Failed to fetch plans' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', authenticateBusiness, async (req, res) => {
  try {
    const { plan_id } = req.body;

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', req.user.businessId)
      .single();

    const session = await stripe.checkout.sessions.create({
      customer: business.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
            },
            unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        business_id: req.user.businessId,
        plan_id: plan_id
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook endpoint for WhatsApp (with subscription check)
app.post('/webhook/:businessSlug', async (req, res) => {
  try {
    const { businessSlug } = req.params;
    const { Body, From, ProfileName } = req.body;
    
    console.log('Received WhatsApp message:', { businessSlug, Body, From, ProfileName });
    
    // Get business with subscription
    const business = await getBusinessByWhatsAppNumber(From);
    if (!business) {
      console.error('Business not found or no active subscription:', businessSlug);
      return res.status(404).send('Business not found');
    }

    // Check if business is in trial or has active subscription
    if (business.is_trial && new Date(business.trial_ends_at) < new Date()) {
      await sendWhatsAppMessage(From, 
        `Hola! Tu período de prueba ha expirado. Para continuar usando el servicio, por favor actualiza tu suscripción en: ${process.env.FRONTEND_URL}/pricing`, 
        business
      );
      return res.status(403).send('Trial expired');
    }

    // Check order limits
    const subscription = business.business_subscriptions[0];
    if (subscription.subscription_plans.orders_limit && 
        subscription.orders_used >= subscription.subscription_plans.orders_limit) {
      await sendWhatsAppMessage(From, 
        `Hola! Has alcanzado el límite de pedidos de tu plan. Para continuar, por favor actualiza tu suscripción en: ${process.env.FRONTEND_URL}/pricing`, 
        business
      );
      return res.status(403).send('Order limit reached');
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: business.openai_api_key || process.env.OPENAI_API_KEY,
    });

    // Process the message with AI
    const orderData = await processOrderMessage(Body, business.menu_config);
    
    let responseMessage = '';
    
    if (orderData.isOrder) {
      // Save order to database
      const savedOrder = await saveOrder(orderData, From, business.id);
      
      if (savedOrder) {
        // Track usage
        await trackUsage(business.id, subscription.id, 1);
        
        responseMessage = `${orderData.confirmation}\n\nPedido #${savedOrder.id.slice(-8)} registrado exitosamente.`;
      } else {
        responseMessage = "Hubo un error al procesar tu pedido. Por favor intenta de nuevo.";
      }
    } else {
      // Handle non-order messages
      responseMessage = `Hola ${ProfileName || 'cliente'}! 👋\n\nSoy el asistente de pedidos de ${business.name}. Puedes hacer tu pedido escribiendo algo como:\n\n• "Quiero 2 cafés de vainilla"\n• "Un sandwich de pollo"\n• "3 empanadas de carne"\n\n¿En qué puedo ayudarte?`;
    }
    
    // Send response back to WhatsApp
    await sendWhatsAppMessage(From, responseMessage, business);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Stripe webhook for subscription updates
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const businessId = session.metadata.business_id;
      const planId = session.metadata.plan_id;
      
      // Update subscription status
      await supabase
        .from('business_subscriptions')
        .update({ 
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('business_id', businessId);

      // Update business trial status
      await supabase
        .from('businesses')
        .update({ is_trial: false })
        .eq('id', businessId);

      break;
    case 'invoice.payment_failed':
      const invoice = event.data.object;
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Get orders (with subscription check)
app.get('/api/orders', authenticateBusiness, checkSubscriptionLimits, async (req, res) => {
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

// Get subscription info
app.get('/api/subscription', authenticateBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('business_id', req.user.businessId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SaaS server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook/:businessSlug`);
  console.log(`💳 Stripe webhook: http://localhost:${PORT}/webhook/stripe`);
});

module.exports = app;
