import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/db';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimit';

// Create admin client for user creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 registrations per 15 minutes per IP
    const identifier = getRateLimitIdentifier(request);
    const limit = rateLimit(identifier, 3, 15 * 60000);
    
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': limit.remaining.toString(),
            'X-RateLimit-Reset': new Date(limit.resetAt).toISOString(),
          },
        }
      );
    }

    const { email, password, username, fullName } = await request.json();

    // Validate required fields
    if (!email || !password || !username || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, username, and display name are required' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, underscores, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { data: existingUsername } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const { data: existingEmail } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    // Create Supabase auth user (without email confirmation for now)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        full_name: fullName,
        username: username.toLowerCase(),
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create user record in our users table
    const { error: userError } = await serviceSupabase.from('users').insert({
      supabase_user_id: authData.user.id,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      full_name: fullName,
      user_type: 'buyer',
      email_verified: true, // Since we auto-confirmed
    });

    if (userError) {
      console.error('User table insert error:', userError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create account. Please try again.';
      if (userError.code === '23505') {
        // Unique constraint violation
        if (userError.message.includes('username')) {
          errorMessage = 'This username is already taken.';
        } else if (userError.message.includes('email')) {
          errorMessage = 'An account with this email already exists.';
        }
      } else if (userError.code === '23503') {
        // Foreign key constraint
        errorMessage = 'Account setup failed. Please try again.';
      } else if (userError.message) {
        // Log the actual error for debugging but show a user-friendly message
        console.error('Detailed error:', userError.message, userError.code, userError.details);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

