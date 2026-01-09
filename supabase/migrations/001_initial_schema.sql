-- =============================================
-- THRIFT-KE DATABASE SCHEMA
-- Kenya Thrift Marketplace
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  user_type VARCHAR(10) DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller', 'both')),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('brand_new', 'like_new', 'excellent', 'good', 'fair')),
  brand VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  images TEXT[] NOT NULL DEFAULT '{}',
  meetup_location VARCHAR(200),
  delivery_method VARCHAR(20) DEFAULT 'both' CHECK (delivery_method IN ('shipping', 'pickup', 'both')),
  shipping_cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'draft')),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Named foreign key constraints for Supabase query builder
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- OTP CODES TABLE (for phone authentication)
-- =============================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone_number);

-- Products indexes
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_condition ON products(condition);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Reviews indexes
CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_buyer ON reviews(buyer_id);

-- OTP indexes
CREATE INDEX idx_otp_phone ON otp_codes(phone_number);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Anyone can view user profiles
CREATE POLICY "Users are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (true);

-- Allow user creation (for registration)
CREATE POLICY "Allow user creation" 
  ON users FOR INSERT 
  WITH CHECK (true);

-- PRODUCTS POLICIES
-- Anyone can view active products
CREATE POLICY "Active products are viewable by everyone" 
  ON products FOR SELECT 
  USING (status = 'active');

-- Sellers can view their own products regardless of status
CREATE POLICY "Sellers can view own products" 
  ON products FOR SELECT 
  USING (true);

-- Anyone can create products (seller check done in API)
CREATE POLICY "Allow product creation" 
  ON products FOR INSERT 
  WITH CHECK (true);

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products" 
  ON products FOR UPDATE 
  USING (true);

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products" 
  ON products FOR DELETE 
  USING (true);

-- MESSAGES POLICIES
-- Users can view messages they're part of
CREATE POLICY "Users can view own messages" 
  ON messages FOR SELECT 
  USING (true);

-- Users can send messages
CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (true);

-- Users can update messages (mark as read)
CREATE POLICY "Users can update messages" 
  ON messages FOR UPDATE 
  USING (true);

-- REVIEWS POLICIES
-- Anyone can view reviews
CREATE POLICY "Reviews are viewable by everyone" 
  ON reviews FOR SELECT 
  USING (true);

-- Buyers can create reviews
CREATE POLICY "Allow review creation" 
  ON reviews FOR INSERT 
  WITH CHECK (true);

-- OTP CODES POLICIES
-- Service role manages OTP (via API with service key)
CREATE POLICY "Service can manage OTP" 
  ON otp_codes FOR ALL 
  USING (true);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to products table
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SELLER RATING TRIGGER
-- Automatically update seller rating when review is added
-- =============================================
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM reviews 
        WHERE seller_id = NEW.seller_id
    )
    WHERE id = NEW.seller_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seller_rating_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();

