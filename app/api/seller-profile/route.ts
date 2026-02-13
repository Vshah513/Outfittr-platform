import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

/**
 * GET /api/seller-profile
 * Returns current user's seller profile (if any). Used by Account Hub, ProfileDropdown, dashboard guard.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: profile, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching seller profile:', error);
      return NextResponse.json({ error: 'Failed to fetch seller profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({
        profile: null,
        activated: false,
        trustStatus: null,
        onboardingStep: 0,
      });
    }

    return NextResponse.json({
      profile: {
        user_id: profile.user_id,
        activated: profile.activated,
        display_name: profile.display_name,
        email: profile.email,
        mpesa_number: profile.mpesa_number,
        profile_photo_url: profile.profile_photo_url,
        nairobi_area: profile.nairobi_area,
        meetup_zones: profile.meetup_zones ?? [],
        delivery_preference: profile.delivery_preference,
        delivery_fee_range: profile.delivery_fee_range,
        legal_name: profile.legal_name,
        dob: profile.dob,
        selfie_url: profile.selfie_url,
        agreed_to_rules: profile.agreed_to_rules,
        trust_status: profile.trust_status,
        onboarding_step: profile.onboarding_step ?? 0,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      activated: profile.activated,
      trustStatus: profile.trust_status,
      onboardingStep: profile.onboarding_step ?? 0,
    });
  } catch (error) {
    console.error('Seller profile GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch seller profile' },
      { status: 500 }
    );
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MPESA_REGEX = /^(\+?254|0)[17]\d{8}$/;

/**
 * PATCH /api/seller-profile
 * Create or update seller profile (per onboarding step). Does not set activated; use complete for step 4.
 */
export async function PATCH(request: NextRequest) {
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
    const step = typeof body.step === 'number' ? body.step : parseInt(body.step, 10);

    if (step < 0 || step > 4 || Number.isNaN(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (step === 0) {
      updates.onboarding_step = 1;
    }

    if (step === 1) {
      const displayName = (body.displayName ?? body.display_name ?? '').trim();
      const email = (body.email ?? '').trim();
      const mpesaNumber = (body.mpesaNumber ?? body.mpesa_number ?? '').trim();
      const profilePhotoUrl = body.profilePhotoUrl ?? body.profile_photo_url ?? null;

      if (!displayName) {
        return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
      }
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
      }
      if (!mpesaNumber) {
        return NextResponse.json({ error: 'M-Pesa number is required' }, { status: 400 });
      }
      if (!MPESA_REGEX.test(mpesaNumber.replace(/\s/g, ''))) {
        return NextResponse.json({ error: 'Enter a valid M-Pesa number (e.g. 07XX or +2547XX)' }, { status: 400 });
      }

      updates.display_name = displayName;
      updates.email = email;
      updates.mpesa_number = mpesaNumber;
      updates.profile_photo_url = profilePhotoUrl || null;
      updates.onboarding_step = 2;
    }

    if (step === 2) {
      const nairobiArea = (body.nairobiArea ?? body.nairobi_area ?? '').trim();
      const meetupZones = Array.isArray(body.meetupZones) ? body.meetupZones : (body.meetup_zones ?? []);
      const deliveryPreference = body.deliveryPreference ?? body.delivery_preference;
      const deliveryFeeRange = (body.deliveryFeeRange ?? body.delivery_fee_range ?? '').trim() || null;

      if (!nairobiArea) {
        return NextResponse.json({ error: 'Nairobi area is required' }, { status: 400 });
      }
      const zones = Array.isArray(meetupZones) ? meetupZones.filter((z: unknown) => typeof z === 'string' && z.trim()) : [];
      if (zones.length === 0) {
        return NextResponse.json({ error: 'Select at least one meetup zone' }, { status: 400 });
      }
      if (!['pickup', 'delivery', 'both'].includes(deliveryPreference)) {
        return NextResponse.json({ error: 'Delivery preference is required' }, { status: 400 });
      }

      updates.nairobi_area = nairobiArea;
      updates.meetup_zones = zones;
      updates.delivery_preference = deliveryPreference;
      updates.delivery_fee_range = deliveryFeeRange;
      updates.onboarding_step = 3;
    }

    if (step === 3) {
      const legalName = (body.legalName ?? body.legal_name ?? '').trim();
      const dob = (body.dob ?? '').trim();
      const selfieUrl = body.selfieUrl ?? body.selfie_url ?? null;
      const agreedToRules = Boolean(body.agreedToRules ?? body.agreed_to_rules);

      if (!legalName) {
        return NextResponse.json({ error: 'Legal name is required' }, { status: 400 });
      }
      if (!dob) {
        return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
      }
      if (!selfieUrl) {
        return NextResponse.json({ error: 'Selfie photo is required' }, { status: 400 });
      }
      if (!agreedToRules) {
        return NextResponse.json({ error: 'You must agree to the safe selling rules' }, { status: 400 });
      }

      updates.legal_name = legalName;
      updates.dob = dob;
      updates.selfie_url = selfieUrl;
      updates.agreed_to_rules = agreedToRules;
      updates.onboarding_step = 4;
    }

    if (step === 4) {
      return NextResponse.json(
        { error: 'Use POST /api/seller-profile/complete to activate' },
        { status: 400 }
      );
    }

    if (existing) {
      const { data, error } = await supabase
        .from('seller_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating seller profile:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
      }
      return NextResponse.json({ profile: data, onboardingStep: (data as { onboarding_step: number }).onboarding_step });
    }

    const insertPayload = {
      user_id: user.id,
      activated: false,
      display_name: step >= 1 ? updates.display_name : null,
      email: step >= 1 ? updates.email : null,
      mpesa_number: step >= 1 ? updates.mpesa_number : null,
      profile_photo_url: step >= 1 ? updates.profile_photo_url : null,
      nairobi_area: step >= 2 ? updates.nairobi_area : null,
      meetup_zones: step >= 2 ? updates.meetup_zones : [],
      delivery_preference: step >= 2 ? updates.delivery_preference : null,
      delivery_fee_range: step >= 2 ? updates.delivery_fee_range : null,
      legal_name: step >= 3 ? updates.legal_name : null,
      dob: step >= 3 ? updates.dob : null,
      selfie_url: step >= 3 ? updates.selfie_url : null,
      agreed_to_rules: step >= 3 ? updates.agreed_to_rules : false,
      trust_status: 'new',
      onboarding_step: updates.onboarding_step ?? 1,
    };

    const { data, error } = await supabase
      .from('seller_profiles')
      .upsert(insertPayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating seller profile:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
    return NextResponse.json({ profile: data, onboardingStep: (data as { onboarding_step: number }).onboarding_step });
  } catch (error) {
    console.error('Seller profile PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save' },
      { status: 500 }
    );
  }
}
