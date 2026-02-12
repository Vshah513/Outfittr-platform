-- =============================================
-- Tie reviews to orders: one review per order
-- =============================================

-- Add order_id to reviews (nullable for any legacy rows)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_id
  ON reviews(order_id)
  WHERE order_id IS NOT NULL;

-- =============================================
-- Recalculate seller rating (for UPDATE/DELETE triggers)
-- =============================================
CREATE OR REPLACE FUNCTION recalc_seller_rating(p_seller_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE seller_id = p_seller_id
  )
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: after UPDATE on reviews, recalc both old and new seller
CREATE OR REPLACE FUNCTION update_seller_rating_on_review_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.seller_id IS NOT NULL THEN
      PERFORM recalc_seller_rating(OLD.seller_id);
    END IF;
    IF NEW.seller_id IS NOT NULL AND (OLD.seller_id IS NULL OR OLD.seller_id != NEW.seller_id) THEN
      PERFORM recalc_seller_rating(NEW.seller_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.seller_id IS NOT NULL THEN
      PERFORM recalc_seller_rating(OLD.seller_id);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_seller_rating_on_review_update ON reviews;
CREATE TRIGGER update_seller_rating_on_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating_on_review_change();

DROP TRIGGER IF EXISTS update_seller_rating_on_review_delete ON reviews;
CREATE TRIGGER update_seller_rating_on_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating_on_review_change();
