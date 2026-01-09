-- Test queries to debug leaderboard issues

-- 1. Check if you have any sold products this month
SELECT 
  id, 
  title, 
  status, 
  sold_at,
  updated_at,
  seller_id
FROM products 
WHERE status = 'sold' 
  AND sold_at >= DATE_TRUNC('month', CURRENT_DATE);

-- 2. Check your views this month
SELECT 
  COUNT(DISTINCT pv.id) as total_views,
  p.seller_id
FROM product_views pv
INNER JOIN products p ON p.id = pv.product_id
WHERE pv.viewed_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND p.status = 'active'
GROUP BY p.seller_id;

-- 3. Check cache table
SELECT * FROM seller_leaderboard_cache
WHERE month = EXTRACT(MONTH FROM NOW())::INTEGER
  AND year = EXTRACT(YEAR FROM NOW())::INTEGER;

-- 4. Test the leaderboard functions directly
SELECT * FROM get_top_sellers_by_sales(10);
SELECT * FROM get_top_sellers_by_views(10);
