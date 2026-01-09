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

