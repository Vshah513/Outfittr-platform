import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

/**
 * GET /api/subscriptions
 * Get current user's subscription plan and limits
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

    // Get seller's plan using the database function
    const { data: planData, error: planError } = await supabase
      .rpc('get_seller_plan', { p_seller_id: user.id });

    // Debug logging
    console.log('get_seller_plan result:', { 
      userId: user.id, 
      planData, 
      planError,
      planDataLength: planData?.length 
    });

    if (planError) {
      console.error('Error fetching plan:', planError);
      // Return default free plan on error
      return NextResponse.json({
        plan: {
          tier_id: 'free',
          tier_name: 'Free',
          price_kes: 0,
          active_listings_limit: 7,
          features: ['Basic selling', 'Up to 7 active listings'],
          is_active: true,
          current_period_end: null,
        },
        usage: {
          current_listings: 0,
          limit: 7,
          percentage: 0,
        },
        canCreateListing: true,
      });
    }

    const plan = planData?.[0] || {
      tier_id: 'free',
      tier_name: 'Free',
      price_kes: 0,
      active_listings_limit: 7,
      features: ['Basic selling', 'Up to 7 active listings'],
      is_active: true,
      current_period_end: null,
    };

    // Debug: Log the plan being returned
    console.log('Returning plan:', plan);

    // Get current listing count
    const { data: canCreate, error: canCreateError } = await supabase
      .rpc('can_seller_create_listing', { p_seller_id: user.id });

    // Debug logging
    console.log('[API /subscriptions] can_seller_create_listing result:', { 
      userId: user.id, 
      canCreate, 
      canCreateError 
    });

    const usage = canCreate?.[0] || {
      current_count: 0,
      listing_limit: plan.active_listings_limit || 7,
      can_create: true,
    };

    const limit = usage.listing_limit || plan.active_listings_limit || 7;
    const percentage = limit ? Math.round((usage.current_count / limit) * 100) : 0;

    console.log('[API /subscriptions] Returning usage:', {
      current_listings: usage.current_count,
      limit,
      percentage,
    });

    return NextResponse.json({
      plan: {
        tier_id: plan.tier_id,
        tier_name: plan.tier_name,
        price_kes: plan.price_kes,
        active_listings_limit: plan.active_listings_limit,
        features: plan.features || [],
        is_active: plan.is_active,
        current_period_end: plan.current_period_end,
      },
      usage: {
        current_listings: usage.current_count,
        limit,
        percentage,
      },
      canCreateListing: usage.can_create,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

/**
 * GET /api/subscriptions/tiers
 * Get all available subscription tiers
 */
export async function OPTIONS() {
  return NextResponse.json({ message: 'OK' });
}

