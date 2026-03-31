-- =============================================
-- ETNYX Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL,
    
    -- Customer Info
    username TEXT NOT NULL,
    game_id TEXT NOT NULL,
    whatsapp TEXT,
    
    -- Order Details
    current_rank TEXT NOT NULL,
    target_rank TEXT NOT NULL,
    package TEXT NOT NULL,
    is_express BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Pricing
    base_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_progress_rank TEXT,
    
    -- Booster Assignment
    booster_id UUID REFERENCES boosters(id),
    booster_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- =============================================
-- 2. BOOSTERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS boosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    specialization TEXT[], -- ['tank', 'marksman', 'mage', etc]
    max_rank TEXT DEFAULT 'mythicglory',
    is_active BOOLEAN DEFAULT TRUE,
    total_orders INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. ORDER LOGS TABLE (for tracking history)
-- =============================================
CREATE TABLE IF NOT EXISTS order_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'status_changed', 'progress_updated', 'assigned', etc
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_by TEXT, -- 'system', 'admin', booster name
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('pricing', '{
        "warrior-elite": 15000,
        "warrior-master": 25000,
        "warrior-grandmaster": 40000,
        "warrior-epic": 60000,
        "warrior-legend": 100000,
        "warrior-mythic": 180000,
        "warrior-mythicglory": 350000,
        "elite-master": 15000,
        "elite-grandmaster": 30000,
        "elite-epic": 50000,
        "elite-legend": 90000,
        "elite-mythic": 170000,
        "elite-mythicglory": 340000,
        "master-grandmaster": 20000,
        "master-epic": 40000,
        "master-legend": 80000,
        "master-mythic": 160000,
        "master-mythicglory": 330000,
        "grandmaster-epic": 25000,
        "grandmaster-legend": 65000,
        "grandmaster-mythic": 145000,
        "grandmaster-mythicglory": 315000,
        "epic-legend": 25000,
        "epic-mythic": 120000,
        "epic-mythicglory": 290000,
        "legend-mythic": 80000,
        "legend-mythicglory": 250000,
        "mythic-mythicglory": 200000
    }'::jsonb),
    ('express_multiplier', '{"value": 1.2}'::jsonb),
    ('premium_multiplier', '{"value": 1.3}'::jsonb),
    ('whatsapp_number', '{"value": "6281414131321"}'::jsonb),
    ('site_name', '{"value": "ETNYX"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 5. STATISTICS VIEW
-- =============================================
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as total_revenue,
    COALESCE(SUM(total_price) FILTER (WHERE status IN ('pending', 'confirmed', 'in_progress')), 0) as pending_revenue,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_today,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as orders_this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as orders_this_month
FROM orders;

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on boosters" ON boosters
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on order_logs" ON order_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on settings" ON settings
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Anon can read settings (for pricing display)
CREATE POLICY "Anon can read settings" ON settings
    FOR SELECT USING (true);

-- =============================================
-- 7. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);

-- =============================================
-- 8. FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to generate order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'ETX-';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample booster
INSERT INTO boosters (name, whatsapp, specialization, max_rank) VALUES
    ('ProBooster1', '6281234567890', ARRAY['marksman', 'mage'], 'mythicglory'),
    ('ProBooster2', '6281234567891', ARRAY['tank', 'fighter'], 'mythicglory')
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO orders (order_id, username, game_id, current_rank, target_rank, package, base_price, total_price, status, progress) VALUES
    (generate_order_id(), 'Player123', '123456789', 'epic', 'legend', 'Standard', 25000, 25000, 'completed', 100),
    (generate_order_id(), 'GamerPro', '987654321', 'legend', 'mythic', 'Express', 80000, 96000, 'in_progress', 65),
    (generate_order_id(), 'MLPlayer', '456789123', 'epic', 'mythic', 'Premium', 120000, 156000, 'pending', 0)
ON CONFLICT DO NOTHING;
