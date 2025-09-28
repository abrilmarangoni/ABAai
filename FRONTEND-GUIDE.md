# 🤖 WhatsApp AI Ordering Bot - Sistema Completo

Sistema SaaS completo para automatizar pedidos por WhatsApp con inteligencia artificial.

## 🎯 **¿Cómo Funciona el Sistema?**

### 📱 **Flujo Completo del Usuario**

```
1. Empresa visita la página web
   ↓
2. Se registra o inicia sesión
   ↓
3. Configura su negocio (Twilio, OpenAI, menú)
   ↓
4. Clientes escriben por WhatsApp
   ↓
5. IA procesa los pedidos automáticamente
   ↓
6. Empresa gestiona pedidos desde el dashboard
```

### 🖥️ **Estructura del Frontend**

El sistema web tiene **4 páginas principales**:

1. **🔐 Página de Login** (`/login`)
   - Formulario de inicio de sesión
   - Validación de credenciales
   - Redirección al dashboard

2. **📝 Página de Registro** (`/register`)
   - Formulario de registro de nuevo negocio
   - Validación de datos únicos
   - Creación automática de cuenta

3. **💰 Página de Pricing** (`/pricing`)
   - Planes de suscripción
   - Comparación de características
   - Integración con Stripe

4. **📊 Dashboard Principal** (`/dashboard`)
   - Gestión de pedidos
   - Configuración del negocio
   - Información de suscripción

## 🏗️ **Arquitectura del Sistema**

### **Frontend (React + Vite)**
```
frontend/src/
├── pages/
│   ├── LoginPage.jsx          # Página de login
│   ├── RegisterPage.jsx       # Página de registro
│   ├── DashboardPage.jsx      # Dashboard principal
│   └── PricingPage.jsx        # Página de precios
├── components/
│   ├── OrdersTable.jsx        # Tabla de pedidos
│   ├── OrderStats.jsx         # Estadísticas
│   ├── BusinessConfig.jsx     # Configuración del negocio
│   └── ProtectedRoute.jsx    # Rutas protegidas
└── App.jsx                    # Aplicación principal con routing
```

### **Backend (Node.js + Express)**
```
backend/
├── server.js                  # Servidor principal
├── multi-tenant-server.js    # Servidor multi-empresa
├── saas-server.js            # Servidor SaaS con billing
├── database-schema.sql       # Schema básico
├── multi-tenant-schema.sql   # Schema multi-empresa
└── saas-schema.sql          # Schema SaaS completo
```

### **Base de Datos (Supabase)**
```
Tablas principales:
├── businesses              # Información de empresas
├── business_users         # Usuarios por empresa
├── orders                 # Pedidos con business_id
├── subscription_plans     # Planes de suscripción
├── business_subscriptions # Suscripciones activas
├── billing_records       # Registros de facturación
└── usage_tracking       # Seguimiento de uso
```

## 🚀 **Cómo Usar el Sistema**

### **1. Para Empresas (Clientes)**

**Registro:**
1. Visita `/register`
2. Completa datos del negocio
3. Recibe 14 días gratis
4. Configura Twilio y OpenAI
5. Personaliza menú

**Uso Diario:**
1. Inicia sesión en `/login`
2. Ve pedidos en tiempo real
3. Cambia estados de pedidos
4. Configura menú y ajustes

### **2. Para Desarrolladores**

**Instalación:**
```bash
# Clonar y configurar
git clone [repo]
cd kimiAI

# Instalar dependencias
npm run install:all

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales

# Ejecutar schema de base de datos
# Ejecutar saas-schema.sql en Supabase

# Iniciar desarrollo
npm run dev
```

**URLs de Desarrollo:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Webhook: http://localhost:3001/webhook/:businessSlug

## 🔐 **Sistema de Autenticación**

### **Flujo de Login**
```
Usuario ingresa credenciales
↓
Backend valida contra business_users
↓
Genera JWT token con business_id
↓
Frontend guarda token en localStorage
↓
Todas las requests incluyen Authorization header
```

### **Rutas Protegidas**
- `/dashboard` - Requiere autenticación
- `/api/orders` - Solo pedidos de la empresa
- `/api/business` - Solo info de la empresa logueada

## 💰 **Sistema de Monetización**

### **Planes de Suscripción**
- **Starter**: $29/mes - 100 pedidos
- **Professional**: $79/mes - 500 pedidos  
- **Enterprise**: $199/mes - Ilimitados

### **Integración Stripe**
- Checkout sessions para pagos
- Webhooks para actualizar suscripciones
- Facturación automática mensual
- Manejo de pagos fallidos

### **Seguimiento de Uso**
- Contador de pedidos por mes
- Límites automáticos por plan
- Notificaciones cuando se acerca al límite
- Upgrade automático cuando se excede

## 📱 **Configuración por Empresa**

### **Cada empresa configura:**
1. **Twilio WhatsApp**
   - Account SID
   - Auth Token
   - WhatsApp Number
   - Webhook URL

2. **OpenAI API**
   - API Key personalizada
   - Procesamiento de mensajes

3. **Menú Personalizado**
   - Productos y precios
   - Variantes disponibles
   - Configuración JSON

## 🔄 **Flujo de Pedidos**

### **Procesamiento Automático**
```
Cliente escribe WhatsApp
↓
Webhook recibe mensaje
↓
Sistema identifica empresa por URL
↓
IA procesa mensaje con menú específico
↓
Extrae productos, cantidades, precios
↓
Guarda pedido en base de datos
↓
Responde confirmación al cliente
↓
Empresa ve pedido en dashboard
```

### **Gestión Manual**
```
Empresa ve pedido en dashboard
↓
Cambia estado (Pendiente → Pagado → Entregado)
↓
Sistema actualiza en tiempo real
↓
Cliente puede recibir notificaciones
```

## 🎨 **Características del Dashboard**

### **Estadísticas en Tiempo Real**
- Total de pedidos
- Pedidos por estado
- Ingresos totales
- Métricas del mes actual

### **Tabla de Pedidos**
- Lista completa con filtros
- Información detallada del cliente
- Items del pedido formateados
- Dropdown para cambiar estados
- Actualización automática cada 30 segundos

### **Configuración del Negocio**
- Información básica
- Credenciales de APIs
- Editor de menú visual
- Información del webhook

## 🚀 **Despliegue en Producción**

### **Variables de Entorno Requeridas**
```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio

# OpenAI
OPENAI_API_KEY=tu_clave_de_openai

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=tu_secreto_super_seguro

# URLs
FRONTEND_URL=https://tu-dominio.com
```

### **Configuración de Dominio**
- Frontend: `https://tu-dominio.com`
- Backend: `https://api.tu-dominio.com`
- Webhook: `https://api.tu-dominio.com/webhook/:businessSlug`

## 📊 **Métricas de Negocio**

### **KPIs Principales**
- **MRR**: Ingresos mensuales recurrentes
- **CAC**: Costo de adquisición de cliente
- **LTV**: Valor de vida del cliente
- **Churn Rate**: Tasa de cancelación
- **Trial to Paid**: Conversión de prueba a pago

### **Proyección de Ingresos**
```
100 clientes × $79/mes = $7,900 MRR
500 clientes × $79/mes = $39,500 MRR
1,000 clientes × $79/mes = $79,000 MRR
```

## 🔍 **Próximos Pasos**

1. **Configurar credenciales** en `.env`
2. **Ejecutar schema SaaS** en Supabase
3. **Configurar Stripe** para pagos
4. **Probar registro** de nuevas empresas
5. **Configurar webhooks** de Twilio
6. **Personalizar menús** por empresa
7. **Monitorear métricas** de uso

¡El sistema completo está listo para recibir empresas y procesar pedidos! 🎉

## 📞 **Soporte**

- **Documentación**: READMEs en cada directorio
- **Issues**: GitHub Issues para bugs
- **Email**: soporte@tu-dominio.com
- **Discord**: Canal de comunidad
