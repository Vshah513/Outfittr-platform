-- =============================================
-- REAL-TIME SELLER LEADERBOARD SYSTEM
-- Adds sold_at tracking, cache table, and triggers
-- =============================================

-- Step 1: Add sold_at column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_sold_at ON products(sold_at DESC) 
WHERE sold_at IS NOT NULL;

-- Backfill existing sold products with updated_at as sold_at
UPDATE products 
SET sold_at = updated_at 
WHERE status = 'sold' AND sold_at IS NULL;

-- =============================================
-- Step 2: Create Leaderboard Cache Table
-- =============================================
CREATE TABLE IF NOT EXISTS seller_leaderboard_cache (
  seller_id UUID NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  items_sold INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (seller_id, month, year),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_month_year ON seller_leaderboard_cache(year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_seller ON seller_leaderboard_cache(seller_id);

-- Enable RLS
ALTER TABLE seller_leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read leaderboard cache
CREATE POLICY "Leaderboard cache is viewable by everyone" 
  ON seller_leaderboard_cache FOR SELECT 
  USING (true);

-- =============================================
-- Step 3: Create Trigger Functions
-- =============================================

-- Function to update leaderboard cache when product is sold
CREATE OR REPLACE FUNCTION update_leaderboard_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  sold_month INTEGER;
  sold_year INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- When product is marked as sold
  IF NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold') THEN
    -- Set sold_at timestamp (always set it to ensure it's current)
    NEW.sold_at := NOW();
    
    -- Increment sales count for current month
    INSERT INTO seller_leaderboard_cache (seller_id, items_sold, month, year)
    VALUES (NEW.seller_id, 1, current_month, current_year)
    ON CONFLICT (seller_id, month, year) 
    DO UPDATE SET 
      items_sold = seller_leaderboard_cache.items_sold + 1,
      last_updated = NOW();
  END IF;
  
  -- When product is unmarked as sold (status changes from sold to active/draft)
  IF OLD.status = 'sold' AND NEW.status != 'sold' THEN
    -- Clear sold_at timestamp
    NEW.sold_at := NULL;
    
    -- Decrement sales count for the month when it was sold
    IF OLD.sold_at IS NOT NULL THEN
      sold_month := EXTRACT(MONTH FROM OLD.sold_at)::INTEGER;
      sold_year := EXTRACT(YEAR FROM OLD.sold_at)::INTEGER;
      
      UPDATE seller_leaderboard_cache
      SET 
        items_sold = GREATEST(0, items_sold - 1),
        last_updated = NOW()
      WHERE seller_id = NEW.seller_id
        AND month = sold_month
        AND year = sold_year;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product status changes
DROP TRIGGER IF EXISTS trigger_update_leaderboard_on_sale ON products;
CREATE TRIGGER trigger_update_leaderboard_on_sale
BEFORE UPDATE ON products
FOR EACH ROW
WHEN (NEW.status != OLD.status)
EXECUTE FUNCTION update_leaderboard_on_sale();

-- Function to update leaderboard cache when view is recorded
CREATE OR REPLACE FUNCTION update_leaderboard_on_view()
RETURNS TRIGGER AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  product_seller_id UUID;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- Get the seller_id for this product
  SELECT seller_id INTO product_seller_id
  FROM products
  WHERE id = NEW.product_id AND status = 'active';
  
  -- Only update if product is active
  IF product_seller_id IS NOT NULL THEN
    -- Increment views count for seller in current month
    INSERT INTO seller_leaderboard_cache (seller_id, total_views, month, year)
    VALUES (product_seller_id, 1, current_month, current_year)
    ON CONFLICT (seller_id, month, year) 
    DO UPDATE SET 
      total_views = seller_leaderboard_cache.total_views + 1,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new product views
DROP TRIGGER IF EXISTS trigger_update_leaderboard_on_view ON product_views;
CREATE TRIGGER trigger_update_leaderboard_on_view
AFTER INSERT ON product_views
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_on_view();

-- =============================================
-- Step 4: Update Leaderboard Functions
-- =============================================

-- Function to get top sellers by items sold this month
CREATE OR REPLACE FUNCTION get_top_sellers_by_sales(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  seller_id UUID,
  full_name VARCHAR,
  avatar_url TEXT,
  location VARCHAR,
  items_sold INTEGER,
  follower_count BIGINT,
  rating DECIMAL,
  rank_position INTEGER
) AS $$
DECLARE
  month_start TIMESTAMP WITH TIME ZONE;
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  -- Calculate start of current month
  month_start := DATE_TRUNC('month', CURRENT_DATE);
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  RETURN QUERY
  WITH seller_sales AS (
    -- Use sold_at instead of updated_at for accurate sales tracking
    SELECT 
      p.seller_id,
      COUNT(*)::INTEGER as items_sold
    FROM products p
    WHERE p.status = 'sold'
      AND p.sold_at >= month_start
      AND p.sold_at < month_start + INTERVAL '1 month'
    GROUP BY p.seller_id
  ),
  seller_info AS (
    SELECT 
      ss.seller_id,
      ss.items_sold,
      u.full_name,
      u.avatar_url,
      u.location,
      u.rating,
      COALESCE(f.follower_count, 0)::BIGINT as follower_count
    FROM seller_sales ss
    INNER JOIN users u ON u.id = ss.seller_id
    LEFT JOIN (
      SELECT seller_id, COUNT(*) as follower_count
      FROM follows
      GROUP BY seller_id
    ) f ON f.seller_id = ss.seller_id
  )
  SELECT 
    si.seller_id,
    si.full_name,
    si.avatar_url,
    si.location,
    si.items_sold,
    si.follower_count,
    si.rating,
    ROW_NUMBER() OVER (ORDER BY si.items_sold DESC, si.follower_count DESC)::INTEGER as rank_position
  FROM seller_info si
  ORDER BY si.items_sold DESC, si.follower_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top sellers by total views this month
CREATE OR REPLACE FUNCTION get_top_sellers_by_views(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  seller_id UUID,
  full_name VARCHAR,
  avatar_url TEXT,
  location VARCHAR,
  total_views INTEGER,
  follower_count BIGINT,
  rating DECIMAL,
  rank_position INTEGER
) AS $$
DECLARE
  month_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate start of current month
  month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN QUERY
  WITH seller_views AS (
    SELECT 
      p.seller_id,
      COUNT(DISTINCT pv.id)::INTEGER as total_views
    FROM product_views pv
    INNER JOIN products p ON p.id = pv.product_id
    WHERE pv.viewed_at >= month_start
      AND pv.viewed_at < month_start + INTERVAL '1 month'
      AND p.status = 'active'
    GROUP BY p.seller_id
  ),
  seller_info AS (
    SELECT 
      sv.seller_id,
      sv.total_views,
      u.full_name,
      u.avatar_url,
      u.location,
      u.rating,
      COALESCE(f.follower_count, 0)::BIGINT as follower_count
    FROM seller_views sv
    INNER JOIN users u ON u.id = sv.seller_id
    LEFT JOIN (
      SELECT seller_id, COUNT(*) as follower_count
      FROM follows
      GROUP BY seller_id
    ) f ON f.seller_id = sv.seller_id
  )
  SELECT 
    si.seller_id,
    si.full_name,
    si.avatar_url,
    si.location,
    si.total_views,
    si.follower_count,
    si.rating,
    ROW_NUMBER() OVER (ORDER BY si.total_views DESC, si.follower_count DESC)::INTEGER as rank_position
  FROM seller_info si
  ORDER BY si.total_views DESC, si.follower_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions (already granted, but ensure they exist)
GRANT EXECUTE ON FUNCTION get_top_sellers_by_sales(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_sales(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_views(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_views(INTEGER) TO anon;

