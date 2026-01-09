-- =============================================
-- ADD USERNAME FIELD
-- =============================================

-- Add username field to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Username should be alphanumeric, underscores, and at least 3 characters
-- This constraint is enforced at the application level for better error messages


