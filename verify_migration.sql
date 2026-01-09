-- =============================================
-- VERIFICATION QUERIES FOR LEADERBOARD MIGRATION
-- Run these in Supabase SQL Editor to verify everything is set up correctly
-- =============================================

-- 1. Check if sold_at column exists in products table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'sold_at';

-- 2. Check if seller_leaderboard_cache table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seller_leaderboard_cache'
ORDER BY ordinal_position;

-- 3. Check if triggers exist (you already verified this ✓)
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_update_leaderboard_on_sale',
  'trigger_update_leaderboard_on_view'
);

-- 4. Check if leaderboard functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_top_sellers_by_sales',
  'get_top_sellers_by_views',
  'update_leaderboard_on_sale',
  'update_leaderboard_on_view'
)
AND routine_schema = 'public';

-- 5. Test: Check if any products have sold_at set (if you have sold products)
SELECT COUNT(*) as products_with_sold_at
FROM products
WHERE sold_at IS NOT NULL;

-- 6. Test: Check if cache table has any entries (will be empty until first sale/view)
SELECT COUNT(*) as cache_entries
FROM seller_leaderboard_cache;

