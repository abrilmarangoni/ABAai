# ABA AI WhatsApp Ordering Bot - Backend

Backend completo para ABA AI, una plataforma SaaS multi-tenant que automatiza pedidos por WhatsApp usando inteligencia artificial.

## 🚀 Características

- **Multi-tenant**: Soporte para múltiples comercios independientes
- **WhatsApp Integration**: Webhooks para Meta WhatsApp Business Cloud API
- **AI Processing**: Procesamiento de mensajes con OpenAI GPT
- **Payment Processing**: Integración con MercadoPago
- **Real-time Notifications**: Email y Telegram
- **Queue System**: Procesamiento asíncrono con Redis + BullMQ
- **Security**: JWT authentication, rate limiting, tenant isolation

## 🛠 Stack Tecnológico

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: Redis + BullMQ
- **AI**: OpenAI GPT-3.5-turbo
- **Payments**: MercadoPago
- **Notifications**: SendGrid + Telegram
- **Storage**: S3-compatible (DigitalOcean Spaces)
- **Containerization**: Docker + Docker Compose

## 📋 Prerrequisitos

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Cuentas de servicios:
  - OpenAI API
  - WhatsApp Business Cloud API
  - MercadoPago
  - SendGrid
  - Telegram Bot (opcional)

## 🚀 Instalación Rápida

### 1. Clonar y configurar

```bash
git clone <repository-url>
cd backend-aba
cp env.example .env
```

### 2. Configurar variables de entorno

Edita `.env` con tus credenciales:

```env
# Database
DATABASE_URL=postgresql://aba_user:aba_password@localhost:5432/aba_db

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# WhatsApp
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token

# Notifications
SENDGRID_API_KEY=your-sendgrid-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### 3. Ejecutar con Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Ejecutar migraciones
docker-compose exec api npx prisma migrate deploy
```

### 4. Desarrollo local

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar en modo desarrollo
npm run start:dev

# Iniciar worker
npm run worker:dev
```

## 📚 API Documentation

Una vez iniciado el servidor, la documentación está disponible en:
- **Swagger UI**: http://localhost:4000/api/docs
- **Health Check**: http://localhost:4000/health

## 🔧 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo tenant
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/profile` - Perfil del usuario

### Webhooks
- `GET /api/webhooks/whatsapp` - Verificación webhook WhatsApp
- `POST /api/webhooks/whatsapp` - Recibir mensajes WhatsApp
- `POST /api/webhooks/mercadopago` - Webhook pagos MercadoPago

### Dashboard
- `GET /api/orders` - Listar pedidos
- `PUT /api/orders/:id/status` - Actualizar estado pedido
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto

## 🔄 Flujo de Trabajo

### 1. Onboarding Tenant
```bash
# Registrar nuevo comercio
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Mi Restaurante",
    "ownerEmail": "owner@restaurant.com",
    "ownerPassword": "password123"
  }'
```

### 2. Configurar WhatsApp
```bash
# Iniciar proceso de sincronización
curl -X POST http://localhost:4000/api/auth/sync-whatsapp \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 3. Procesamiento de Mensajes
1. Cliente envía mensaje por WhatsApp
2. Webhook recibe mensaje
3. Worker procesa con OpenAI
4. Se crea pedido si es necesario
5. Se envía respuesta automática
6. Se notifica al comercio

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📊 Monitoreo

### Health Checks
- Database: `GET /health`
- Redis: Verificado en startup
- External APIs: Verificado en cada request

### Logs
- Structured logging con Winston
- Logs de auditoría en base de datos
- Métricas de performance

## 🔒 Seguridad

- **JWT Authentication**: Tokens con expiración
- **Rate Limiting**: 100 requests/minuto por IP
- **Tenant Isolation**: Aislamiento completo por tenant
- **Input Validation**: Validación con class-validator
- **SQL Injection**: Protegido con Prisma
- **CORS**: Configurado para dominios específicos

## 🚀 Deployment

### Producción con Docker

```bash
# Build para producción
docker-compose -f docker-compose.prod.yml up -d

# Backup de base de datos
docker-compose exec postgres pg_dump -U aba_user aba_db > backup.sql
```

### Kubernetes

```bash
# Aplicar manifiestos
kubectl apply -f k8s/

# Verificar deployment
kubectl get pods -l app=aba-backend
```

## 📈 Escalabilidad

- **Horizontal Scaling**: Múltiples instancias de API y Worker
- **Queue Scaling**: Workers autoscalables con BullMQ
- **Database**: Read replicas para consultas
- **Caching**: Redis para sesiones y cache
- **CDN**: Para archivos estáticos

## 🛠 Troubleshooting

### Problemas Comunes

1. **Error de conexión a DB**
   ```bash
   docker-compose logs postgres
   ```

2. **Worker no procesa mensajes**
   ```bash
   docker-compose logs worker
   ```

3. **Webhook no funciona**
   - Verificar URL pública
   - Verificar tokens de verificación
   - Revisar logs de nginx

### Debug Mode

```bash
# Activar debug
DEBUG=* npm run start:dev

# Logs detallados
LOG_LEVEL=debug npm run start:dev
```

## 📝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]
- **Email**: support@aba.app
- **Telegram**: @aba_support

---

**ABA AI** - Automatiza tus pedidos por WhatsApp con inteligencia artificial 🤖
