-- =============================================
-- VIEW COUNT INCREMENT FUNCTION
-- =============================================

-- Function to safely increment view count
CREATE OR REPLACE FUNCTION increment_product_view_count(product_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1 
  WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_product_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_view_count(UUID) TO anon;

