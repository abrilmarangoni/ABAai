-- Initial database setup for ABA
-- This script runs when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional indexes for performance
-- (Prisma will handle the main schema)

-- Index for tenant isolation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- Index for message processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_customer_phone ON messages(tenant_id, text) WHERE direction = 'INBOUND';

-- Index for order status updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status, created_at);

-- Index for payment processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_provider ON payments(provider, provider_payment_id);

-- Insert sample data for development
INSERT INTO tenants (id, name, domain, "isActive", "createdAt", "updatedAt") 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Café del Centro',
    'cafe-del-centro',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, "tenantId", email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'owner@cafe-del-centro.com',
    '$2b$10$rQZ8KjJ8KjJ8KjJ8KjJ8K.8KjJ8KjJ8KjJ8KjJ8KjJ8KjJ8KjJ8KjJ8K', -- password: password123
    'OWNER',
    'Juan',
    'Pérez',
    true,
    NOW(),
    NOW()
) ON CONFLICT ("tenantId", email) DO NOTHING;

INSERT INTO products (id, "tenantId", name, description, price, sku, available, "createdAt", "updatedAt")
VALUES 
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Café Americano', 'Café negro americano', 450.00, 'CAFE-001', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Café Latte', 'Café con leche', 550.00, 'CAFE-002', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Cappuccino', 'Café con espuma de leche', 600.00, 'CAFE-003', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Medialuna', 'Medialuna de manteca', 250.00, 'PAN-001', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'Sandwich de Jamón y Queso', 'Sandwich completo', 800.00, 'SAND-001', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
