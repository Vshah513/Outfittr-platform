# Seller Leaderboard Real-Time Update Plan

## Current State Analysis

### How Sales Are Currently Tracked
- Products have a `status` field: `'active'`, `'sold'`, or `'draft'`
- When a seller marks a product as sold (via PUT `/api/products/[id]` with `status: 'sold'`), the `updated_at` timestamp is automatically updated
- Current leaderboard function `get_top_sellers_by_sales` counts products with:
  - `status = 'sold'`
  - `updated_at` within the current month
- **Issue**: The leaderboard only counts sales from the current month based on `updated_at`, not when the sale actually happened

### How Views Are Currently Tracked
- `product_views` table tracks unique views per user/session
- Each view is recorded with `product_id`, `user_id` (or `session_id`), and `viewed_at` timestamp
- Current leaderboard function `get_top_sellers_by_views` counts:
  - Distinct views from `product_views` table
  - For active products only
  - Within the current month
- **Current Implementation**: Option B - Sellers with most views (all products combined)

### Seller Dashboard Data
The dashboard shows:
- **Active Listings**: Count of products with `status = 'active'`
- **Total Views**: Sum of `view_count` from active products (this is a cached count, not real-time from `product_views`)
- **Total Earnings**: Sum of prices from sold products
- **Messages**: Unread message count

## Recommendation: Views Strategy

### **I recommend Option B: Sellers with the most views (all products combined)**

**Reasons:**
1. **Fairness**: Rewards sellers who consistently create quality listings, not just one viral product
2. **Consistency**: Matches the sales leaderboard approach (aggregate seller performance)
3. **Motivation**: Encourages sellers to maintain multiple active listings
4. **Current Implementation**: Already implemented this way, so less work needed

**However**, if you want to showcase individual products, we could add a separate "Trending Products" section that shows individual products with most views, separate from the seller leaderboard.

## Implementation Plan

### Phase 1: Fix Sales Tracking (Critical)

**Problem**: Currently using `updated_at` to determine when a sale happened, but `updated_at` changes on any product update, not just when marked as sold.

**Solution**: Add a `sold_at` timestamp field to track when products were actually sold.

**Steps:**
1. Create migration to add `sold_at TIMESTAMP WITH TIME ZONE` column to `products` table
2. Update the `PUT /api/products/[id]` endpoint to set `sold_at = NOW()` when status changes to 'sold'
3. Update `get_top_sellers_by_sales` function to use `sold_at` instead of `updated_at`
4. Backfill existing sold products with `sold_at = updated_at` (for historical data)

### Phase 2: Real-Time Leaderboard Updates

**Current Issue**: Leaderboard is calculated on-demand when the modal is opened, but doesn't update automatically.

**Solution Options:**

#### Option A: Database Triggers (Recommended)
- Create database triggers that automatically update a cached leaderboard table when:
  - A product is marked as sold (`sold_at` is set)
  - A new view is recorded in `product_views`
- Create a `seller_leaderboard_cache` table that stores pre-calculated rankings
- Leaderboard API reads from cache (fast, always up-to-date)

#### Option B: Webhooks/Event System
- When a sale happens or view is recorded, trigger a webhook
- Background job recalculates leaderboard
- More complex, requires job queue system

**Recommendation**: Use Option A (Database Triggers) for simplicity and reliability.

### Phase 3: Improve Views Calculation

**Current Issue**: Dashboard shows `view_count` (cached) but leaderboard uses `product_views` table (real-time). Need consistency.

**Solution:**
1. Update dashboard to use real-time view counts from `product_views` table
2. Ensure leaderboard uses the same calculation method
3. Optionally: Keep `view_count` as a cached value that's updated periodically for performance

### Phase 4: Add Real-Time Updates to UI

**Current**: Leaderboard modal fetches data when opened, but doesn't refresh automatically.

**Solution:**
1. Add polling to leaderboard modal (refresh every 30-60 seconds when open)
2. Or use WebSockets/Server-Sent Events for instant updates (more complex)
3. Show "Last updated" timestamp in the modal

## Detailed Implementation Steps

### Step 1: Database Migration - Add `sold_at` Field

```sql
-- Add sold_at column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_sold_at ON products(sold_at DESC) 
WHERE sold_at IS NOT NULL;

-- Backfill existing sold products
UPDATE products 
SET sold_at = updated_at 
WHERE status = 'sold' AND sold_at IS NULL;
```

### Step 2: Update Product API to Set `sold_at`

Modify `app/api/products/[id]/route.ts`:
- When `status` changes from anything to `'sold'`, set `sold_at = NOW()`
- When `status` changes from `'sold'` to anything else, set `sold_at = NULL`

### Step 3: Create Leaderboard Cache Table

```sql
CREATE TABLE IF NOT EXISTS seller_leaderboard_cache (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items_sold INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL
);

CREATE INDEX idx_leaderboard_cache_month_year ON seller_leaderboard_cache(month, year);
```

### Step 4: Create Database Triggers

**Trigger 1: Update sales count when product is sold**
```sql
CREATE OR REPLACE FUNCTION update_leaderboard_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold') THEN
    -- Increment sales count for current month
    INSERT INTO seller_leaderboard_cache (seller_id, items_sold, month, year)
    VALUES (NEW.seller_id, 1, EXTRACT(MONTH FROM NOW())::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER)
    ON CONFLICT (seller_id) 
    DO UPDATE SET 
      items_sold = seller_leaderboard_cache.items_sold + 1,
      last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboard_on_sale
AFTER UPDATE ON products
FOR EACH ROW
WHEN (NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold'))
EXECUTE FUNCTION update_leaderboard_on_sale();
```

**Trigger 2: Update views count when view is recorded**
```sql
CREATE OR REPLACE FUNCTION update_leaderboard_on_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment views count for seller's products in current month
  INSERT INTO seller_leaderboard_cache (seller_id, total_views, month, year)
  SELECT 
    p.seller_id,
    1,
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER
  FROM products p
  WHERE p.id = NEW.product_id
  ON CONFLICT (seller_id) 
  DO UPDATE SET 
    total_views = seller_leaderboard_cache.total_views + 1,
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboard_on_view
AFTER INSERT ON product_views
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_on_view();
```

### Step 5: Update Leaderboard Functions

Modify `get_top_sellers_by_sales` and `get_top_sellers_by_views` to:
1. Use `sold_at` instead of `updated_at` for sales
2. Optionally read from cache table for better performance
3. Fall back to real-time calculation if cache is stale

### Step 6: Update Dashboard to Use Real-Time Data

Modify `app/(seller)/dashboard/page.tsx`:
- Calculate `totalViews` from `product_views` table instead of summing `view_count`
- Ensure it matches the leaderboard calculation

### Step 7: Add Polling to Leaderboard Modal

Modify `components/leaderboard/SellerLeaderboardModal.tsx`:
- Add `useEffect` with `setInterval` to refresh data every 30-60 seconds when modal is open
- Show loading state during refresh
- Display "Last updated" timestamp

## Technical Considerations

### Performance
- **Cache Table**: Pre-calculated rankings for fast reads
- **Indexes**: Ensure proper indexes on `sold_at`, `product_views.viewed_at`, and `seller_leaderboard_cache`
- **Query Optimization**: Leaderboard queries should be fast (< 100ms)

### Data Consistency
- **Triggers**: Ensure triggers fire correctly on all status changes
- **Edge Cases**: Handle when seller marks item as sold, then marks it back as active
- **Month Boundaries**: Handle month transitions correctly

### Scalability
- **Caching**: Consider Redis for leaderboard cache if database becomes a bottleneck
- **Partitioning**: Consider partitioning `product_views` by month if it grows very large
- **Background Jobs**: For very high volume, consider background job to recalculate leaderboard periodically

## Testing Checklist

- [ ] Product marked as sold updates leaderboard immediately
- [ ] Product view recorded updates leaderboard immediately
- [ ] Leaderboard shows correct sales count for current month
- [ ] Leaderboard shows correct views count for current month
- [ ] Dashboard total views matches leaderboard calculation
- [ ] Multiple sales by same seller are counted correctly
- [ ] Views from multiple products by same seller are aggregated correctly
- [ ] Month transitions work correctly (new month resets counts)
- [ ] Undoing a sale (marking sold item as active) decreases sales count
- [ ] Leaderboard modal refreshes automatically when open

## Timeline Estimate

- **Phase 1** (Sales Tracking Fix): 2-3 hours
- **Phase 2** (Real-Time Updates): 4-6 hours
- **Phase 3** (Views Consistency): 2-3 hours
- **Phase 4** (UI Updates): 1-2 hours

**Total**: ~10-14 hours of development time

## Questions to Consider

1. **Time Period**: Should leaderboard be monthly only, or also show all-time rankings?
2. **Undoing Sales**: If a seller marks an item as sold then marks it back as active, should we decrease the sales count?
3. **Draft Products**: Should views on draft products count toward leaderboard? (Currently: No, only active products)
4. **Historical Data**: Do we need to backfill leaderboard data for previous months?
5. **Display**: Should we show both monthly and all-time leaderboards in the modal?

## Next Steps

1. Review and approve this plan
2. Confirm views strategy (Option A vs Option B)
3. Decide on time period (monthly only or also all-time)
4. Start implementation with Phase 1

