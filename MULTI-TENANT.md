# 🏢 WhatsApp AI Ordering Bot - Multi-Empresa

Sistema multi-tenant que permite a múltiples empresas usar el mismo bot de WhatsApp con configuraciones independientes.

## 🎯 Características Multi-Empresa

- 🏢 **Múltiples negocios** - Cada empresa tiene su propia configuración
- 🔐 **Autenticación por empresa** - Login separado para cada negocio
- 📱 **WhatsApp independiente** - Cada empresa usa su propio número
- 🍽️ **Menús personalizados** - Cada negocio define sus productos
- 📊 **Dashboards separados** - Cada empresa ve solo sus pedidos
- 🔧 **Configuración individual** - APIs y configuraciones independientes

## 🏗️ Arquitectura Multi-Tenant

### Base de Datos
```
businesses/
├── id (UUID) - Identificador único
├── name - Nombre del negocio
├── slug - Identificador URL (ej: cafe-central)
├── whatsapp_number - Número de WhatsApp
├── twilio_account_sid - Credenciales Twilio
├── twilio_auth_token - Token Twilio
├── openai_api_key - API Key OpenAI
├── menu_config - Configuración del menú (JSON)
└── settings - Configuraciones adicionales (JSON)

orders/
├── business_id - Referencia al negocio
├── customer_name - Nombre del cliente
├── customer_phone - Teléfono del cliente
├── items - Items del pedido (JSON)
├── total_price - Precio total
└── status - Estado del pedido

business_users/
├── business_id - Referencia al negocio
├── email - Email del usuario
├── password_hash - Hash de la contraseña
└── role - Rol del usuario (admin, manager, viewer)
```

### URLs Multi-Tenant
```
# Webhook específico por empresa
POST /webhook/:businessSlug

# APIs autenticadas por empresa
GET /api/orders (solo pedidos de la empresa logueada)
PUT /api/orders/:id (solo pedidos de la empresa logueada)
GET /api/business (info de la empresa logueada)

# APIs públicas
POST /api/businesses/register
POST /api/businesses/login
```

## 🚀 Configuración para Múltiples Empresas

### 1. Configurar Base de Datos
```sql
-- Ejecutar el schema multi-tenant
-- backend/multi-tenant-schema.sql
```

### 2. Configurar Servidor Multi-Tenant
```bash
# Usar el servidor multi-tenant
cp backend/multi-tenant-server.js backend/server.js

# Instalar dependencias adicionales
cd backend
npm install bcrypt jsonwebtoken
```

### 3. Configurar Frontend Multi-Tenant
```bash
# Usar el frontend multi-tenant
cp frontend/src/App-multi-tenant.jsx frontend/src/App.jsx

# Instalar dependencias adicionales
cd frontend
npm install
```

## 📱 Flujo Multi-Empresa

### Registro de Nueva Empresa
1. **Empresa se registra** → Completa formulario con datos del negocio
2. **Sistema crea** → Negocio + Usuario admin + Configuración inicial
3. **Empresa configura** → Twilio, OpenAI, menú personalizado
4. **Webhook activo** → `/webhook/nombre-empresa`

### Procesamiento de Pedidos
1. **Cliente escribe** → Al WhatsApp de la empresa específica
2. **Webhook recibe** → `/webhook/cafe-central`
3. **Sistema identifica** → Empresa por el slug en la URL
4. **IA procesa** → Usando menú específico de la empresa
5. **Pedido se guarda** → Con business_id específico
6. **Dueño gestiona** → Solo ve pedidos de su empresa

## 🔧 Configuración por Empresa

### Variables de Entorno por Empresa
Cada empresa puede tener sus propias credenciales:

```env
# Empresa 1 - Café Central
CAFE_CENTRAL_TWILIO_SID=ACxxx...
CAFE_CENTRAL_TWILIO_TOKEN=xxx...
CAFE_CENTRAL_OPENAI_KEY=sk-xxx...

# Empresa 2 - Pizzería Bella Vista
PIZZERIA_TWILIO_SID=ACyyy...
PIZZERIA_TWILIO_TOKEN=yyy...
PIZZERIA_OPENAI_KEY=sk-yyy...
```

### Menús Personalizados
```json
{
  "café": {
    "price": 1500,
    "variants": ["americano", "latte", "cappuccino"]
  },
  "sandwich": {
    "price": 3000,
    "variants": ["jamón", "pollo", "vegetariano"]
  }
}
```

## 🎨 Ejemplos de Configuración

### Café Central
- **Slug**: `cafe-central`
- **WhatsApp**: `+1234567890`
- **Webhook**: `/webhook/cafe-central`
- **Menú**: Cafés, sandwiches, empanadas

### Pizzería Bella Vista
- **Slug**: `pizzeria-bella-vista`
- **WhatsApp**: `+1234567891`
- **Webhook**: `/webhook/pizzeria-bella-vista`
- **Menú**: Pizzas, empanadas, bebidas

### Sushi Express
- **Slug**: `sushi-express`
- **WhatsApp**: `+1234567892`
- **Webhook**: `/webhook/sushi-express`
- **Menú**: Rolls, sashimi, sopas

## 🔐 Seguridad Multi-Tenant

### Row Level Security (RLS)
- Cada empresa solo puede ver sus propios pedidos
- Usuarios solo pueden acceder a su empresa
- Políticas de seguridad automáticas

### Autenticación JWT
- Tokens incluyen business_id
- Middleware valida acceso por empresa
- Sesiones independientes por empresa

## 📊 Dashboard Multi-Empresa

### Características
- **Login por empresa** - Cada negocio tiene su acceso
- **Datos aislados** - Solo ve pedidos de su empresa
- **Configuración independiente** - Menú y configuraciones propias
- **Estadísticas separadas** - Métricas solo de su negocio

### Navegación
- **Tab Pedidos** - Gestión de pedidos
- **Tab Configuración** - Ajustes del negocio
- **Logout** - Cerrar sesión de la empresa

## 🚀 Despliegue Multi-Empresa

### Opción 1: Servidor Único
```bash
# Un servidor para todas las empresas
npm run dev
# URLs: /webhook/empresa1, /webhook/empresa2, etc.
```

### Opción 2: Servidores Separados
```bash
# Servidor por empresa (más escalable)
# Empresa 1: puerto 3001
# Empresa 2: puerto 3002
# Empresa 3: puerto 3003
```

## 💰 Modelo de Negocio

### Opciones de Monetización
1. **SaaS por empresa** - Suscripción mensual por negocio
2. **Por pedido** - Comisión por pedido procesado
3. **Freemium** - Plan gratuito con límites
4. **Enterprise** - Planes corporativos

### Métricas por Empresa
- Pedidos procesados
- Ingresos generados
- Tiempo de respuesta
- Satisfacción del cliente

## 🔍 Próximos Pasos

1. **Implementar autenticación** - Sistema de login/registro
2. **Configurar Twilio** - WhatsApp Business API por empresa
3. **Personalizar menús** - Editor de menús en el dashboard
4. **Analytics** - Métricas y reportes por empresa
5. **Escalabilidad** - Optimizar para múltiples empresas

¡El sistema multi-empresa está listo para escalar! 🚀
