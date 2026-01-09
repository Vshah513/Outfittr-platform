-- =============================================
-- SUPABASE AUTH INTEGRATION
-- =============================================

-- Add Supabase user ID link
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE 
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make phone_number optional (for future SMS integration)
ALTER TABLE users
  ALTER COLUMN phone_number DROP NOT NULL;

-- Update constraint: user must have Supabase ID or phone
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_must_have_contact;
ALTER TABLE users 
  ADD CONSTRAINT users_must_have_auth
  CHECK (supabase_user_id IS NOT NULL OR phone_number IS NOT NULL);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_user_id);

-- =============================================
-- SAVED ITEMS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_product ON saved_items(product_id);

-- =============================================
-- CLEANUP (Optional - run before production)
-- =============================================

-- Remove test users without Supabase auth
-- DELETE FROM users WHERE supabase_user_id IS NULL AND phone_number LIKE '+254%';

