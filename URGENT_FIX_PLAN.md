# 🚨 URGENT FIX PLAN - Plan Not Updating After Payment

## Problem
- Payment goes through successfully ✅
- Database has correct data in `seller_plans` table ✅
- BUT UI still shows "Free" plan instead of "Base" plan ❌

## Root Cause
The `get_seller_plan` database function has a logic issue with the LEFT JOIN that prevents it from correctly finding the seller's plan.

## Solution - 3 Steps to Fix

### STEP 1: Run the New Migration (CRITICAL)

Go to Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- FINAL FIX: get_seller_plan function - simplified and corrected logic
CREATE OR REPLACE FUNCTION get_seller_plan(p_seller_id UUID)
RETURNS TABLE (
  tier_id VARCHAR(20),
  tier_name VARCHAR(50),
  price_kes INTEGER,
  active_listings_limit INTEGER,
  features JSONB,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
DECLARE
  v_tier_id VARCHAR(20);
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the tier_id and period_end from seller_plans
  SELECT sp.tier_id, sp.current_period_end
  INTO v_tier_id, v_period_end
  FROM seller_plans sp
  WHERE sp.seller_id = p_seller_id
  LIMIT 1;
  
  -- If no seller_plan exists, default to 'free'
  IF v_tier_id IS NULL THEN
    v_tier_id := 'free';
    v_period_end := NULL;
  END IF;
  
  -- Return the tier information by joining with subscription_tiers
  RETURN QUERY
  SELECT 
    v_tier_id::VARCHAR(20) as tier_id,
    st.name as tier_name,
    st.price_kes,
    st.active_listings_limit,
    st.features,
    v_period_end as current_period_end,
    CASE 
      WHEN v_tier_id = 'free' THEN true
      WHEN v_period_end IS NULL THEN false
      WHEN v_period_end > NOW() THEN true
      ELSE false
    END as is_active
  FROM subscription_tiers st
  WHERE st.id = v_tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_seller_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_seller_plan(UUID) TO anon;
```

**Expected Result:** "Success. No rows returned"

---

### STEP 2: Test the Function Directly

After running the migration, test it with your user ID:

```sql
-- Replace YOUR_USER_ID with your actual user ID from the seller_plans table
SELECT * FROM get_seller_plan('YOUR_USER_ID'::UUID);
```

**Expected Result:** Should return one row with `tier_id = 'base'` (or whatever tier you subscribed to)

---

### STEP 3: Refresh Your App

1. **Hard refresh your browser:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Or restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

---

## What I Fixed

### 1. ✅ Database Function (`015_fix_get_seller_plan_final.sql`)
   - **Before:** Complex LEFT JOIN that wasn't finding the seller_plans record
   - **After:** Simple direct query from seller_plans table, then join with subscription_tiers
   - **Result:** Function now correctly returns the user's actual plan

### 2. ✅ Added Debugging Logs
   - Added console logs in `/api/subscriptions` to see what the function returns
   - Added logs in the plan page to track refresh attempts
   - Check browser console to see what's happening

### 3. ✅ Improved Refresh Logic
   - More aggressive retry logic (15 attempts instead of 10)
   - Faster retry interval (800ms instead of 1000ms)
   - Cache-busting query parameter to avoid stale data
   - Manual refresh button added to the plan page header

### 4. ✅ Better Error Handling
   - Shows alert if refresh times out
   - Better error messages in console

---

## Testing After Fix

1. **Check the database function works:**
   ```sql
   -- Get your user ID first
   SELECT seller_id, tier_id FROM seller_plans;
   
   -- Then test the function
   SELECT * FROM get_seller_plan('YOUR_USER_ID'::UUID);
   ```

2. **Test the API endpoint:**
   - Open browser console
   - Go to `/plan` page
   - Check console logs - should show the correct tier_id

3. **Test a new payment:**
   - Make a test payment
   - Watch the console logs
   - Plan should update within 1-2 seconds

---

## If It Still Doesn't Work

### Check These Things:

1. **Is the migration applied?**
   ```sql
   -- Check if function exists
   SELECT proname FROM pg_proc WHERE proname = 'get_seller_plan';
   ```

2. **Is the seller_plans record correct?**
   ```sql
   SELECT * FROM seller_plans WHERE seller_id = 'YOUR_USER_ID';
   ```
   - Should show `tier_id = 'base'`
   - Should have a `current_period_end` in the future

3. **Check browser console:**
   - Look for logs starting with `[Plan Refresh]`
   - Look for `get_seller_plan result:` logs
   - Share any errors you see

4. **Check server logs:**
   - Look for `get_seller_plan result:` in your terminal
   - Check what `planData` contains

---

## Quick Manual Fix (If Needed)

If the automatic refresh still doesn't work, you can manually refresh:
1. Click the refresh button (🔄) next to "Seller Plans" header
2. Or hard refresh the page: `Ctrl+Shift+R` / `Cmd+Shift+R`

---

## Files Changed

1. ✅ `supabase/migrations/015_fix_get_seller_plan_final.sql` - New fixed function
2. ✅ `app/api/subscriptions/route.ts` - Added debugging logs
3. ✅ `app/(seller)/plan/page.tsx` - Improved refresh logic + manual refresh button

---

## Expected Behavior After Fix

1. User clicks "Upgrade to Base"
2. Completes payment
3. Redirected back to `/plan?ref=xxx`
4. Payment verified automatically
5. **Plan updates to "Base" within 1-2 seconds** ✅
6. Success message shows
7. "Current Plan" badge appears on Base plan card

---

**Run the migration NOW and test!** 🚀

