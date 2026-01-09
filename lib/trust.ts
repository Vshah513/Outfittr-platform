import { ResponseTimeTier, SellerTrustMetrics, VouchTagCount, VouchTag } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Calculate the response time tier based on average hours to first reply
 */
export function getResponseTimeTier(avgHours: number | null): ResponseTimeTier {
  if (avgHours === null) return 'unknown';
  if (avgHours <= 1) return 'fast';
  if (avgHours <= 24) return 'same_day';
  return 'slow';
}

/**
 * Calculate average first reply time for a seller from messaging data
 * 
 * This looks at conversations where:
 * 1. Someone else sent the first message to the seller
 * 2. The seller replied at some point
 * 
 * We then calculate the average time between the first message and the seller's first reply.
 */
export async function calculateSellerResponseTime(
  supabase: SupabaseClient,
  sellerId: string
): Promise<{ avgHours: number | null; tier: ResponseTimeTier }> {
  try {
    // Get all messages where seller is the recipient (first messages sent to them)
    // and messages where seller is sender (their replies)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('conversation_id, sender_id, recipient_id, created_at')
      .or(`sender_id.eq.${sellerId},recipient_id.eq.${sellerId}`)
      .order('created_at', { ascending: true });

    if (error || !messages || messages.length === 0) {
      return { avgHours: null, tier: 'unknown' };
    }

    // Group messages by conversation
    const conversationMap = new Map<string, typeof messages>();
    for (const msg of messages) {
      const existing = conversationMap.get(msg.conversation_id) || [];
      existing.push(msg);
      conversationMap.set(msg.conversation_id, existing);
    }

    const responseTimes: number[] = [];

    // For each conversation, find first message to seller and their first reply
    for (const [, convMessages] of conversationMap) {
      // Sort by time (should already be sorted)
      convMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Find first message TO the seller (where seller is recipient)
      const firstMessageToSeller = convMessages.find(
        m => m.recipient_id === sellerId
      );

      if (!firstMessageToSeller) continue;

      // Find seller's first reply AFTER that message
      const firstReply = convMessages.find(
        m => m.sender_id === sellerId && 
             new Date(m.created_at).getTime() > new Date(firstMessageToSeller.created_at).getTime()
      );

      if (firstReply) {
        const responseTimeMs = 
          new Date(firstReply.created_at).getTime() - 
          new Date(firstMessageToSeller.created_at).getTime();
        const responseTimeHours = responseTimeMs / (1000 * 60 * 60);
        responseTimes.push(responseTimeHours);
      }
    }

    if (responseTimes.length === 0) {
      return { avgHours: null, tier: 'unknown' };
    }

    // Calculate average
    const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const tier = getResponseTimeTier(avgHours);

    return { avgHours, tier };
  } catch (error) {
    console.error('Error calculating response time:', error);
    return { avgHours: null, tier: 'unknown' };
  }
}

/**
 * Get vouch tag counts for a seller
 */
export async function getVouchTagCounts(
  supabase: SupabaseClient,
  sellerId: string
): Promise<VouchTagCount[]> {
  try {
    const { data: vouches, error } = await supabase
      .from('vouches')
      .select('tags')
      .eq('seller_id', sellerId);

    if (error || !vouches) {
      return [];
    }

    // Count occurrences of each tag
    const tagCounts = new Map<VouchTag, number>();
    for (const vouch of vouches) {
      const tags = vouch.tags as VouchTag[];
      for (const tag of tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    // Convert to array and sort by count descending
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting vouch tag counts:', error);
    return [];
  }
}

/**
 * Get total vouch count for a seller
 */
export async function getVouchCount(
  supabase: SupabaseClient,
  sellerId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('vouches')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting vouch count:', error);
    return 0;
  }
}

/**
 * Build complete trust metrics for a seller
 */
export async function buildSellerTrustMetrics(
  supabase: SupabaseClient,
  seller: {
    id: string;
    phone_number?: string | null;
    email_verified?: boolean;
    last_active_at?: string | null;
  }
): Promise<SellerTrustMetrics> {
  // Get response time data
  const responseTime = await calculateSellerResponseTime(supabase, seller.id);
  
  // Get vouch data
  const [vouchCount, vouchTags] = await Promise.all([
    getVouchCount(supabase, seller.id),
    getVouchTagCounts(supabase, seller.id),
  ]);

  return {
    phone_verified: !!seller.phone_number,
    email_verified: !!seller.email_verified,
    last_active_at: seller.last_active_at || null,
    response_time_tier: responseTime.tier,
    response_time_hours: responseTime.avgHours,
    vouch_count: vouchCount,
    vouch_tags: vouchTags,
  };
}

/**
 * Check if last active is within a time window
 */
export function isActiveWithin(lastActiveAt: string | null, hours: number): boolean {
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  return diffHours <= hours;
}

/**
 * Update user's last_active_at timestamp
 */
export async function updateLastActive(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating last active:', error);
  }
}


