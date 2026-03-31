-- =============================================
-- ETNYX Database Schema V2 - Additional Features
-- Run this in Supabase SQL Editor AFTER v1
-- =============================================

-- =============================================
-- 1. TESTIMONIALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    rank_from TEXT NOT NULL,
    rank_to TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PORTFOLIO TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    rank_from TEXT NOT NULL,
    rank_to TEXT NOT NULL,
    image_before_url TEXT,
    image_after_url TEXT,
    description TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PROMO CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL, -- percentage (1-100) or fixed amount in rupiah
    min_order INTEGER DEFAULT 0, -- minimum order amount to use
    max_discount INTEGER, -- maximum discount for percentage type
    max_uses INTEGER, -- NULL = unlimited
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    whatsapp TEXT,
    avatar_url TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES customers(id),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- =============================================
-- 5. REFERRALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    reward_type TEXT DEFAULT 'discount', -- 'discount', 'cashback'
    reward_value INTEGER DEFAULT 10000, -- in rupiah
    reward_given BOOLEAN DEFAULT FALSE,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. PROMO CODE USAGE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promo_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    discount_amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. UPDATE ORDERS TABLE
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES referrals(id);

-- =============================================
-- 8. ENABLE RLS
-- =============================================
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_usage ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on testimonials" ON testimonials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on portfolio" ON portfolio FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on promo_codes" ON promo_codes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on customers" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on promo_usage" ON promo_usage FOR ALL USING (auth.role() = 'service_role');

-- Anon can read visible testimonials and portfolio
CREATE POLICY "Anon can read visible testimonials" ON testimonials FOR SELECT USING (is_visible = true);
CREATE POLICY "Anon can read visible portfolio" ON portfolio FOR SELECT USING (is_visible = true);

-- =============================================
-- 9. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_visible ON portfolio(created_at DESC) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);

-- =============================================
-- 10. FUNCTIONS
-- =============================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'REF-';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate referral code on customer insert
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_auto_referral
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_referral_code();

-- Validate promo code function
CREATE OR REPLACE FUNCTION validate_promo_code(p_code TEXT, p_order_amount INTEGER)
RETURNS TABLE (
    valid BOOLEAN,
    promo_id UUID,
    discount_type TEXT,
    discount_value INTEGER,
    max_discount INTEGER,
    calculated_discount INTEGER,
    message TEXT
) AS $$
DECLARE
    promo RECORD;
    calc_discount INTEGER;
BEGIN
    SELECT * INTO promo FROM promo_codes 
    WHERE code = UPPER(p_code) 
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, 0, 'Kode promo tidak valid atau sudah expired';
        RETURN;
    END IF;
    
    IF p_order_amount < promo.min_order THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, 0, 
            format('Minimum order Rp %s untuk kode ini', to_char(promo.min_order, 'FM999,999,999'));
        RETURN;
    END IF;
    
    IF promo.discount_type = 'percentage' THEN
        calc_discount := (p_order_amount * promo.discount_value / 100);
        IF promo.max_discount IS NOT NULL AND calc_discount > promo.max_discount THEN
            calc_discount := promo.max_discount;
        END IF;
    ELSE
        calc_discount := promo.discount_value;
    END IF;
    
    RETURN QUERY SELECT true, promo.id, promo.discount_type, promo.discount_value, promo.max_discount, calc_discount, 'Promo berhasil diterapkan!';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. SAMPLE DATA
-- =============================================

-- Sample testimonials
INSERT INTO testimonials (name, rank_from, rank_to, rating, comment, is_featured) VALUES
    ('Aldi R.', 'epic', 'mythic', 5, 'Cepat banget prosesnya! Dari Epic ke Mythic cuma 2 hari. Recommended!', true),
    ('Sinta M.', 'legend', 'mythicglory', 5, 'Boosternya pro, gak ada kendala sama sekali. Pasti order lagi!', true),
    ('Budi S.', 'grandmaster', 'legend', 5, 'Harga worth it, pelayanan ramah. Mantap!', true),
    ('Dewi K.', 'epic', 'legend', 5, 'Awalnya ragu, tapi ternyata beneran aman. Thanks ETNYX!', false),
    ('Raka P.', 'master', 'mythic', 4, 'Proses lancar, cuma agak lama dikit tapi hasilnya memuaskan.', false),
    ('Nina W.', 'warrior', 'epic', 5, 'Dari Warrior langsung Epic! Akun aman, winrate bagus.', false)
ON CONFLICT DO NOTHING;

-- Sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, max_discount, max_uses, expires_at) VALUES
    ('NEWUSER', 'percentage', 10, 50000, 100, NOW() + INTERVAL '30 days'),
    ('MYTHIC50', 'fixed', 50000, NULL, 50, NOW() + INTERVAL '14 days'),
    ('FLASH20', 'percentage', 20, 100000, 20, NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Sample portfolio
INSERT INTO portfolio (title, rank_from, rank_to, description) VALUES
    ('Push Rank Epic to Mythic', 'epic', 'mythic', 'Completed in 3 days with 78% winrate'),
    ('Legend to Mythic Glory', 'legend', 'mythicglory', 'Completed in 5 days with 82% winrate'),
    ('Grandmaster to Legend', 'grandmaster', 'legend', 'Completed in 2 days with 85% winrate')
ON CONFLICT DO NOTHING;
