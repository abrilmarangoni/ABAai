-- Supabase Database Schema for WhatsApp AI Ordering Bot

-- Create the orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Pagado', 'Entregado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on customer_phone for faster lookups
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);

-- Create an index on status for filtering
CREATE INDEX idx_orders_status ON orders(status);

-- Create an index on created_at for ordering
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- In production, you might want to restrict this based on user roles
CREATE POLICY "Allow all operations for authenticated users" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a policy for service role (backend operations)
CREATE POLICY "Allow service role operations" ON orders
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO orders (customer_name, customer_phone, items, total_price, status) VALUES
('Juan Pérez', '+1234567890', '[{"name": "café", "quantity": 2, "variant": "americano", "price": 1500}]', 3000.00, 'Pendiente'),
('María García', '+1234567891', '[{"name": "sandwich", "quantity": 1, "variant": "pollo", "price": 3000}]', 3000.00, 'Pagado'),
('Carlos López', '+1234567892', '[{"name": "empanada", "quantity": 3, "variant": "carne", "price": 1200}]', 3600.00, 'Entregado');
