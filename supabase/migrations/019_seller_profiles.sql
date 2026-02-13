-- =============================================
-- 019: Seller profiles and activation onboarding
-- One row per user who has started or completed seller onboarding
-- =============================================

CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  activated BOOLEAN NOT NULL DEFAULT false,
  display_name VARCHAR(100),
  email VARCHAR(255),
  mpesa_number VARCHAR(20),
  profile_photo_url TEXT,
  nairobi_area VARCHAR(100),
  meetup_zones TEXT[] NOT NULL DEFAULT '{}',
  delivery_preference VARCHAR(20) CHECK (delivery_preference IN ('pickup', 'delivery', 'both')),
  delivery_fee_range VARCHAR(50),
  legal_name VARCHAR(100),
  dob DATE,
  selfie_url TEXT,
  agreed_to_rules BOOLEAN NOT NULL DEFAULT false,
  trust_status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (trust_status IN ('new', 'standard')),
  onboarding_step SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_activated ON seller_profiles(activated);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_trust_status ON seller_profiles(trust_status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_seller_profiles_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_seller_profiles_updated_at ON seller_profiles;
CREATE TRIGGER trigger_seller_profiles_updated_at
  BEFORE UPDATE ON seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_profiles_updated_at();

-- RLS: users can only read/update their own seller profile (service role used in API routes)
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seller profile"
  ON seller_profiles FOR SELECT
  USING (auth.uid() IN (SELECT supabase_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert own seller profile"
  ON seller_profiles FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT supabase_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own seller profile"
  ON seller_profiles FOR UPDATE
  USING (auth.uid() IN (SELECT supabase_user_id FROM users WHERE id = user_id));
