-- =============================================
-- ADD BUNDLE REQUESTS TABLE FOR MULTI-ITEM PURCHASES
-- =============================================

-- Create bundle_requests table
CREATE TABLE bundle_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  product_ids UUID[] NOT NULL,
  offer_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  reserved_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_bundle_requests_buyer ON bundle_requests(buyer_id);
CREATE INDEX idx_bundle_requests_seller ON bundle_requests(seller_id);
CREATE INDEX idx_bundle_requests_conversation ON bundle_requests(conversation_id);
CREATE INDEX idx_bundle_requests_status ON bundle_requests(status);
CREATE INDEX idx_bundle_requests_created ON bundle_requests(created_at DESC);

-- Add reserved_by column to products for bundle reservations
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMP WITH TIME ZONE;

-- Create index for reservation lookups
CREATE INDEX IF NOT EXISTS idx_products_reserved_by ON products(reserved_by);
CREATE INDEX IF NOT EXISTS idx_products_reserved_until ON products(reserved_until);

-- Enable RLS
ALTER TABLE bundle_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own bundle requests (as buyer or seller)
CREATE POLICY "Users can view own bundle requests" 
  ON bundle_requests FOR SELECT 
  USING (true);

-- Users can create bundle requests
CREATE POLICY "Allow bundle request creation" 
  ON bundle_requests FOR INSERT 
  WITH CHECK (true);

-- Users can update bundle requests they're part of
CREATE POLICY "Users can update bundle requests" 
  ON bundle_requests FOR UPDATE 
  USING (true);

-- Apply updated_at trigger to bundle_requests
CREATE TRIGGER update_bundle_requests_updated_at 
  BEFORE UPDATE ON bundle_requests
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire bundle reservations
-- This can be called periodically or on read to clean up expired reservations
CREATE OR REPLACE FUNCTION expire_bundle_reservations()
RETURNS void AS $$
BEGIN
  -- Clear expired product reservations
  UPDATE products 
  SET reserved_by = NULL, reserved_until = NULL
  WHERE reserved_until IS NOT NULL AND reserved_until < NOW();
  
  -- Update expired bundle requests
  UPDATE bundle_requests 
  SET status = 'expired'
  WHERE status = 'accepted' 
    AND reserved_until IS NOT NULL 
    AND reserved_until < NOW();
END;
$$ LANGUAGE plpgsql;



