# ABA AI Backend - Deployment Guide

## 🚀 Quick Start

### 1. Local Development
```bash
# Clone repository
git clone <repository-url>
cd backend-aba

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your credentials

# Start database
docker-compose up -d postgres redis

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev

# Start worker (separate terminal)
npm run worker:dev
```

### 2. Production with Docker
```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f api
docker-compose logs -f worker

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

## 🔧 Configuration

### Required Environment Variables

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

### Optional Configuration

```env
# Storage
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_BUCKET=aba-uploads

# Redis
REDIS_URL=redis://localhost:6379/0

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

## 📊 Monitoring

### Health Checks
- API: `GET /health`
- Database: Automatic connection check
- Redis: Queue health monitoring

### Logs
- Structured JSON logging
- Audit logs in database
- Error tracking with stack traces

### Metrics
- Request count and duration
- Queue processing times
- OpenAI token usage
- Payment success rates

## 🔒 Security

### Production Checklist
- [ ] Change default JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable webhook signature verification
- [ ] Use environment-specific database
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

### Webhook Security
```typescript
// Verify WhatsApp webhook signature
const signature = req.headers['x-hub-signature-256'];
const isValid = crypto
  .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex') === signature;
```

## 🚀 Deployment Options

### 1. Docker Compose (Recommended)
```bash
# Production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Kubernetes
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment
kubectl get pods -l app=aba-backend
```

### 3. Cloud Providers

#### Heroku
```bash
# Add Heroku Postgres
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: aba-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-repo
    branch: main
  run_command: npm run start:prod
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
```

#### AWS ECS
```bash
# Build and push image
docker build -t aba-backend .
docker tag aba-backend:latest your-ecr-repo/aba-backend:latest
docker push your-ecr-repo/aba-backend:latest

# Deploy with ECS
aws ecs update-service --cluster aba-cluster --service aba-backend
```

## 📈 Scaling

### Horizontal Scaling
- Multiple API instances behind load balancer
- Worker instances with queue distribution
- Database read replicas
- Redis cluster for high availability

### Performance Optimization
- Database connection pooling
- Redis caching for frequent queries
- CDN for static assets
- Background job optimization

## 🛠 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec api npx prisma db pull
   ```

2. **Worker Not Processing Jobs**
   ```bash
   # Check Redis connection
   docker-compose logs redis
   
   # Check worker logs
   docker-compose logs worker
   
   # Restart worker
   docker-compose restart worker
   ```

3. **Webhook Not Working**
   - Verify public URL accessibility
   - Check webhook verification tokens
   - Review nginx/proxy configuration
   - Test with ngrok for local development

4. **OpenAI Rate Limits**
   - Implement exponential backoff
   - Add request queuing
   - Monitor token usage
   - Consider upgrading OpenAI plan

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run start:dev

# Verbose Prisma logging
DEBUG=prisma:* npm run start:dev
```

## 📋 Maintenance

### Database Maintenance
```bash
# Backup database
docker-compose exec postgres pg_dump -U aba_user aba_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U aba_user aba_db < backup.sql

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/aba-backend

# Log rotation config
/var/log/aba-backend/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### Updates
```bash
# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Update dependencies
npm update
docker-compose build --no-cache
```

## 📞 Support

- **Documentation**: [Wiki]
- **Issues**: [GitHub Issues]
- **Email**: support@aba.app
- **Status Page**: [status.aba.app]

---

**ABA AI Backend** - Production-ready WhatsApp ordering automation 🤖
