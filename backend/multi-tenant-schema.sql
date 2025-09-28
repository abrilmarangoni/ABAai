-- Multi-Tenant Database Schema for WhatsApp AI Ordering Bot
-- Supports multiple businesses using the same system

-- Create businesses table
CREATE TABLE businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
    twilio_account_sid VARCHAR(100),
    twilio_auth_token VARCHAR(100),
    twilio_whatsapp_number VARCHAR(50),
    openai_api_key VARCHAR(200),
    menu_config JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify orders table to include business_id
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Pagado', 'Entregado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business users table for authentication
CREATE TABLE business_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_whatsapp_number ON businesses(whatsapp_number);
CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_email ON business_users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses
CREATE POLICY "Allow service role operations on businesses" ON businesses
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for orders (business-specific access)
CREATE POLICY "Allow business users to access their orders" ON orders
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Allow service role operations on orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for business users
CREATE POLICY "Allow users to access their business" ON business_users
    FOR ALL USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Allow service role operations on business_users" ON business_users
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_users_updated_at 
    BEFORE UPDATE ON business_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample businesses
INSERT INTO businesses (name, slug, whatsapp_number, menu_config) VALUES
('Café Central', 'cafe-central', '+1234567890', '{
    "café": {"price": 1500, "variants": ["americano", "latte", "cappuccino", "mocha"]},
    "café frío": {"price": 2000, "variants": ["caramelo", "vainilla", "chocolate"]},
    "sandwich": {"price": 3000, "variants": ["jamón", "pollo", "vegetariano"]}
}'),
('Pizzería Bella Vista', 'pizzeria-bella-vista', '+1234567891', '{
    "pizza": {"price": 8000, "variants": ["margherita", "pepperoni", "hawaiana"]},
    "empanada": {"price": 1200, "variants": ["carne", "pollo", "queso"]},
    "bebida": {"price": 2000, "variants": ["coca-cola", "sprite", "agua"]}
}'),
('Sushi Express', 'sushi-express', '+1234567892', '{
    "roll": {"price": 12000, "variants": ["california", "philadelphia", "dragon"]},
    "sashimi": {"price": 15000, "variants": ["salmón", "atún", "camarón"]},
    "sopa": {"price": 5000, "variants": ["miso", "ramen"]}
}');

-- Insert sample business users
INSERT INTO business_users (business_id, email, password_hash, role) VALUES
((SELECT id FROM businesses WHERE slug = 'cafe-central'), 'admin@cafecentral.com', '$2b$10$example_hash', 'admin'),
((SELECT id FROM businesses WHERE slug = 'pizzeria-bella-vista'), 'admin@pizzeria.com', '$2b$10$example_hash', 'admin'),
((SELECT id FROM businesses WHERE slug = 'sushi-express'), 'admin@sushi.com', '$2b$10$example_hash', 'admin');
