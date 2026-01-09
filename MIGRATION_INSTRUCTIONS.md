# How to Run the Database Migration

## Method 1: Using Supabase Dashboard (Recommended - Easiest)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click the **"New query"** button (top right)

### Step 3: Copy and Paste the Migration SQL
Copy the entire SQL code below and paste it into the SQL Editor:

```sql
-- Fix get_seller_plan function to correctly return the seller's current plan
-- The previous version had a logic issue in the WHERE clause that prevented it from finding the correct tier

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
BEGIN
  -- First, get the tier_id from seller_plans, or default to 'free'
  SELECT COALESCE(tier_id, 'free') INTO v_tier_id
  FROM seller_plans
  WHERE seller_id = p_seller_id
  LIMIT 1;
  
  -- If no seller_plan exists, default to 'free'
  IF v_tier_id IS NULL THEN
    v_tier_id := 'free';
  END IF;
  
  -- Return the tier information
  RETURN QUERY
  SELECT 
    v_tier_id::VARCHAR(20) as tier_id,
    st.name as tier_name,
    st.price_kes,
    st.active_listings_limit,
    st.features,
    sp.current_period_end,
    CASE 
      WHEN v_tier_id = 'free' THEN true
      WHEN sp.current_period_end IS NULL THEN false
      WHEN sp.current_period_end > NOW() THEN true
      ELSE false
    END as is_active
  FROM subscription_tiers st
  LEFT JOIN seller_plans sp ON sp.tier_id = st.id AND sp.seller_id = p_seller_id
  WHERE st.id = v_tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_seller_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_seller_plan(UUID) TO anon;
```

### Step 4: Run the Migration
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the query to complete
3. You should see a success message: **"Success. No rows returned"**

### Step 5: Verify It Worked
1. Run this test query to verify the function exists:
```sql
SELECT get_seller_plan('00000000-0000-0000-0000-000000000000'::UUID);
```
2. You should see a result (even if it's the free tier for a non-existent user)

---

## Method 2: Using Supabase CLI (If you have it installed)

### Step 1: Check if Supabase CLI is installed
Open your terminal and run:
```bash
supabase --version
```

If it's not installed, install it:
```bash
npm install -g supabase
```

### Step 2: Link your project (if not already linked)
```bash
cd "/Users/virajshah/Thrift Reselling Software"
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Run the migration
```bash
supabase db push
```

Or apply just this specific migration:
```bash
supabase migration up
```

---

## After Running the Migration

1. **Test the payment flow again:**
   - Go to your plan page
   - Click "Upgrade to Base"
   - Complete a test payment
   - The plan should now update automatically!

2. **If it still doesn't work:**
   - Check the browser console for any errors
   - Check the server logs for subscription activation errors
   - Verify the `seller_plans` table has a record for your user

---

## Troubleshooting

**If you get an error about the function already existing:**
- That's okay! The `CREATE OR REPLACE` will update it
- Just run the SQL again

**If you get permission errors:**
- Make sure you're using the correct database connection
- Check that you have admin access to your Supabase project

**If the function still doesn't work:**
- Check the Supabase logs for any errors
- Verify the `seller_plans` table structure matches what the function expects

