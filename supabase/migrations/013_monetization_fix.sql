-- =============================================
-- FIX: Drop and recreate monetization tables
-- Run this if you got the "column does not exist" error
-- =============================================

-- Drop existing tables (if they exist) in reverse dependency order
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS product_boosts CASCADE;
DROP TABLE IF EXISTS seller_plans CASCADE;
DROP TABLE IF EXISTS boost_packages CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS get_seller_plan(UUID) CASCADE;
DROP FUNCTION IF EXISTS count_seller_active_listings(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_seller_create_listing(UUID) CASCADE;
DROP FUNCTION IF EXISTS deactivate_expired_boosts() CASCADE;
DROP FUNCTION IF EXISTS update_seller_plans_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_payment_transactions_updated_at() CASCADE;

-- =============================================
-- NOW CREATE EVERYTHING FRESH
-- =============================================

CREATE TABLE subscription_tiers (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_kes INTEGER NOT NULL,
  active_listings_limit INTEGER,
  features JSONB DEFAULT '[]',
  paystack_plan_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO subscription_tiers (id, name, price_kes, active_listings_limit, features) VALUES
  ('free', 'Free', 0, 25, '["Basic selling", "Up to 25 active listings"]'),
  ('base', 'Base', 400, 100, '["Up to 100 active listings", "Basic analytics", "Priority in search"]'),
  ('growth', 'Growth', 1000, 300, '["Up to 300 active listings", "Advanced analytics", "Bulk upload tools", "Auto-relist", "Trending badge eligibility"]'),
  ('pro', 'Pro', 4000, NULL, '["Unlimited listings", "Priority support", "Featured seller badge", "Demand insights dashboard", "All Growth features"]')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE seller_plans (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier_id VARCHAR(20) NOT NULL DEFAULT 'free' REFERENCES subscription_tiers(id),
  payment_provider VARCHAR(20) DEFAULT 'paystack',
  paystack_customer_code VARCHAR(100),
  paystack_subscription_code VARCHAR(100),
  paystack_email_token VARCHAR(100),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seller_plans_tier ON seller_plans(tier_id);
CREATE INDEX idx_seller_plans_paystack_customer ON seller_plans(paystack_customer_code);
CREATE INDEX idx_seller_plans_paystack_subscription ON seller_plans(paystack_subscription_code);
CREATE INDEX idx_seller_plans_period_end ON seller_plans(current_period_end);

CREATE TABLE boost_packages (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  duration_hours INTEGER NOT NULL,
  price_kes INTEGER NOT NULL,
  boost_type VARCHAR(30) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO boost_packages (id, name, duration_hours, price_kes, boost_type, description) VALUES
  ('boost_24h', 'Quick Boost', 24, 50, 'top_category', 'Your listing appears at the top of its category for 24 hours'),
  ('boost_7d', 'Weekly Boost', 168, 200, 'top_category', 'Your listing appears at the top of its category for 7 days'),
  ('boost_30d', 'Featured', 720, 600, 'homepage_carousel', 'Premium visibility: Homepage carousel + top of category for 30 days')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE product_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id VARCHAR(20) NOT NULL REFERENCES boost_packages(id),
  boost_type VARCHAR(30) NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  payment_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_boosts_product ON product_boosts(product_id);
CREATE INDEX idx_product_boosts_seller ON product_boosts(seller_id);
CREATE INDEX idx_product_boosts_active ON product_boosts(is_active, ends_at);
CREATE INDEX idx_product_boosts_type ON product_boosts(boost_type, is_active);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type VARCHAR(20) NOT NULL,
  payment_provider VARCHAR(20) NOT NULL DEFAULT 'paystack',
  amount_kes INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paystack_reference VARCHAR(100),
  paystack_transaction_id VARCHAR(100),
  mpesa_receipt_number VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_paystack_ref ON payment_transactions(paystack_reference);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Subscription tiers are viewable by everyone" ON subscription_tiers FOR SELECT USING (true);

CREATE POLICY "Seller plans are viewable by everyone" ON seller_plans FOR SELECT USING (true);
CREATE POLICY "Users can insert their own plan" ON seller_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own plan" ON seller_plans FOR UPDATE USING (true);

CREATE POLICY "Boost packages are viewable by everyone" ON boost_packages FOR SELECT USING (true);

CREATE POLICY "Product boosts are viewable by everyone" ON product_boosts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own boosts" ON product_boosts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own boosts" ON product_boosts FOR UPDATE USING (true);

CREATE POLICY "Users can view their own transactions" ON payment_transactions FOR SELECT USING (true);
CREATE POLICY "Service can insert transactions" ON payment_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update transactions" ON payment_transactions FOR UPDATE USING (true);

-- Functions
CREATE OR REPLACE FUNCTION get_seller_plan(p_seller_id UUID)
RETURNS TABLE (
  tier_id VARCHAR(20),
  tier_name VARCHAR(50),
  price_kes INTEGER,
  active_listings_limit INTEGER,
  features JSONB,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(sp.tier_id, 'free')::VARCHAR(20) as tier_id,
    st.name as tier_name,
    st.price_kes,
    st.active_listings_limit,
    st.features,
    sp.current_period_end,
    CASE 
      WHEN sp.tier_id = 'free' THEN true
      WHEN sp.current_period_end IS NULL THEN false
      WHEN sp.current_period_end > NOW() THEN true
      ELSE false
    END as is_active
  FROM subscription_tiers st
  LEFT JOIN seller_plans sp ON sp.tier_id = st.id AND sp.seller_id = p_seller_id
  WHERE st.id = COALESCE(sp.tier_id, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_seller_active_listings(p_seller_id UUID)
RETURNS INTEGER AS $$
DECLARE
  listing_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO listing_count
  FROM products
  WHERE seller_id = p_seller_id AND status = 'active';
  RETURN listing_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_seller_create_listing(p_seller_id UUID)
RETURNS TABLE (
  can_create BOOLEAN,
  current_count INTEGER,
  listing_limit INTEGER,
  tier_id VARCHAR(20)
) AS $$
DECLARE
  v_tier_id VARCHAR(20);
  v_limit INTEGER;
  v_count INTEGER;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT COALESCE(sp.tier_id, 'free'), st.active_listings_limit, sp.current_period_end
  INTO v_tier_id, v_limit, v_period_end
  FROM subscription_tiers st
  LEFT JOIN seller_plans sp ON sp.tier_id = st.id AND sp.seller_id = p_seller_id
  WHERE st.id = COALESCE(sp.tier_id, 'free');
  
  IF v_tier_id != 'free' AND (v_period_end IS NULL OR v_period_end < NOW()) THEN
    v_tier_id := 'free';
    SELECT active_listings_limit INTO v_limit FROM subscription_tiers WHERE id = 'free';
  END IF;
  
  v_count := count_seller_active_listings(p_seller_id);
  
  RETURN QUERY SELECT 
    (v_limit IS NULL OR v_count < v_limit) as can_create,
    v_count as current_count,
    v_limit as listing_limit,
    v_tier_id as tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deactivate_expired_boosts()
RETURNS INTEGER AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE product_boosts SET is_active = false WHERE is_active = true AND ends_at < NOW();
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE OR REPLACE FUNCTION update_seller_plans_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seller_plans_updated_at BEFORE UPDATE ON seller_plans FOR EACH ROW EXECUTE FUNCTION update_seller_plans_updated_at();

CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Permissions
GRANT EXECUTE ON FUNCTION get_seller_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_seller_plan(UUID) TO anon;
GRANT EXECUTE ON FUNCTION count_seller_active_listings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_seller_active_listings(UUID) TO anon;
GRANT EXECUTE ON FUNCTION can_seller_create_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_seller_create_listing(UUID) TO anon;

