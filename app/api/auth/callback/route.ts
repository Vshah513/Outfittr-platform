import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServiceSupabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl');

  if (code) {
    // Create response first so we can set cookies on it
    const redirectTo = returnUrl ? `${requestUrl.origin}${returnUrl}` : `${requestUrl.origin}/marketplace`;
    const response = NextResponse.redirect(redirectTo);

    // Exchange code for session with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Set cookies on the response (NOT httpOnly so client can read them)
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: false, // Allow client-side access for Supabase auth
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
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

      return response;
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
}

