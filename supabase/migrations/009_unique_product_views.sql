-- =============================================
-- UNIQUE PRODUCT VIEW TRACKING SYSTEM
-- =============================================

-- Create product_views table to track unique views per user/session
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For anonymous users
  ip_address VARCHAR(45), -- Store IP as additional tracking
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we track either user_id OR session_id
  CONSTRAINT check_viewer_identity CHECK (
    (user_id IS NOT NULL) OR (session_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_user_id ON product_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_product_views_session_id ON product_views(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- Create unique constraint to prevent duplicate views
-- For authenticated users: product_id + user_id must be unique
CREATE UNIQUE INDEX idx_unique_user_view ON product_views(product_id, user_id) 
  WHERE user_id IS NOT NULL;

-- For anonymous users: product_id + session_id must be unique
CREATE UNIQUE INDEX idx_unique_session_view ON product_views(product_id, session_id) 
  WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Enable RLS
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views (controlled by API)
CREATE POLICY "Anyone can record product views" 
  ON product_views FOR INSERT 
  WITH CHECK (true);

-- Policy: Anyone can view product views (for analytics)
CREATE POLICY "Product views are viewable by everyone" 
  ON product_views FOR SELECT 
  USING (true);

-- =============================================
-- UPDATED INCREMENT FUNCTION
-- Now checks for unique views before incrementing
-- =============================================

-- Drop the old function
DROP FUNCTION IF EXISTS increment_product_view_count(UUID);

-- Create new smart increment function that tracks unique views
CREATE OR REPLACE FUNCTION record_product_view(
  product_uuid UUID,
  viewer_user_id UUID DEFAULT NULL,
  viewer_session_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  view_recorded BOOLEAN := FALSE;
BEGIN
  -- Attempt to insert a new view record
  -- This will fail silently if the unique constraint is violated (duplicate view)
  BEGIN
    INSERT INTO product_views (product_id, user_id, session_id)
    VALUES (product_uuid, viewer_user_id, viewer_session_id);
    
    view_recorded := TRUE;
    
    -- If insert succeeded, increment the product's view_count
    UPDATE products 
    SET view_count = view_count + 1 
    WHERE id = product_uuid;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- View already recorded for this user/session, do nothing
      view_recorded := FALSE;
  END;
  
  RETURN view_recorded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION record_product_view(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION record_product_view(UUID, UUID, VARCHAR) TO anon;

-- =============================================
-- HELPER FUNCTION: Get view count by product
-- =============================================
CREATE OR REPLACE FUNCTION get_product_view_count(product_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  view_cnt INTEGER;
BEGIN
  SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, session_id))
  INTO view_cnt
  FROM product_views
  WHERE product_id = product_uuid;
  
  RETURN COALESCE(view_cnt, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_product_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_view_count(UUID) TO anon;

-- =============================================
-- SYNC EXISTING VIEW COUNTS (Optional)
-- This ensures products.view_count matches actual unique views
-- =============================================
-- Note: Since we don't have historical view data, we'll start fresh
-- The view_count will be accurate going forward

