# Apply Subscription Tier Updates

## Step 1: Run the Migration in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the following SQL:

```sql
-- Update subscription tier limits
UPDATE subscription_tiers SET 
  active_listings_limit = 7,
  features = '["Basic selling", "Up to 7 active listings"]'
WHERE id = 'free';

UPDATE subscription_tiers SET 
  active_listings_limit = 40,
  features = '["Up to 40 active listings", "Basic analytics", "Priority in search"]'
WHERE id = 'base';

UPDATE subscription_tiers SET 
  active_listings_limit = 100,
  features = '["Up to 100 active listings", "Advanced analytics", "Bulk upload tools", "Auto-relist", "Trending badge eligibility"]'
WHERE id = 'growth';

UPDATE subscription_tiers SET 
  features = '["Unlimited listings", "Priority support", "Featured seller badge", "Demand insights dashboard", "All Growth features"]'
WHERE id = 'pro';

-- Verify the updates
SELECT id, name, price_kes, active_listings_limit, features FROM subscription_tiers ORDER BY price_kes;
```

6. Click "Run" (or press Cmd+Enter on Mac / Ctrl+Enter on Windows)
7. Check the results at the bottom - you should see all 4 tiers with the updated limits:
   - Free: 7
   - Base: 40
   - Growth: 100
   - Pro: NULL (unlimited)

## Step 2: Verify on the Frontend

1. Go to your app at `/plan` (the pricing page)
2. You should now see:
   - **Free Plan**: "Up to 7 active listings"
   - **Base Plan**: "Up to 40 active listings"  (KSh 400/month)
   - **Growth Plan**: "Up to 100 active listings" (KSh 1,000/month)
   - **Pro Plan**: "Unlimited active listings" (KSh 4,000/month)

3. The features list should also be updated to show the correct numbers

## Step 3: Test Listing Limits

1. Create a test user
2. Try creating listings and verify the limit is enforced at 7 for free users
3. Upgrade to a paid plan and verify the new limits work

## What Changed

| Tier   | Old Limit | New Limit | Price        |
|--------|-----------|-----------|--------------|
| Free   | 25        | **7**     | Free         |
| Base   | 100       | **40**    | KSh 400/mo   |
| Growth | 300       | **100**   | KSh 1,000/mo |
| Pro    | Unlimited | Unlimited | KSh 4,000/mo |

## Troubleshooting

If the plan page still shows old limits after running the migration:

1. **Clear browser cache**: Hard refresh (Cmd+Shift+R on Mac / Ctrl+Shift+F5 on Windows)
2. **Check Supabase**: Run this query to verify the update worked:
   ```sql
   SELECT * FROM subscription_tiers ORDER BY price_kes;
   ```
3. **Check API response**: Open browser DevTools → Network tab → Go to `/plan` → Look for the `/api/subscriptions/tiers` request and verify the response shows the new limits

## Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12 → Console tab)
2. Verify the Supabase connection is working
3. Make sure the `subscription_tiers` table exists and has data
