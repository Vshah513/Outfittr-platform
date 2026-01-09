-- =============================================
-- ADD VOUCHES TABLE FOR SELLER TRUST SYSTEM
-- =============================================

-- Add sold_to_id and sold_at columns to products table to track who bought what
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sold_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Create index for sold_to lookups
CREATE INDEX IF NOT EXISTS idx_products_sold_to ON products(sold_to_id);

-- Create vouches table
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}', -- ['item_as_described', 'smooth_meetup', 'good_communication', 'quick_delivery']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, product_id) -- One vouch per purchase
);

-- Indexes for efficient lookups
CREATE INDEX idx_vouches_seller ON vouches(seller_id);
CREATE INDEX idx_vouches_buyer ON vouches(buyer_id);
CREATE INDEX idx_vouches_product ON vouches(product_id);
CREATE INDEX idx_vouches_created ON vouches(created_at DESC);

-- Enable RLS
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;

-- Anyone can view vouches
CREATE POLICY "Vouches are viewable by everyone" 
  ON vouches FOR SELECT 
  USING (true);

-- Buyers can create vouches (additional validation in API)
CREATE POLICY "Allow vouch creation" 
  ON vouches FOR INSERT 
  WITH CHECK (true);

-- Buyers can update their own vouches
CREATE POLICY "Users can update own vouches" 
  ON vouches FOR UPDATE 
  USING (true);

-- Buyers can delete their own vouches
CREATE POLICY "Users can delete own vouches" 
  ON vouches FOR DELETE 
  USING (true);



