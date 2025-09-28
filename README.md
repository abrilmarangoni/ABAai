# ABA AI - WhatsApp Ordering Bot

Sistema completo de automatización de pedidos por WhatsApp con inteligencia artificial.

## 🚀 Estructura del Proyecto

```
kimiAI/
├── backend/          # Backend NestJS + TypeScript
├── frontend/         # Frontend React + Vite
└── README.md         # Este archivo
```

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS + TypeScript
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Queue System**: Redis + BullMQ
- **AI**: OpenAI GPT-3.5-turbo
- **Payments**: MercadoPago
- **Notifications**: SendGrid + Telegram
- **Storage**: S3-compatible

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State**: React Hooks
- **UI**: Glassmorphism design

## 🚀 Inicio Rápido

### 1. Configurar Backend

```bash
cd backend
cp env.example .env
# Editar .env con tus credenciales

# Instalar dependencias
npm install

# Iniciar con Docker
docker-compose up -d

# O desarrollo local
npm run start:dev
```

### 2. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs

## 📋 Funcionalidades

### ✅ Implementado
- ✅ Landing page con diseño minimalista
- ✅ Sistema de autenticación JWT multi-tenant
- ✅ Dashboard con sidebar navigation
- ✅ Gestión de pedidos en tiempo real
- ✅ Estadísticas de pedidos
- ✅ Integración WhatsApp (webhooks)
- ✅ Procesamiento de mensajes con IA
- ✅ Integración MercadoPago
- ✅ Notificaciones por email/Telegram
- ✅ Subida de comprobantes
- ✅ Sistema de roles y permisos

### 🔄 En Desarrollo
- 🔄 Configuración de WhatsApp Business
- 🔄 Panel de administración
- 🔄 Analytics avanzados
- 🔄 Integración con más pasarelas de pago

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# OpenAI
OPENAI_API_KEY=sk-your-key

# WhatsApp
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your-token

# Notifications
SENDGRID_API_KEY=your-key
TELEGRAM_BOT_TOKEN=your-token

# Security
JWT_SECRET=your-secret-key
```

## 📊 Flujo de Trabajo

1. **Cliente envía mensaje** → WhatsApp webhook
2. **Worker procesa** → OpenAI analiza intención
3. **Si es pedido** → Crea order en BD
4. **Envía confirmación** → WhatsApp response
5. **Notifica comercio** → Email + Telegram
6. **Procesa pago** → MercadoPago o comprobante
7. **Actualiza estado** → Dashboard en tiempo real

## 🎨 Diseño

- **Estilo**: Minimalista con glassmorphism
- **Colores**: Gradiente rosa-naranja
- **Tipografía**: Fonts limpias y legibles
- **Responsive**: Mobile-first design
- **Accesibilidad**: Cumple estándares WCAG

## 🔒 Seguridad

- JWT authentication con tenant isolation
- Rate limiting por IP
- Input validation
- SQL injection protection
- CORS configurado
- Audit logging

## 📈 Escalabilidad

- Workers autoscalables
- Queue system con Redis
- Database connection pooling
- Horizontal scaling ready
- Kubernetes manifests incluidos

## 🚀 Deployment

### Desarrollo
```bash
# Backend
cd backend && docker-compose up -d

# Frontend
cd frontend && npm run dev
```

### Producción
```bash
# Backend
cd backend && docker-compose -f docker-compose.prod.yml up -d

# Frontend (build estático)
cd frontend && npm run build
```

## 📞 Soporte

- **Documentación**: Ver README.md en cada carpeta
- **Issues**: Crear issue en GitHub
- **Email**: support@aba.app

---

**ABA AI** - Automatiza tus pedidos por WhatsApp con inteligencia artificial 🤖