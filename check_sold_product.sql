-- =============================================
-- CHECK WHY SOLD PRODUCTS AREN'T SHOWING IN LEADERBOARD
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check all your sold products and their sold_at timestamps
SELECT 
  id,
  title,
  status,
  sold_at,
  updated_at,
  seller_id,
  CASE 
    WHEN sold_at IS NULL THEN '❌ sold_at is NULL - TRIGGER DID NOT FIRE'
    WHEN sold_at >= DATE_TRUNC('month', CURRENT_DATE) THEN '✅ This month - SHOULD APPEAR'
    ELSE '⚠️ Previous month - will not appear'
  END as leaderboard_status
FROM products 
WHERE status = 'sold'
ORDER BY updated_at DESC;

-- 2. Check if cache table has your entry
SELECT 
  slc.*,
  u.full_name,
  CASE 
    WHEN slc.month = EXTRACT(MONTH FROM NOW())::INTEGER 
     AND slc.year = EXTRACT(YEAR FROM NOW())::INTEGER 
    THEN '✅ Current month'
    ELSE '⚠️ Different month'
  END as cache_status
FROM seller_leaderboard_cache slc
INNER JOIN users u ON u.id = slc.seller_id
ORDER BY slc.year DESC, slc.month DESC, slc.items_sold DESC;

-- 3. Test the leaderboard function directly
SELECT '=== Testing get_top_sellers_by_sales ===' as test;
SELECT * FROM get_top_sellers_by_sales(10);

-- 4. Check what the function is actually querying
SELECT 
  p.id,
  p.title,
  p.status,
  p.sold_at,
  p.seller_id,
  u.full_name,
  DATE_TRUNC('month', CURRENT_DATE) as month_start,
  CASE 
    WHEN p.sold_at >= DATE_TRUNC('month', CURRENT_DATE) 
     AND p.sold_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    THEN '✅ Will be counted'
    ELSE '❌ Will NOT be counted'
  END as will_count
FROM products p
INNER JOIN users u ON u.id = p.seller_id
WHERE p.status = 'sold'
ORDER BY p.sold_at DESC NULLS LAST;

-- 5. Count sales per seller for current month (what leaderboard should show)
SELECT 
  p.seller_id,
  u.full_name,
  COUNT(*) as items_sold_this_month
FROM products p
INNER JOIN users u ON u.id = p.seller_id
WHERE p.status = 'sold'
  AND p.sold_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND p.sold_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY p.seller_id, u.full_name
ORDER BY items_sold_this_month DESC;

