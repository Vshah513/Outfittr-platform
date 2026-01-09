-- =============================================
-- ADD EMAIL AUTHENTICATION SUPPORT
-- =============================================

-- Add email authentication fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ALTER COLUMN phone_number DROP NOT NULL;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add constraint: user must have either phone_number or email
ALTER TABLE users 
  ADD CONSTRAINT users_must_have_contact 
  CHECK (phone_number IS NOT NULL OR email IS NOT NULL);

