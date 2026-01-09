// DORMANT: For future SMS integration
// This route is not currently used in the auth flow. It will be re-enabled when SMS provider is configured.

import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, formatKenyanPhoneNumber } from '@/lib/sms';
import { getServiceSupabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimit';
import { z } from 'zod';

const phoneSchema = z.object({
  phoneNumber: z.string().min(9, 'Phone number must be at least 9 digits'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 requests per minute per IP
    const identifier = getRateLimitIdentifier(request);
    const limit = rateLimit(identifier, 5, 60000);
    
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': limit.remaining.toString(),
            'X-RateLimit-Reset': new Date(limit.resetAt).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { phoneNumber } = phoneSchema.parse(body);

    // Format phone number to Kenya format
    const formattedPhone = formatKenyanPhoneNumber(phoneNumber);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if user exists (skip database check if Supabase not configured)
    let existingUser = null;
    const supabase = getServiceSupabase();
    
    if (supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', formattedPhone)
          .single();
        existingUser = data;
      } catch (dbError) {
        logger.log('Database check skipped:', dbError);
        // Continue without database check in development
      }
    } else {
      logger.log('[DEV MODE] Skipping database check - Supabase not configured');
    }

    // Send OTP via SMS
    const result = await sendOTP(formattedPhone, otp);

    if (!result.success) {
      logger.error('SMS sending failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // For development, log OTP
    logger.log(`OTP for ${formattedPhone}: ${otp}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      phoneNumber: formattedPhone,
      isNewUser: !existingUser,
      // In development, return OTP for testing
      otp: otp, // Always return in development for easy testing
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}

