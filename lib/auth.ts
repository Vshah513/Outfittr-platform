import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

const hasSupabaseConfig = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Browser client for client components (returns null if Supabase env is not set)
export function createSupabaseClient(): ReturnType<typeof createBrowserClient> | null {
  if (!hasSupabaseConfig()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client for API routes and server components
export async function createSupabaseServerClient(request?: NextRequest) {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase URL and anon key are not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  }
  if (request) {
    // For API routes - extract cookies from request
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // Cookies will be set via response headers in API routes
          },
          remove() {
            // Cookies will be removed via response headers in API routes
          },
        },
      }
    );
  } else {
    // For server components - use next/headers (imported dynamically)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Cookie setting might fail in middleware/edge runtime
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Cookie removal might fail in middleware/edge runtime
            }
          },
        },
      }
    );
  }
}

// Server-side auth checker for API routes
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return { user: null, error: 'Unauthorized' };
  }
  
  // Get full user data from our users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_user_id', session.user.id)
    .single();
  
  if (userError || !user) {
    return { user: null, error: 'User not found' };
  }
  
  return { user, error: null };
}

// Client-side auth actions
export async function signInWithGoogle(returnUrl?: string) {
  const supabase = createSupabaseClient();
  if (!supabase) return { error: 'Auth is not configured. Add Supabase env vars to .env.local' };
  const redirectUrl = returnUrl 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  
  if (error) {
    console.error('Google sign-in error:', error);
    return { error: error.message };
  }
  
  return { error: null };
}

export async function signInWithFacebook(returnUrl?: string) {
  const supabase = createSupabaseClient();
  if (!supabase) return { error: 'Auth is not configured. Add Supabase env vars to .env.local' };
  const redirectUrl = returnUrl 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectUrl,
    },
  });
  
  if (error) {
    console.error('Facebook sign-in error:', error);
    return { error: error.message };
  }
  
  return { error: null };
}

export async function signInWithMagicLink(email: string, returnUrl?: string) {
  const supabase = createSupabaseClient();
  if (!supabase) return { error: 'Auth is not configured. Add Supabase env vars to .env.local' };
  const redirectUrl = returnUrl 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  
  if (error) {
    console.error('Magic link error:', error);
    return { error: error.message };
  }
  
  return { error: null };
}

// Email/password registration with auto-sign-in
export async function registerWithEmail(
  email: string,
  password: string,
  username: string,
  fullName: string
): Promise<{ error: string | null; message?: string; autoSignedIn?: boolean }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, fullName }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return the specific error from the API
      return { error: data.error || 'Failed to create account. Please try again.' };
    }

    // Auto-sign in after successful registration
    const signInResult = await signInWithEmail(email, password);
    
    if (signInResult.error) {
      // Registration succeeded but sign-in failed - still consider it a success
      // User can manually sign in
      return { error: null, message: 'Account created! Please sign in.', autoSignedIn: false };
    }

    return { error: null, message: 'Account created successfully!', autoSignedIn: true };
  } catch (error) {
    console.error('Registration error:', error);
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'Network error. Please check your connection and try again.' };
    }
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// Email/password login
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) return { error: 'Auth is not configured. Add Supabase env vars to .env.local' };
    // Use Supabase's native signInWithPassword for proper session handling
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Incorrect email or password' };
      }
      return { error: error.message };
    }

    if (!data.session) {
      return { error: 'Failed to create session' };
    }

    return { error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Forgot password
export async function sendPasswordResetEmail(
  email: string
): Promise<{ error: string | null; message?: string }> {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to send reset email' };
    }

    return { error: null, message: data.message };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function signOut() {
  const supabase = createSupabaseClient();
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
    return { error: error.message };
  }
  
  return { error: null };
}

