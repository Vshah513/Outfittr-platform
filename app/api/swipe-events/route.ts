import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const swipeEventSchema = z.object({
  event: z.enum(['impression', 'swipe_left', 'swipe_right', 'fullscreen_open']),
  product_id: z.string().uuid(),
});

// POST /api/swipe-events - Log a swipe/discovery event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, product_id } = swipeEventSchema.parse(body);

    // Auth is optional -- anonymous impressions and skips are allowed
    let userId: string | null = null;
    try {
      const { user } = await getAuthenticatedUser(request);
      userId = user?.id || null;
    } catch {
      // Not authenticated -- that's fine
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      // In dev mode without DB, just acknowledge
      logger.log('[DEV MODE] Swipe event logged (no DB):', event, product_id);
      return NextResponse.json({ success: true });
    }

    // Insert into swipe_events table
    // If the table doesn't exist yet, log and return success (non-blocking analytics)
    const { error } = await supabase.from('swipe_events').insert({
      user_id: userId,
      product_id,
      event_type: event,
    });

    if (error) {
      // Log but don't fail the request -- analytics are non-critical
      logger.error('Error logging swipe event:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Error in swipe-events API:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}
