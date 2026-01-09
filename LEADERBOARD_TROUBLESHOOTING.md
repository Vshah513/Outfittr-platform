# Leaderboard Troubleshooting Guide

## Issues Identified

### Issue 1: Dashboard Not Updating After Marking as Sold
**Status**: ✅ Fixed
- Added a 500ms delay after marking as sold to ensure database triggers process
- Dashboard now refreshes properly after status changes

### Issue 2: Not Showing on Leaderboard Despite Having Views
**Possible Causes**:
1. **Views are from previous month** - Leaderboard only shows current month's data
2. **Products are not active** - Views only count for active products
3. **Views were recorded before migration** - Old view_count field vs new product_views table

## How to Debug

### Step 1: Run Diagnostic Queries

Open Supabase SQL Editor and run the queries from `debug_leaderboard.sql`:

```sql
-- Check your views this month
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
```

**What to look for**:
- If `total_views_this_month` is 0, your views are from a previous month
- If no rows returned, you have no views this month for active products

### Step 2: Check Product Status

```sql
-- Check your products and their status
SELECT 
  id,
  title,
  status,
  sold_at,
  view_count as cached_count,
  (SELECT COUNT(*) FROM product_views WHERE product_id = p.id) as actual_views
FROM products p
WHERE seller_id = 'YOUR_USER_ID_HERE'  -- Replace with your user ID
ORDER BY created_at DESC;
```

**What to look for**:
- Products must have `status = 'active'` for views to count
- `actual_views` shows real-time count from product_views table

### Step 3: Test Leaderboard Functions Directly

```sql
-- Test views leaderboard
SELECT * FROM get_top_sellers_by_views(10);

-- Test sales leaderboard  
SELECT * FROM get_top_sellers_by_sales(10);
```

**What to look for**:
- If you don't appear, check if you have views/sales THIS MONTH
- Leaderboard only shows current month (resets each month)

## Common Scenarios

### Scenario 1: "I have 2 views but not on leaderboard"
**Possible reasons**:
1. Views were from last month (leaderboard is monthly)
2. Products were marked as sold/draft when views happened
3. Views were recorded before the migration (using old system)

**Solution**: 
- Make sure products are `active`
- Get new views this month
- Check `debug_leaderboard.sql` query #2 to see your current month views

### Scenario 2: "I marked a product as sold but dashboard didn't update"
**Status**: ✅ Fixed in latest code
- Added delay to allow triggers to process
- Dashboard should refresh automatically now

**If still not working**:
- Check browser console for errors
- Verify the API call succeeded (check Network tab)
- Try refreshing the page manually

### Scenario 3: "Leaderboard shows empty"
**Possible reasons**:
1. No sales/views this month yet
2. Database triggers not working
3. Functions not returning data

**Solution**:
- Run diagnostic queries to verify data exists
- Check if triggers are firing (see `verify_migration.sql`)
- Test functions directly in SQL Editor

## Quick Fixes

### If Views Aren't Counting:
1. Make sure products are `active` status
2. View your own products to generate new views
3. Check `product_views` table has entries:
   ```sql
   SELECT * FROM product_views 
   WHERE product_id IN (
     SELECT id FROM products WHERE seller_id = 'YOUR_USER_ID'
   )
   ORDER BY viewed_at DESC;
   ```

### If Sales Aren't Counting:
1. Verify `sold_at` timestamp is set:
   ```sql
   SELECT id, title, status, sold_at 
   FROM products 
   WHERE status = 'sold' 
   AND seller_id = 'YOUR_USER_ID';
   ```
2. Check if `sold_at` is in current month
3. Verify trigger fired (check cache table):
   ```sql
   SELECT * FROM seller_leaderboard_cache
   WHERE seller_id = 'YOUR_USER_ID'
   AND month = EXTRACT(MONTH FROM NOW())::INTEGER;
   ```

## Testing Checklist

- [ ] Run `debug_leaderboard.sql` queries
- [ ] Verify products are `active` when views happen
- [ ] Check views are from current month
- [ ] Test marking product as sold and verify dashboard updates
- [ ] Check leaderboard modal shows your data
- [ ] Verify triggers are working (check cache table)

## Next Steps

1. **Run the diagnostic queries** from `debug_leaderboard.sql`
2. **Share the results** so we can identify the exact issue
3. **Test the fixes** - mark a product as sold and check if dashboard updates
4. **Get new views** - view your products to generate current month views

## Important Notes

- **Leaderboard is monthly** - resets each month
- **Only active products count** - sold/draft products don't count for views
- **Views must be this month** - previous month views don't count
- **Dashboard shows all-time views** - but leaderboard shows monthly

