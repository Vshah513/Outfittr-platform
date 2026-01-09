// DORMANT: For future SMS integration
// This route is not currently used in the auth flow. It will be re-enabled when SMS provider is configured.

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/sms';
import { getServiceSupabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifySchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  fullName: z.string().optional(),
  userType: z.enum(['buyer', 'seller', 'both']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otp, fullName, userType } = verifySchema.parse(body);

    // Verify OTP
    const otpResult = await verifyOTP(phoneNumber, otp);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || 'Invalid OTP code' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // If Supabase is not configured, use a mock user for development
    if (!supabase) {
      logger.log('[DEV MODE] Supabase not configured, using mock user');
      
      const mockUser = {
        id: 'dev-user-' + Date.now(),
        phone_number: phoneNumber,
        full_name: fullName || 'Test User',
        user_type: userType || 'buyer',
        avatar_url: null,
        location: null,
      };

      const sessionToken = Buffer.from(JSON.stringify({ userId: mockUser.id, phoneNumber })).toString('base64');

      const response = NextResponse.json({
        message: 'Authentication successful (DEV MODE)',
        user: mockUser,
      });

      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // Check if user exists
    let user = null;
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (!fetchError) {
        user = data;
      }
    } catch (dbError) {
      logger.log('Database query error:', dbError);
    }

    // If user doesn't exist, create new user
    if (!user && fullName) {
      try {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone_number: phoneNumber,
            full_name: fullName,
            user_type: userType || 'buyer',
          })
          .select()
          .single();

        if (createError) {
          logger.error('Error creating user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
          );
        }

        user = newUser;
      } catch (createErr) {
        logger.error('User creation error:', createErr);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please provide your name to sign up.' },
        { status: 404 }
      );
    }

    // Update last active
    try {
      await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (updateErr) {
      logger.log('Could not update last_active_at:', updateErr);
    }

    // Create session token (in production, use proper JWT)
    const sessionToken = Buffer.from(JSON.stringify({ userId: user.id, phoneNumber })).toString('base64');

    const response = NextResponse.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        user_type: user.user_type,
        avatar_url: user.avatar_url,
        location: user.location,
      },
    });

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

