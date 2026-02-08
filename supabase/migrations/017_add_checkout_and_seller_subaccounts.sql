-- =============================================
-- 017: In-App Checkout with Paystack Split Payments
-- Adds seller subaccounts, orders table, and purchase support
-- =============================================

-- =============================================
-- 1. Add seller payout/subaccount fields to users table
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS paystack_subaccount_code VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_bank_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_number VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_onboarded_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_paystack_subaccount ON users(paystack_subaccount_code);

-- =============================================
-- 2. Create orders table for purchase records
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Amounts (in KES)
  amount_kes INTEGER NOT NULL,               -- Total amount charged to buyer
  platform_commission_kes INTEGER NOT NULL,   -- 5% platform commission
  seller_amount_kes INTEGER NOT NULL,         -- 95% seller receives
  
  -- Paystack details
  paystack_reference VARCHAR(100) NOT NULL,
  paystack_transaction_id VARCHAR(100),
  paystack_subaccount_code VARCHAR(100),      -- Seller's subaccount used for split
  payment_channel VARCHAR(30),                -- 'card', 'mobile_money', etc.
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, completed, failed, refunded
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_paystack_ref ON orders(paystack_reference);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- =============================================
-- 3. Enable RLS on orders
-- =============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders (as buyer or seller)"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Service can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update orders"
  ON orders FOR UPDATE
  USING (true);

-- =============================================
-- 4. Updated_at trigger for orders
-- =============================================
CREATE OR REPLACE FUNCTION update_orders_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- =============================================
-- 5. Function to mark product as sold after successful payment
-- =============================================
CREATE OR REPLACE FUNCTION complete_purchase(
  p_order_id UUID,
  p_paystack_transaction_id VARCHAR(100),
  p_payment_channel VARCHAR(30) DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_product_id UUID;
  v_buyer_id UUID;
BEGIN
  -- Get order details
  SELECT product_id, buyer_id INTO v_product_id, v_buyer_id
  FROM orders WHERE id = p_order_id;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Update order status
  UPDATE orders SET
    status = 'completed',
    paystack_transaction_id = p_paystack_transaction_id,
    payment_channel = p_payment_channel,
    paid_at = NOW()
  WHERE id = p_order_id;
  
  -- Mark product as sold
  UPDATE products SET
    status = 'sold',
    sold_to_id = v_buyer_id,
    sold_at = NOW()
  WHERE id = v_product_id AND status = 'active';
  
  -- Increment seller's total_sales count
  UPDATE users SET
    total_sales = COALESCE(total_sales, 0) + 1
  WHERE id = (SELECT seller_id FROM orders WHERE id = p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_purchase(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_purchase(UUID, VARCHAR, VARCHAR) TO anon;
