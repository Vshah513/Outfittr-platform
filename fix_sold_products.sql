-- =============================================
-- FIX EXISTING SOLD PRODUCTS AND UPDATE TRIGGER
-- Run this AFTER running the updated migration
-- =============================================

-- Step 1: Update trigger (simplified condition)
DROP TRIGGER IF EXISTS trigger_update_leaderboard_on_sale ON products;
CREATE TRIGGER trigger_update_leaderboard_on_sale
BEFORE UPDATE ON products
FOR EACH ROW
WHEN (NEW.status != OLD.status)
EXECUTE FUNCTION update_leaderboard_on_sale();

-- Step 2: Fix existing sold products that don't have sold_at set
UPDATE products
SET sold_at = updated_at
WHERE status = 'sold' 
  AND sold_at IS NULL;

-- Step 3: Rebuild cache for current month (for products sold this month)
DELETE FROM seller_leaderboard_cache
WHERE month = EXTRACT(MONTH FROM NOW())::INTEGER
  AND year = EXTRACT(YEAR FROM NOW())::INTEGER;

-- Re-insert correct counts
INSERT INTO seller_leaderboard_cache (seller_id, items_sold, month, year)
SELECT 
  p.seller_id,
  COUNT(*)::INTEGER as items_sold,
  EXTRACT(MONTH FROM NOW())::INTEGER as month,
  EXTRACT(YEAR FROM NOW())::INTEGER as year
FROM products p
WHERE p.status = 'sold'
  AND p.sold_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND p.sold_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY p.seller_id
ON CONFLICT (seller_id, month, year) 
DO UPDATE SET 
  items_sold = EXCLUDED.items_sold,
  last_updated = NOW();

-- Step 4: Verify the fix
SELECT 
  '=== Sold Products Check ===' as check_type,
  COUNT(*) as total_sold,
  COUNT(CASE WHEN sold_at IS NOT NULL THEN 1 END) as with_sold_at,
  COUNT(CASE WHEN sold_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as sold_this_month
FROM products
WHERE status = 'sold';

SELECT 
  '=== Cache Check ===' as check_type,
  seller_id,
  items_sold,
  month,
  year
FROM seller_leaderboard_cache
WHERE month = EXTRACT(MONTH FROM NOW())::INTEGER
  AND year = EXTRACT(YEAR FROM NOW())::INTEGER
ORDER BY items_sold DESC;

SELECT 
  '=== Leaderboard Test ===' as check_type;
SELECT * FROM get_top_sellers_by_sales(10);

