-- =============================================
-- FIX: Ambiguous Column References in Leaderboard Functions
-- The seller_id in RETURNS TABLE conflicts with CTE column names
-- Solution: Use explicit column aliasing in final SELECT
-- =============================================

-- Drop existing functions first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_top_sellers_by_sales(INTEGER);
DROP FUNCTION IF EXISTS get_top_sellers_by_views(INTEGER);

-- Function to get top sellers by items sold this month
CREATE OR REPLACE FUNCTION get_top_sellers_by_sales(
  p_limit_count INTEGER DEFAULT 10
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
  v_month_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate start of current month
  v_month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN QUERY
  WITH seller_sales AS (
    -- Use sold_at for accurate sales tracking
    SELECT 
      p.seller_id AS s_id,
      COUNT(*)::INTEGER AS sold_count
    FROM products p
    WHERE p.status = 'sold'
      AND p.sold_at >= v_month_start
      AND p.sold_at < v_month_start + INTERVAL '1 month'
    GROUP BY p.seller_id
  ),
  seller_info AS (
    SELECT 
      ss.s_id,
      ss.sold_count,
      u.full_name AS s_full_name,
      u.avatar_url AS s_avatar_url,
      u.location AS s_location,
      u.rating AS s_rating,
      COALESCE(f.fcount, 0)::BIGINT AS s_follower_count
    FROM seller_sales ss
    INNER JOIN users u ON u.id = ss.s_id
    LEFT JOIN (
      SELECT fo.seller_id AS f_seller_id, COUNT(*) AS fcount
      FROM follows fo
      GROUP BY fo.seller_id
    ) f ON f.f_seller_id = ss.s_id
  )
  SELECT 
    si.s_id AS seller_id,
    si.s_full_name AS full_name,
    si.s_avatar_url AS avatar_url,
    si.s_location AS location,
    si.sold_count AS items_sold,
    si.s_follower_count AS follower_count,
    si.s_rating AS rating,
    ROW_NUMBER() OVER (ORDER BY si.sold_count DESC, si.s_follower_count DESC)::INTEGER AS rank_position
  FROM seller_info si
  ORDER BY si.sold_count DESC, si.s_follower_count DESC
  LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top sellers by total views this month
-- Counts views on ALL products (active, sold, or draft) - views persist even after sale
CREATE OR REPLACE FUNCTION get_top_sellers_by_views(
  p_limit_count INTEGER DEFAULT 10
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
  v_month_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate start of current month
  v_month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN QUERY
  WITH seller_views AS (
    -- Count views on ALL products regardless of status (active, sold, draft)
    -- This ensures views are preserved even after a product is sold
    SELECT 
      p.seller_id AS s_id,
      COUNT(DISTINCT pv.id)::INTEGER AS view_count
    FROM product_views pv
    INNER JOIN products p ON p.id = pv.product_id
    WHERE pv.viewed_at >= v_month_start
      AND pv.viewed_at < v_month_start + INTERVAL '1 month'
    GROUP BY p.seller_id
  ),
  seller_info AS (
    SELECT 
      sv.s_id,
      sv.view_count,
      u.full_name AS s_full_name,
      u.avatar_url AS s_avatar_url,
      u.location AS s_location,
      u.rating AS s_rating,
      COALESCE(f.fcount, 0)::BIGINT AS s_follower_count
    FROM seller_views sv
    INNER JOIN users u ON u.id = sv.s_id
    LEFT JOIN (
      SELECT fo.seller_id AS f_seller_id, COUNT(*) AS fcount
      FROM follows fo
      GROUP BY fo.seller_id
    ) f ON f.f_seller_id = sv.s_id
  )
  SELECT 
    si.s_id AS seller_id,
    si.s_full_name AS full_name,
    si.s_avatar_url AS avatar_url,
    si.s_location AS location,
    si.view_count AS total_views,
    si.s_follower_count AS follower_count,
    si.s_rating AS rating,
    ROW_NUMBER() OVER (ORDER BY si.view_count DESC, si.s_follower_count DESC)::INTEGER AS rank_position
  FROM seller_info si
  ORDER BY si.view_count DESC, si.s_follower_count DESC
  LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_top_sellers_by_sales(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_sales(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_views(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers_by_views(INTEGER) TO anon;

