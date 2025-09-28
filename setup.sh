#!/bin/bash

# WhatsApp AI Ordering Bot - Quick Start Script

echo "🚀 Iniciando WhatsApp AI Ordering Bot..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Copiando desde env.example..."
    cp env.example .env
    echo "📝 Por favor edita el archivo .env con tus credenciales antes de continuar."
    echo "   Necesitarás:"
    echo "   - Supabase URL y API keys"
    echo "   - OpenAI API key"
    echo "   - Twilio WhatsApp credentials"
    exit 1
fi

# Install backend dependencies
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Instalando dependencias del frontend..."
cd ../frontend
npm install

# Go back to root
cd ..

echo "✅ Instalación completada!"
echo ""
echo "🔧 Para iniciar el proyecto:"
echo "   1. Edita el archivo .env con tus credenciales"
echo "   2. Ejecuta: npm run dev (desde la raíz del proyecto)"
echo "   3. O ejecuta manualmente:"
echo "      - Backend: cd backend && npm run dev"
echo "      - Frontend: cd frontend && npm run dev"
echo ""
echo "📱 Backend: http://localhost:3001"
echo "🖥️  Frontend: http://localhost:3000"
