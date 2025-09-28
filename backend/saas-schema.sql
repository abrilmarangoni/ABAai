-- SaaS Database Schema for WhatsApp AI Ordering Bot
-- Multi-tenant architecture with billing and subscription management

-- Create subscription plans table
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    orders_limit INTEGER, -- NULL = unlimited
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business subscriptions table
CREATE TABLE business_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
    orders_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing table
CREATE TABLE billing_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES business_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create usage tracking table
CREATE TABLE usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES business_subscriptions(id),
    orders_count INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    whatsapp_messages_sent INTEGER DEFAULT 0,
    tracking_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add billing fields to businesses table
ALTER TABLE businesses ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE businesses ADD COLUMN billing_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE businesses ADD COLUMN is_trial BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX idx_business_subscriptions_business_id ON business_subscriptions(business_id);
CREATE INDEX idx_business_subscriptions_status ON business_subscriptions(status);
CREATE INDEX idx_billing_records_business_id ON billing_records(business_id);
CREATE INDEX idx_billing_records_status ON billing_records(status);
CREATE INDEX idx_usage_tracking_business_id ON usage_tracking(business_id);
CREATE INDEX idx_usage_tracking_date ON usage_tracking(tracking_date);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, orders_limit, features) VALUES
('Starter', 'starter', 29.00, 290.00, 100, '{
    "menu_items": 5,
    "whatsapp_support": true,
    "email_support": true,
    "basic_analytics": true,
    "custom_branding": false
}'),
('Professional', 'professional', 79.00, 790.00, 500, '{
    "menu_items": -1,
    "whatsapp_support": true,
    "priority_support": true,
    "advanced_analytics": true,
    "custom_branding": true,
    "api_access": true
}'),
('Enterprise', 'enterprise', 199.00, 1990.00, NULL, '{
    "menu_items": -1,
    "whatsapp_support": true,
    "dedicated_support": true,
    "advanced_analytics": true,
    "custom_branding": true,
    "api_access": true,
    "white_label": true,
    "custom_integrations": true
}');

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow service role operations on subscription_plans" ON subscription_plans
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow business users to access their subscriptions" ON business_subscriptions
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Allow service role operations on business_subscriptions" ON business_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow business users to access their billing" ON billing_records
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Allow service role operations on billing_records" ON billing_records
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow business users to access their usage" ON usage_tracking
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Allow service role operations on usage_tracking" ON usage_tracking
    FOR ALL USING (auth.role() = 'service_role');
