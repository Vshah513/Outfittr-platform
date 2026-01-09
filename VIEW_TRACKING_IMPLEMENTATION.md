# View Tracking Implementation Summary

## 🎯 What Was Implemented

A complete **unique view tracking system** that ensures each user (authenticated or anonymous) can only count as 1 view per product, regardless of how many times they visit.

## 📁 Files Created/Modified

### New Files:
1. **`supabase/migrations/009_unique_product_views.sql`** - Database migration
2. **`lib/session.ts`** - Session management for anonymous users
3. **`app/api/products/[id]/view/route.ts`** - View tracking API endpoint

### Modified Files:
1. **`app/api/products/[id]/route.ts`** - Removed automatic view increment
2. **`app/(buyer)/product/[id]/page.tsx`** - Added view tracking on page load

---

## 🗄️ Database Changes

### New Table: `product_views`
Tracks individual view records:
- `product_id` - Which product was viewed
- `user_id` - Authenticated user (nullable)
- `session_id` - Anonymous session ID (nullable)
- `ip_address` - IP tracking (for future analytics)
- `viewed_at` - Timestamp

### Unique Constraints:
- One view per `product_id + user_id` combination
- One view per `product_id + session_id` combination

### New Function: `record_product_view()`
Smart function that:
- Inserts a view record (fails silently if duplicate)
- Only increments `products.view_count` on first view
- Returns boolean indicating if view was recorded

---

## 🔄 How It Works

### For Authenticated Users:
1. User views product page
2. Frontend sends `userId` to `/api/products/{id}/view`
3. Database checks if this user already viewed this product
4. If **new view**: increment count, return `viewRecorded: true`
5. If **duplicate**: do nothing, return `viewRecorded: false`

### For Anonymous Users:
1. Generate unique `session_id` on first visit (stored in localStorage)
2. Send `sessionId` to view tracking API
3. Same logic as authenticated users

### Special Cases:
- **Sellers viewing own products**: Views not counted
- **Repeat visits**: No additional count
- **Different users**: Each counts as +1 view

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Open the file: `supabase/migrations/009_unique_product_views.sql`
4. Copy the entire content
5. Paste into SQL Editor
6. Click **Run** to execute

**Option B: Via Supabase CLI** (if installed)
```bash
cd "/Users/virajshah/Thrift Reselling Software"
supabase db push
```

### Step 2: Verify Migration
Run this query in SQL Editor to verify:
```sql
-- Check if table was created
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'product_views';

-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'record_product_view';
```

### Step 3: Test the Implementation
1. Restart your dev server if running:
   ```bash
   # Stop current server (Ctrl+C in terminal)
   npm run dev
   ```

2. Open a product page in your browser
3. Check browser console for any errors
4. Refresh the page multiple times - view count should NOT increase
5. Open in incognito/private window - view count SHOULD increase
6. Login with different account - view count SHOULD increase

---

## ✅ Testing Checklist

- [ ] Migration runs without errors
- [ ] Product page loads correctly
- [ ] View count increments on first visit
- [ ] View count does NOT increment on refresh (same user)
- [ ] View count increments when different user visits
- [ ] View count does NOT increment when seller views own product
- [ ] Anonymous users get persistent session ID
- [ ] Dashboard shows correct total views

---

## 🔍 Troubleshooting

### Issue: Migration fails with "function already exists"
**Solution**: The old function needs to be dropped first (already handled in migration)

### Issue: Views not being tracked
**Check**:
1. Browser console for errors
2. Network tab - is `/api/products/[id]/view` being called?
3. Verify migration ran successfully
4. Check Supabase logs for RPC errors

### Issue: View count not updating in dashboard
**Solution**: Dashboard fetches view counts from `products.view_count` column, which is automatically updated by the `record_product_view()` function.

---

## 📊 Analytics Queries

Once data starts flowing, you can run analytics:

### Get most viewed products:
```sql
SELECT p.title, p.view_count, COUNT(pv.id) as unique_views
FROM products p
LEFT JOIN product_views pv ON p.id = pv.product_id
GROUP BY p.id, p.title, p.view_count
ORDER BY p.view_count DESC
LIMIT 10;
```

### Get view breakdown (authenticated vs anonymous):
```sql
SELECT 
  product_id,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as authenticated_views,
  COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_views
FROM product_views
GROUP BY product_id;
```

### Get seller's total views:
```sql
SELECT 
  u.full_name,
  SUM(p.view_count) as total_views
FROM users u
JOIN products p ON u.id = p.seller_id
GROUP BY u.id, u.full_name
ORDER BY total_views DESC;
```

---

## 🎨 Future Enhancements

Potential improvements:
1. **View duration tracking** - Track how long users view products
2. **View sources** - Track where views come from (marketplace, search, direct link)
3. **Conversion tracking** - Track views that lead to messages/sales
4. **Heatmaps** - Track which product images get clicked most
5. **View trends** - Daily/weekly view analytics charts

---

## 🔐 Security Notes

- View tracking is **non-critical** - failures are logged but don't break the page
- Session IDs are stored in localStorage (client-side only)
- No PII is tracked for anonymous users except IP address
- RLS policies ensure users can't manipulate view counts directly
- The `record_product_view()` function runs with `SECURITY DEFINER` to bypass RLS

---

## 📝 Code Examples

### Checking if a view was recorded (client-side):
```typescript
const response = await fetch(`/api/products/${productId}/view`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user?.id || null,
    sessionId: sessionId,
  }),
});

const result = await response.json();
console.log('View recorded:', result.viewRecorded);
console.log('Current view count:', result.viewCount);
```

### Manual view tracking (if needed):
```sql
SELECT record_product_view(
  'product-uuid-here'::UUID,
  'user-uuid-here'::UUID,  -- or NULL for anonymous
  'session-id-here'         -- or NULL for authenticated
);
```

---

## ✨ Benefits Achieved

✅ **Accurate metrics** - No more view inflation  
✅ **Works for all users** - Authenticated + anonymous  
✅ **Seller protection** - Own views don't count  
✅ **Persistent tracking** - Session IDs survive page reloads  
✅ **Scalable** - Database-level logic, minimal frontend code  
✅ **Privacy-friendly** - Minimal data collection  

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the migration ran successfully in Supabase
2. Look for errors in browser console
3. Check Supabase dashboard logs
4. Verify environment variables are set correctly

The implementation is complete and ready for testing! 🚀

