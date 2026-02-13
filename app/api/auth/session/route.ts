import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

const hasSupabaseConfig = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// GET /api/auth/session - Returns current user
export async function GET(request: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ user: null });
    }
    const supabase = await createSupabaseServerClient(request);
    
    // Use getUser() instead of getSession() for secure server-side auth verification
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ user: null });
    }

    // Get full user data from our users table
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json({ user: null });
    }

    const { data: user } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('supabase_user_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { data: sellerProfile } = await serviceSupabase
      .from('seller_profiles')
      .select('activated, trust_status')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        full_name: user.full_name,
        user_type: user.user_type,
        avatar_url: user.avatar_url,
        location: user.location,
        bio: user.bio,
        rating: user.rating,
        total_sales: user.total_sales,
        is_admin: user.is_admin || false,
        seller_activated: sellerProfile?.activated ?? false,
        seller_trust_status: sellerProfile?.trust_status ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ user: null });
  }
}

// DELETE /api/auth/session - Sign out
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });
    
    // Clear auth cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    return response;
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

