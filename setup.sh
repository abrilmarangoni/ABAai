#!/bin/bash

echo "🚀 ABA AI - Inicio Rápido"
echo "========================="

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"

# Configurar backend
echo "📦 Configurando backend..."
cd backend

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cp env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo backend/.env con tus credenciales antes de continuar"
    echo "   - OpenAI API Key"
    echo "   - WhatsApp API Token"
    echo "   - MercadoPago Access Token"
    echo "   - SendGrid API Key"
    echo ""
    read -p "¿Has configurado el archivo .env? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Por favor configura el archivo .env primero"
        exit 1
    fi
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
npm install

# Iniciar servicios con Docker
echo "🐳 Iniciando servicios con Docker..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Ejecutar migraciones
echo "🗄️  Ejecutando migraciones de base de datos..."
docker-compose exec api npx prisma migrate deploy

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
docker-compose exec api npx prisma generate

# Volver al directorio raíz
cd ..

# Configurar frontend
echo "🎨 Configurando frontend..."
cd frontend

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
npm install

# Volver al directorio raíz
cd ..

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Inicia el backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "2. Inicia el frontend (en otra terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Accede a la aplicación:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:4000"
echo "   API Docs: http://localhost:4000/api/docs"
echo ""
echo "🔐 Credenciales de prueba:"
echo "   Email: owner@cafe-del-centro.com"
echo "   Password: password123"
echo ""
echo "📚 Documentación:"
echo "   Backend: backend/README.md"
echo "   Frontend: frontend/README.md"
echo ""
echo "✨ ¡Disfruta usando ABA AI!"
