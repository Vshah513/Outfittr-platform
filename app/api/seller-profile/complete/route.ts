import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

/**
 * POST /api/seller-profile/complete
 * Validates step 4 rules and sets activated = true, trust_status = 'new'. Call after Step 4 form submit.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const rules = body.rules ?? {};
    const requiredRules = [
      'photosActualItem',
      'discloseDefects',
      'noCounterfeit',
      'noSuspiciousDeposits',
    ];
    const allChecked = requiredRules.every((key) => rules[key] === true);

    if (!allChecked) {
      return NextResponse.json(
        { error: 'You must agree to all selling rules to activate' },
        { status: 400 }
      );
    }

    const { data: profile, error: fetchError } = await supabase
      .from('seller_profiles')
      .select('onboarding_step, agreed_to_rules')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'Complete onboarding steps 1–3 first' },
        { status: 400 }
      );
    }

    if (Number(profile.onboarding_step) < 4) {
      return NextResponse.json(
        { error: 'Complete all previous steps first' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('seller_profiles')
      .update({
        activated: true,
        trust_status: 'new',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error activating seller profile:', updateError);
      return NextResponse.json({ error: 'Failed to activate' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: updated,
      activated: true,
    });
  } catch (error) {
    console.error('Seller profile complete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to activate' },
      { status: 500 }
    );
  }
}
