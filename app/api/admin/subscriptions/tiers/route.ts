import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

// Simple admin check - you may want to add a proper admin role system
const ADMIN_PHONE_NUMBERS = process.env.ADMIN_PHONE_NUMBERS?.split(',').map(num => num.trim()) || [];

function isAdmin(phoneNumber: string | undefined): boolean {
  if (!phoneNumber) return false;
  return ADMIN_PHONE_NUMBERS.includes(phoneNumber);
}

/**
 * GET /api/admin/subscriptions/tiers
 * Get all subscription tiers (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user || !isAdmin(user.phone_number)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price_kes', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tiers: tiers || [] });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/subscriptions/tiers
 * Update a subscription tier (admin only)
 * Note: This should be moved to /api/admin/subscriptions/tiers/[id]/route.ts
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user || !isAdmin(user.phone_number)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'id is required in request body' }, { status: 400 });
    }

    // Validate update fields
    const allowedFields = ['name', 'price_kes', 'active_listings_limit', 'features', 'paystack_plan_code'];
    const updates: Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('subscription_tiers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ tier: data });
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tier' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscriptions/tiers
 * Create a new subscription tier (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user || !isAdmin(user.phone_number)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, price_kes, active_listings_limit, features, paystack_plan_code } = body;

    if (!id || !name || price_kes === undefined) {
      return NextResponse.json(
        { error: 'id, name, and price_kes are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('subscription_tiers')
      .insert({
        id,
        name,
        price_kes,
        active_listings_limit: active_listings_limit ?? null,
        features: features || [],
        paystack_plan_code: paystack_plan_code || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ tier: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tier' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscriptions/tiers
 * Delete a subscription tier (admin only)
 * Note: This should be moved to /api/admin/subscriptions/tiers/[id]/route.ts
 * Note: This will fail if there are existing subscriptions using this tier
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user || !isAdmin(user.phone_number)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'id is required in request body' }, { status: 400 });
    }

    // Prevent deletion of free tier
    if (id === 'free') {
      return NextResponse.json({ error: 'Cannot delete the free tier' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Check if any sellers are using this tier
    const { data: sellersUsingTier } = await supabase
      .from('seller_plans')
      .select('seller_id')
      .eq('tier_id', id)
      .limit(1);

    if (sellersUsingTier && sellersUsingTier.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tier that is in use by sellers. Please migrate sellers first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('subscription_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tier' },
      { status: 500 }
    );
  }
}

