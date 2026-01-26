-- =============================================
-- UPDATE SUBSCRIPTION TIER LIMITS
-- Changes limits to:
--   Free: 7 listings (was 25)
--   Base: 40 listings (was 100)
--   Growth: 100 listings (was 300)
--   Pro: Unlimited (unchanged)
-- =============================================

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

-- Pro tier remains unlimited (NULL), but let's refresh its features description
UPDATE subscription_tiers SET 
  features = '["Unlimited listings", "Priority support", "Featured seller badge", "Demand insights dashboard", "All Growth features"]'
WHERE id = 'pro';

-- Verify the updates
SELECT id, name, price_kes, active_listings_limit, features FROM subscription_tiers ORDER BY price_kes;
