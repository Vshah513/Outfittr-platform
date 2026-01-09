import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';
import { paystack } from '@/lib/paystack';
import { BOOST_PACKAGES, SubscriptionTierId, BoostPackageId } from '@/types';

/**
 * GET /api/payments/paystack/verify?reference=xxx
 * Verify a Paystack transaction status
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Get transaction from our database
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user owns this transaction
    if (transaction.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If already completed, return status
    if (transaction.status === 'completed') {
      return NextResponse.json({
        status: 'success',
        message: 'Payment already completed',
        transaction,
      });
    }

    // Verify with Paystack
    const verification = await paystack.verifyTransaction(reference);

    if (!verification.status || !verification.data) {
      console.error('Paystack verification failed:', verification);
      return NextResponse.json({
        status: transaction.status,
        message: verification.message || 'Unable to verify payment',
        transaction,
      });
    }

    const paystackStatus = verification.data.status;
    console.log(`Payment verification result for ${reference}: ${paystackStatus}`, {
      amount: verification.data.amount,
      currency: verification.data.currency,
      channel: verification.data.channel,
    });

    // Update transaction status based on Paystack response
    if (paystackStatus === 'success') {
      // Payment successful - update transaction and activate
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          paystack_transaction_id: verification.data.id.toString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // Activate the subscription or boost
      const metadata = transaction.metadata as Record<string, unknown>;
      const paymentType = metadata?.payment_type as string;

      console.log('Payment type:', paymentType, 'Metadata:', metadata);

      if (paymentType === 'subscription') {
        const activationResult = await activateSubscription(supabase, user.id, metadata);
        console.log('Subscription activation result:', activationResult);
        
        if (!activationResult.success) {
          console.error('Failed to activate subscription:', activationResult.error);
          return NextResponse.json({
            status: 'error',
            message: 'Payment verified but subscription activation failed. Please contact support.',
            transaction: { ...transaction, status: 'completed' },
            error: activationResult.error,
          });
        }
        
        // Verify the plan was actually created/updated
        const { data: verifyPlan } = await supabase
          .from('seller_plans')
          .select('*')
          .eq('seller_id', user.id)
          .single();
        
        console.log('Plan after activation:', verifyPlan);
        
        if (!verifyPlan || verifyPlan.tier_id !== metadata.tier_id) {
          console.error('Plan verification failed - plan not updated correctly');
          return NextResponse.json({
            status: 'error',
            message: 'Payment verified but plan update failed. Please refresh the page or contact support.',
            transaction: { ...transaction, status: 'completed' },
          });
        }
      } else if (paymentType === 'boost') {
        const activationResult = await activateBoost(supabase, user.id, metadata);
        if (!activationResult.success) {
          console.error('Failed to activate boost:', activationResult.error);
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified and activated',
        transaction: { ...transaction, status: 'completed' },
      });
    } else if (paystackStatus === 'pending') {
      return NextResponse.json({
        status: 'pending',
        message: 'Payment is still pending',
        transaction,
      });
    } else {
      // Failed or abandoned
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: verification.data.gateway_response,
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        status: 'failed',
        message: verification.data.gateway_response || 'Payment failed',
        transaction: { ...transaction, status: 'failed' },
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

/**
 * Activate a subscription after successful payment
 */
async function activateSubscription(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  const tierId = metadata.tier_id as SubscriptionTierId;
  
  // Fetch tier from database
  const { data: dbTier, error: tierError } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (tierError || !dbTier) {
    const error = `Invalid tier ID in metadata: ${tierId}`;
    console.error(error, tierError);
    return { success: false, error };
  }

  // Calculate period end (30 days from now)
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  // Upsert seller plan
  const { error, data } = await supabase.from('seller_plans').upsert(
    {
      seller_id: userId,
      tier_id: tierId,
      payment_provider: 'paystack',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    },
    { onConflict: 'seller_id' }
  ).select();

  if (error) {
    console.error('Error activating subscription:', error);
    return { success: false, error: error.message };
  }

  console.log(`Subscription activated for user ${userId}: ${tierId}`, data);
  return { success: true };
}

/**
 * Activate a product boost after successful payment
 */
async function activateBoost(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  const productId = metadata.product_id as string;
  const boostPackageId = metadata.boost_package_id as BoostPackageId;
  const boostPkg = BOOST_PACKAGES[boostPackageId];

  if (!boostPkg) {
    const error = `Invalid boost package ID in metadata: ${boostPackageId}`;
    console.error(error);
    return { success: false, error };
  }

  // Calculate end time
  const endsAt = new Date();
  endsAt.setHours(endsAt.getHours() + boostPkg.duration_hours);

  // Insert product boost
  const { error } = await supabase.from('product_boosts').insert({
    product_id: productId,
    seller_id: userId,
    package_id: boostPackageId,
    boost_type: boostPkg.boost_type,
    starts_at: new Date().toISOString(),
    ends_at: endsAt.toISOString(),
    is_active: true,
  });

  if (error) {
    console.error('Error activating boost:', error);
    return { success: false, error: error.message };
  }

  console.log(`Boost activated for product ${productId}: ${boostPackageId}`);
  return { success: true };
}

