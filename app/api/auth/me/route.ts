import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
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
      .eq('supabase_user_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
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
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ user: null });
  }
}
