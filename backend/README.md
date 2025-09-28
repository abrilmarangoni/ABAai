# WhatsApp AI Ordering Bot - Backend

Node.js + Express backend for the WhatsApp AI Ordering Bot with Supabase integration.

## Features

- 🤖 AI-powered order processing using OpenAI
- 📱 WhatsApp webhook integration with Twilio
- 🗄️ Supabase database integration
- 📊 REST API for order management
- 🔄 Real-time order status updates

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `../env.example` to `.env` and fill in your values:
   ```bash
   cp ../env.example .env
   ```

3. **Set up Supabase database:**
   - Create a new Supabase project
   - Run the SQL schema from `database-schema.sql` in your Supabase SQL editor
   - Copy your project URL and API keys to `.env`

4. **Set up Twilio WhatsApp:**
   - Create a Twilio account
   - Set up WhatsApp Sandbox
   - Configure webhook URL to point to your server

5. **Set up OpenAI:**
   - Get an API key from OpenAI
   - Add it to your `.env` file

## Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on port 3001 (or PORT from .env).

## API Endpoints

- `POST /webhook` - WhatsApp webhook for receiving messages
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id` - Update order status
- `GET /health` - Health check

## Environment Variables

See `../env.example` for all required environment variables.

## Database Schema

The `orders` table includes:
- `id` (UUID) - Primary key
- `customer_name` (VARCHAR) - Customer name
- `customer_phone` (VARCHAR) - WhatsApp phone number
- `items` (JSONB) - Order items array
- `total_price` (DECIMAL) - Total order price
- `status` (VARCHAR) - Order status (Pendiente, Pagado, Entregado)
- `created_at` (TIMESTAMP) - Order creation time
- `updated_at` (TIMESTAMP) - Last update time
