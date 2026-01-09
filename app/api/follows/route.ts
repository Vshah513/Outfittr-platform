import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';

// GET /api/follows - Get user's followed sellers
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json({ data: [] });
    }

    const { data, error: fetchError } = await supabase
      .from('follows')
      .select(`
        *,
        seller:users!follows_seller_id_fkey(id, full_name, avatar_url, location, bio)
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    );
  }
}

// POST /api/follows - Follow a seller
const followSchema = z.object({
  seller_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await request.json();
    const { seller_id } = followSchema.parse(body);

    // Can't follow yourself
    if (seller_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Check if seller exists
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', seller_id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Create follow (upsert to handle duplicates gracefully)
    const { data, error: insertError } = await supabase
      .from('follows')
      .upsert({
        follower_id: user.id,
        seller_id: seller_id,
      }, {
        onConflict: 'follower_id,seller_id',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating follow:', error);
    return NextResponse.json(
      { error: 'Failed to follow seller' },
      { status: 500 }
    );
  }
}


