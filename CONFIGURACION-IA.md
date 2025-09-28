# Configuración de OpenAI para ABA AI

## Paso 1: Obtener API Key
1. Ve a https://platform.openai.com/api-keys
2. Crea una cuenta o inicia sesión
3. Haz clic en "Create new secret key"
4. Copia la API key (empieza con sk-)

## Paso 2: Configurar en el Backend
Edita el archivo backend/.env y cambia:
OPENAI_API_KEY=sk-tu-api-key-aqui

## Paso 3: Reiniciar el Backend
Después de configurar la API key, reinicia el servidor:
cd backend && node real-server.js

## Paso 4: Configurar WhatsApp Business API
Para recibir mensajes reales de WhatsApp, necesitas:

### Opción A: Meta WhatsApp Business Cloud API
1. Ve a https://developers.facebook.com/
2. Crea una app de WhatsApp Business
3. Configura el webhook: http://tu-servidor.com/api/webhooks/whatsapp
4. Verifica el webhook con tu servidor

### Opción B: Twilio WhatsApp API
1. Ve a https://console.twilio.com/
2. Activa WhatsApp Sandbox
3. Configura el webhook: http://tu-servidor.com/api/webhooks/whatsapp

## Paso 5: Probar el Sistema
1. Envía un mensaje a tu número de WhatsApp configurado
2. La IA debería responder automáticamente
3. Revisa los logs del backend para ver el procesamiento

## Flujo Completo:
Cliente → WhatsApp → Webhook → IA Procesa → Respuesta Automática → Cliente
