import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { paystack, verifyWebhookSignature } from '@/lib/paystack';
import { BOOST_PACKAGES, SubscriptionTierId, BoostPackageId } from '@/types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * POST /api/webhooks/paystack
 * Handle Paystack webhook events
 * 
 * Events handled:
 * - charge.success: Payment completed (boosts, one-time subscription)
 * - subscription.create: New subscription created
 * - subscription.not_renew: Subscription won't renew
 * - subscription.disable: Subscription cancelled
 * - invoice.payment_failed: Subscription payment failed
 */
export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-paystack-signature');
    if (!signature) {
      console.error('Missing Paystack signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, PAYSTACK_SECRET_KEY || '')) {
      console.error('Invalid Paystack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    console.log(`Paystack webhook received: ${eventType}`);

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.error('Database not configured');
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // =============================================
    // CHARGE SUCCESS (One-time payment or mobile money)
    // =============================================
    if (eventType === 'charge.success') {
      const { reference, metadata, customer, amount, channel } = data;

      if (!reference) {
        console.error('Missing reference in charge.success');
        return NextResponse.json({ received: true });
      }

      // Update transaction record
      const { data: transaction, error: txError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          paystack_transaction_id: data.id?.toString(),
        })
        .eq('paystack_reference', reference)
        .select()
        .single();

      if (txError) {
        console.error('Transaction not found for reference:', reference);
        // Don't fail - might be a duplicate webhook
      }

      // Get metadata from transaction or event
      const meta = (transaction?.metadata || metadata || {}) as Record<string, unknown>;
      const paymentType = meta.payment_type as string;
      const userId = meta.user_id as string;

      if (!userId) {
        console.error('Missing user_id in metadata');
        return NextResponse.json({ received: true });
      }

      // Activate based on payment type
      if (paymentType === 'subscription') {
        const tierId = meta.tier_id as SubscriptionTierId;
        await activateSubscription(supabase, userId, tierId);
        console.log(`Subscription activated via webhook: ${userId} -> ${tierId}`);
      } else if (paymentType === 'boost') {
        const productId = meta.product_id as string;
        const boostPackageId = meta.boost_package_id as BoostPackageId;
        await activateBoost(supabase, userId, productId, boostPackageId, transaction?.id);
        console.log(`Boost activated via webhook: ${productId} -> ${boostPackageId}`);
      }

      return NextResponse.json({ received: true });
    }

    // =============================================
    // SUBSCRIPTION CREATED
    // =============================================
    if (eventType === 'subscription.create') {
      const { subscription_code, email_token, plan, customer, next_payment_date } = data;

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customer?.email)
        .single();

      if (userError || !userData) {
        console.error('User not found for subscription:', customer?.email);
        return NextResponse.json({ received: true });
      }

      // Get tier from plan code
      const { data: tierData } = await supabase
        .from('subscription_tiers')
        .select('id')
        .eq('paystack_plan_code', plan?.plan_code)
        .single();

      const tierId = tierData?.id || 'base';

      // Update seller plan
      const { error: updateError } = await supabase.from('seller_plans').upsert(
        {
          seller_id: userData.id,
          tier_id: tierId,
          payment_provider: 'paystack',
          paystack_subscription_code: subscription_code,
          paystack_email_token: email_token,
          paystack_customer_code: customer?.customer_code,
          current_period_start: new Date().toISOString(),
          current_period_end: next_payment_date,
          cancel_at_period_end: false,
        },
        { onConflict: 'seller_id' }
      );

      if (updateError) {
        console.error('Error updating seller plan:', updateError);
      }

      console.log(`Subscription created for ${userData.id}: ${tierId}`);
      return NextResponse.json({ received: true });
    }

    // =============================================
    // SUBSCRIPTION WON'T RENEW
    // =============================================
    if (eventType === 'subscription.not_renew') {
      const { subscription_code } = data;

      const { error } = await supabase
        .from('seller_plans')
        .update({ cancel_at_period_end: true })
        .eq('paystack_subscription_code', subscription_code);

      if (error) {
        console.error('Error marking subscription for cancellation:', error);
      }

      console.log(`Subscription marked for cancellation: ${subscription_code}`);
      return NextResponse.json({ received: true });
    }

    // =============================================
    // SUBSCRIPTION DISABLED/CANCELLED
    // =============================================
    if (eventType === 'subscription.disable') {
      const { subscription_code, customer } = data;

      // Downgrade to free tier
      const { error } = await supabase
        .from('seller_plans')
        .update({
          tier_id: 'free',
          cancel_at_period_end: false,
          current_period_end: null,
          paystack_subscription_code: null,
          paystack_email_token: null,
        })
        .eq('paystack_subscription_code', subscription_code);

      if (error) {
        console.error('Error downgrading subscription:', error);
      }

      console.log(`Subscription cancelled, downgraded to free: ${subscription_code}`);
      return NextResponse.json({ received: true });
    }

    // =============================================
    // INVOICE PAYMENT FAILED
    // =============================================
    if (eventType === 'invoice.payment_failed') {
      const { subscription, customer } = data;
      const subscriptionCode = subscription?.subscription_code;

      if (!subscriptionCode) {
        return NextResponse.json({ received: true });
      }

      // Record failed payment
      const { data: sellerPlan } = await supabase
        .from('seller_plans')
        .select('seller_id')
        .eq('paystack_subscription_code', subscriptionCode)
        .single();

      if (sellerPlan) {
        await supabase.from('payment_transactions').insert({
          user_id: sellerPlan.seller_id,
          payment_type: 'subscription',
          payment_provider: 'paystack',
          amount_kes: (data.amount || 0) / 100,
          currency: 'KES',
          status: 'failed',
          error_message: 'Subscription renewal failed',
          metadata: { event: 'invoice.payment_failed' },
        });
      }

      console.log(`Subscription payment failed: ${subscriptionCode}`);
      return NextResponse.json({ received: true });
    }

    // =============================================
    // INVOICE UPDATED (successful renewal)
    // =============================================
    if (eventType === 'invoice.update' && data.paid) {
      const { subscription } = data;
      const subscriptionCode = subscription?.subscription_code;

      if (!subscriptionCode) {
        return NextResponse.json({ received: true });
      }

      // Extend subscription period
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

      const { error } = await supabase
        .from('seller_plans')
        .update({
          current_period_start: new Date().toISOString(),
          current_period_end: nextPaymentDate.toISOString(),
        })
        .eq('paystack_subscription_code', subscriptionCode);

      if (error) {
        console.error('Error extending subscription:', error);
      }

      console.log(`Subscription renewed: ${subscriptionCode}`);
      return NextResponse.json({ received: true });
    }

    // Unhandled event type
    console.log(`Unhandled Paystack event: ${eventType}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Activate a subscription
 */
async function activateSubscription(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  tierId: SubscriptionTierId
) {
  if (!supabase) return;

  // Verify tier exists in database
  const { data: dbTier, error: tierError } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (tierError || !dbTier) {
    console.error('Invalid tier:', tierId, tierError);
    return;
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await supabase.from('seller_plans').upsert(
    {
      seller_id: userId,
      tier_id: tierId,
      payment_provider: 'paystack',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    },
    { onConflict: 'seller_id' }
  );
}

/**
 * Activate a product boost
 */
async function activateBoost(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  productId: string,
  boostPackageId: BoostPackageId,
  transactionId?: string
) {
  if (!supabase) return;

  const boostPkg = BOOST_PACKAGES[boostPackageId];
  if (!boostPkg) {
    console.error('Invalid boost package:', boostPackageId);
    return;
  }

  const endsAt = new Date();
  endsAt.setHours(endsAt.getHours() + boostPkg.duration_hours);

  await supabase.from('product_boosts').insert({
    product_id: productId,
    seller_id: userId,
    package_id: boostPackageId,
    boost_type: boostPkg.boost_type,
    starts_at: new Date().toISOString(),
    ends_at: endsAt.toISOString(),
    is_active: true,
    payment_transaction_id: transactionId,
  });
}

