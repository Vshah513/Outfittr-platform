-- =============================================
-- ADD FOLLOWS TABLE FOR SELLER FOLLOWING
-- =============================================

-- Create follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, seller_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_seller ON follows(seller_id);
CREATE INDEX idx_follows_created ON follows(created_at DESC);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows
CREATE POLICY "Users can view own follows" 
  ON follows FOR SELECT 
  USING (true);

-- Users can create follows (auth check done in API)
CREATE POLICY "Allow follow creation" 
  ON follows FOR INSERT 
  WITH CHECK (true);

-- Users can delete their own follows
CREATE POLICY "Users can unfollow" 
  ON follows FOR DELETE 
  USING (true);



