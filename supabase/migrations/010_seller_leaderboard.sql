-- =============================================
-- SELLER LEADERBOARD FUNCTIONS
-- Top sellers by sales and views for current month
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
BEGIN
  -- Calculate start of current month
  month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN QUERY
  WITH seller_sales AS (
    SELECT 
      p.seller_id,
      COUNT(*)::INTEGER as items_sold
    FROM products p
    WHERE p.status = 'sold'
      AND p.updated_at >= month_start
      AND p.updated_at < month_start + INTERVAL '1 month'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_top_sellers_by_sales(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_sales(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_views(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_views(INTEGER) TO anon;

