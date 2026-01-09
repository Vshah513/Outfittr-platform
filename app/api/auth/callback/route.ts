import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServiceSupabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl');

  if (code) {
    // Exchange code for session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // We'll set cookies via response headers
          },
          remove(name: string, options: any) {
            // We'll remove cookies via response headers
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    if (data.session) {
      // Check if user exists in our users table
      const serviceSupabase = getServiceSupabase();
      
      if (serviceSupabase) {
        const { data: existingUser } = await serviceSupabase
          .from('users')
          .select('*')
          .eq('supabase_user_id', data.session.user.id)
          .single();

        if (!existingUser) {
          // First time login - create user record
          const userMetadata = data.session.user.user_metadata;
          const email = data.session.user.email;
          
          await serviceSupabase.from('users').insert({
            supabase_user_id: data.session.user.id,
            email: email,
            full_name: userMetadata.full_name || userMetadata.name || email?.split('@')[0] || 'User',
            avatar_url: userMetadata.avatar_url || userMetadata.picture,
            user_type: 'buyer', // Default
          });
        } else {
          // Existing user - optionally sync avatar/name from Google
          const userMetadata = data.session.user.user_metadata;
          if (userMetadata.avatar_url || userMetadata.picture) {
            await serviceSupabase
              .from('users')
              .update({
                avatar_url: userMetadata.avatar_url || userMetadata.picture,
                last_active_at: new Date().toISOString(),
              })
              .eq('id', existingUser.id);
          }
        }
      }

      // Create response and set cookies
      const response = NextResponse.redirect(
        returnUrl ? `${requestUrl.origin}${returnUrl}` : `${requestUrl.origin}/marketplace`
      );

      // Set Supabase auth cookies
      const cookieOptions = {
        path: '/',
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      };

      // Supabase sets its own cookies, but we'll make sure they're persisted
      data.session && response.cookies.set('sb-access-token', data.session.access_token, cookieOptions);
      data.session && response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

      return response;
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
}

