import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// DELETE /api/follows/[sellerId] - Unfollow a seller
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { sellerId } = await params;

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('seller_id', sellerId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing seller:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow seller' },
      { status: 500 }
    );
  }
}

// GET /api/follows/[sellerId] - Check if following a specific seller
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ is_following: false });
    }

    const { sellerId } = await params;

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json({ is_following: false });
    }

    const { data, error: fetchError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('seller_id', sellerId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    return NextResponse.json({ is_following: !!data });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ is_following: false });
  }
}


