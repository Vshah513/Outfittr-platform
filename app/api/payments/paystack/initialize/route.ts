import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';
import { paystack, generateReference } from '@/lib/paystack';
import { BOOST_PACKAGES, SubscriptionTierId, BoostPackageId } from '@/types';

/**
 * POST /api/payments/paystack/initialize
 * Initialize a Paystack payment for subscriptions or boosts
 * 
 * For subscriptions: redirects to Paystack checkout
 * For boosts: initiates M-Pesa STK push directly
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentType, phoneNumber } = body;

    if (!paymentType || !['subscription', 'boost'].includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Generate unique reference
    const reference = generateReference(paymentType === 'subscription' ? 'sub' : 'boost');

    // Get user email (required by Paystack)
    // Paystack requires a valid email format, so we use a generated one if user doesn't have email
    const email = user.email || `${user.id.replace(/-/g, '')}@outfittr.app`;
    
    // Validate email format
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required for payment' }, { status: 400 });
    }

    // =============================================
    // SUBSCRIPTION PAYMENT
    // =============================================
    if (paymentType === 'subscription') {
      const { tierId } = body;

      if (!tierId || !['base', 'growth', 'pro'].includes(tierId)) {
        return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
      }

      // Fetch tier from database instead of hardcoded constant
      const { data: dbTier, error: tierError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', tierId)
        .single();

      if (tierError || !dbTier) {
        return NextResponse.json({ error: 'Subscription tier not found' }, { status: 400 });
      }

      const tier = {
        id: dbTier.id,
        name: dbTier.name,
        price_kes: dbTier.price_kes,
        active_listings_limit: dbTier.active_listings_limit,
      };

      const metadata = {
        user_id: user.id,
        payment_type: 'subscription',
        tier_id: tierId,
        tier_name: tier.name,
        amount_kes: tier.price_kes,
      };

      // Record pending transaction
      const { error: txError } = await supabase.from('payment_transactions').insert({
        user_id: user.id,
        payment_type: 'subscription',
        payment_provider: 'paystack',
        amount_kes: tier.price_kes,
        currency: 'KES',
        status: 'pending',
        paystack_reference: reference,
        metadata,
      });

      if (txError) {
        console.error('Error recording transaction:', txError);
      }

      // Use one-time payment for subscriptions (monthly recurring payments)
      // This is simpler and more reliable than Paystack's subscription plans
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/plan?ref=${reference}`;

      // Validate amount
      if (!tier.price_kes || tier.price_kes <= 0) {
        return NextResponse.json({ error: 'Invalid subscription amount' }, { status: 400 });
      }

      // Initialize payment transaction
      const response = await paystack.initializeTransaction({
        email,
        amount: tier.price_kes,
        reference,
        callback_url: callbackUrl,
        metadata,
        channels: ['card', 'mobile_money'],
      });

      if (!response.status || !response.data) {
        console.error('Paystack initialization error:', response);
        return NextResponse.json({ 
          error: response.message || 'Failed to initialize payment. Please try again.' 
        }, { status: 400 });
      }

      return NextResponse.json({
        type: 'redirect',
        url: response.data.authorization_url,
        reference: response.data.reference,
      });
    }

    // =============================================
    // BOOST PAYMENT (M-Pesa STK Push)
    // =============================================
    if (paymentType === 'boost') {
      const { productId, boostPackageId } = body;

      if (!productId) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
      }

      if (!boostPackageId || !BOOST_PACKAGES[boostPackageId as BoostPackageId]) {
        return NextResponse.json({ error: 'Invalid boost package' }, { status: 400 });
      }

      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number is required for M-Pesa payment' }, { status: 400 });
      }

      // Verify product exists and belongs to user
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, seller_id')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      if (product.seller_id !== user.id) {
        return NextResponse.json({ error: 'You can only boost your own products' }, { status: 403 });
      }

      const boostPkg = BOOST_PACKAGES[boostPackageId as BoostPackageId];

      const metadata = {
        user_id: user.id,
        payment_type: 'boost',
        product_id: productId,
        product_title: product.title,
        boost_package_id: boostPackageId,
        boost_package_name: boostPkg.name,
        duration_hours: boostPkg.duration_hours,
        amount_kes: boostPkg.price_kes,
      };

      // Record pending transaction
      const { error: txError } = await supabase.from('payment_transactions').insert({
        user_id: user.id,
        payment_type: 'boost',
        payment_provider: 'paystack',
        amount_kes: boostPkg.price_kes,
        currency: 'KES',
        status: 'pending',
        paystack_reference: reference,
        metadata,
      });

      if (txError) {
        console.error('Error recording transaction:', txError);
      }

      // Initiate M-Pesa STK Push
      const response = await paystack.chargeMobileMoney({
        email,
        amount: boostPkg.price_kes,
        phone: phoneNumber,
        reference,
        metadata,
      });

      if (!response.status) {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed', error_message: response.message })
          .eq('paystack_reference', reference);

        return NextResponse.json({ error: response.message || 'Failed to initiate M-Pesa payment' }, { status: 400 });
      }

      // Check if pending (waiting for user to enter PIN)
      if (response.data?.status === 'pending') {
        return NextResponse.json({
          type: 'pending',
          message: response.data.display_text || 'Check your phone and enter your M-Pesa PIN',
          reference,
        });
      }

      // If already successful (rare, but possible)
      if (response.data?.status === 'success') {
        // Webhook will handle activation, but return success
        return NextResponse.json({
          type: 'success',
          message: 'Payment successful! Your boost is being activated.',
          reference,
        });
      }

      return NextResponse.json({
        type: 'pending',
        message: 'Payment initiated. Check your phone to complete with M-Pesa.',
        reference,
      });
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

