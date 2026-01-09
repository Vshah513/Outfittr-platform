-- =============================================
-- DEBUG QUERIES FOR LEADERBOARD ISSUES
-- Run these in Supabase SQL Editor to diagnose problems
-- =============================================

-- 1. Check if you have any sold products this month
SELECT 
  id, 
  title, 
  status, 
  sold_at,
  updated_at,
  seller_id,
  CASE 
    WHEN sold_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 'This month'
    WHEN sold_at IS NOT NULL THEN 'Previous month'
    ELSE 'Not sold'
  END as sale_period
FROM products 
WHERE status = 'sold'
ORDER BY sold_at DESC NULLS LAST;

-- 2. Check your views this month (for active products only)
SELECT 
  COUNT(DISTINCT pv.id) as total_views_this_month,
  p.seller_id,
  u.full_name
FROM product_views pv
INNER JOIN products p ON p.id = pv.product_id
INNER JOIN users u ON u.id = p.seller_id
WHERE pv.viewed_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND p.status = 'active'
GROUP BY p.seller_id, u.full_name;

-- 3. Check ALL your views (including inactive products)
SELECT 
  COUNT(DISTINCT pv.id) as total_views_all_time,
  p.seller_id,
  u.full_name,
  p.status,
  COUNT(DISTINCT p.id) as product_count
FROM product_views pv
INNER JOIN products p ON p.id = pv.product_id
INNER JOIN users u ON u.id = p.seller_id
GROUP BY p.seller_id, u.full_name, p.status
ORDER BY total_views_all_time DESC;

-- 4. Check cache table entries
SELECT 
  seller_id,
  month,
  year,
  items_sold,
  total_views,
  last_updated
FROM seller_leaderboard_cache
ORDER BY year DESC, month DESC, items_sold DESC, total_views DESC;

-- 5. Test the leaderboard functions directly
SELECT '=== TOP SELLERS BY SALES ===' as info;
SELECT * FROM get_top_sellers_by_sales(10);

SELECT '=== TOP SELLERS BY VIEWS ===' as info;
SELECT * FROM get_top_sellers_by_views(10);

-- 6. Check if triggers are working - see recent product updates
SELECT 
  id,
  title,
  status,
  sold_at,
  updated_at,
  seller_id
FROM products
WHERE updated_at >= NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- 7. Check if product_views table has entries
SELECT 
  COUNT(*) as total_view_records,
  COUNT(DISTINCT product_id) as unique_products_viewed,
  COUNT(DISTINCT user_id) as unique_users_viewed,
  COUNT(DISTINCT session_id) as unique_sessions
FROM product_views;

-- 8. Check your specific user's products and their status
SELECT 
  p.id,
  p.title,
  p.status,
  p.sold_at,
  p.view_count as cached_view_count,
  COUNT(DISTINCT pv.id) as actual_view_count_from_table
FROM products p
LEFT JOIN product_views pv ON pv.product_id = p.id
WHERE p.seller_id = (SELECT id FROM users LIMIT 1) -- Replace with your user ID
GROUP BY p.id, p.title, p.status, p.sold_at, p.view_count
ORDER BY p.created_at DESC;

