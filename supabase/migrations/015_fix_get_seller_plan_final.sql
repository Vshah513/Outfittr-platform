-- FINAL FIX: get_seller_plan function - simplified and corrected logic
-- This version directly queries the seller_plans table and joins with subscription_tiers

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

