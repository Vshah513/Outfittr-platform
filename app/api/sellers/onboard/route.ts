import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';
import { paystack } from '@/lib/paystack';

/**
 * POST /api/sellers/onboard
 * Register seller bank details and create a Paystack subaccount
 * This enables the seller to receive split payments (95% of sales)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bankCode, accountNumber, businessName } = body;

    if (!bankCode || !accountNumber) {
      return NextResponse.json(
        { error: 'Bank code and account number are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Check if seller already has a subaccount
    if (user.paystack_subaccount_code) {
      // Update existing subaccount
      try {
        const updateResult = await paystack.updateSubaccount(user.paystack_subaccount_code, {
          business_name: businessName || user.full_name,
          bank_code: bankCode,
          account_number: accountNumber,
        });

        if (!updateResult.status) {
          return NextResponse.json(
            { error: updateResult.message || 'Failed to update payout details' },
            { status: 400 }
          );
        }

        // Update local database
        await supabase
          .from('users')
          .update({
            payout_bank_code: bankCode,
            payout_account_number: accountNumber,
            payout_account_name: updateResult.data?.account_name || null,
            payout_bank_name: updateResult.data?.settlement_bank || null,
          })
          .eq('id', user.id);

        return NextResponse.json({
          success: true,
          message: 'Payout details updated successfully',
          subaccountCode: user.paystack_subaccount_code,
          accountName: updateResult.data?.account_name,
          bankName: updateResult.data?.settlement_bank,
        });
      } catch (error) {
        console.error('Error updating subaccount:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to update payout details' },
          { status: 500 }
        );
      }
    }

    // Create new Paystack subaccount
    const sellerName = businessName || user.full_name || 'Outfittr Seller';
    const email = user.email || `${user.id.replace(/-/g, '')}@outfittr.app`;

    try {
      const result = await paystack.createSubaccount({
        business_name: sellerName,
        bank_code: bankCode,
        account_number: accountNumber,
        percentage_charge: 5, // Platform keeps 5%
        primary_contact_email: email,
        primary_contact_name: user.full_name,
        primary_contact_phone: user.phone_number || undefined,
        metadata: { user_id: user.id },
      });

      if (!result.status || !result.data) {
        return NextResponse.json(
          { error: result.message || 'Failed to create payout account' },
          { status: 400 }
        );
      }

      // Save subaccount code and bank details to user record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          paystack_subaccount_code: result.data.subaccount_code,
          payout_bank_code: bankCode,
          payout_account_number: accountNumber,
          payout_account_name: result.data.account_name || null,
          payout_bank_name: result.data.settlement_bank || null,
          seller_onboarded_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving subaccount to user:', updateError);
        // Subaccount was created in Paystack but we failed to save it locally
        // Return success but log the error for manual reconciliation
      }

      return NextResponse.json({
        success: true,
        message: 'Payout account created successfully',
        subaccountCode: result.data.subaccount_code,
        accountName: result.data.account_name,
        bankName: result.data.settlement_bank,
      });
    } catch (error) {
      console.error('Error creating subaccount:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create payout account' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Seller onboarding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to onboard seller' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sellers/onboard
 * Get seller's current payout/subaccount status
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      isOnboarded: Boolean(user.paystack_subaccount_code),
      subaccountCode: user.paystack_subaccount_code || null,
      bankCode: user.payout_bank_code || null,
      accountNumber: user.payout_account_number || null,
      accountName: user.payout_account_name || null,
      bankName: user.payout_bank_name || null,
      onboardedAt: user.seller_onboarded_at || null,
    });
  } catch (error) {
    console.error('Error fetching seller onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
}
