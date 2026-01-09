import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';

/**
 * GET /api/subscriptions/tiers
 * Get all available subscription tiers (public endpoint)
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      // Return hardcoded tiers if database not configured
      return NextResponse.json({
        tiers: [
          {
            id: 'free',
            name: 'Free',
            price_kes: 0,
            active_listings_limit: 25,
            features: ['Basic selling', 'Up to 25 active listings'],
          },
          {
            id: 'base',
            name: 'Base',
            price_kes: 400,
            active_listings_limit: 100,
            features: ['Up to 100 active listings', 'Basic analytics', 'Priority in search'],
          },
          {
            id: 'growth',
            name: 'Growth',
            price_kes: 1000,
            active_listings_limit: 300,
            features: [
              'Up to 300 active listings',
              'Advanced analytics',
              'Bulk upload tools',
              'Auto-relist',
              'Trending badge eligibility',
            ],
          },
          {
            id: 'pro',
            name: 'Pro',
            price_kes: 4000,
            active_listings_limit: null,
            features: [
              'Unlimited listings',
              'Priority support',
              'Featured seller badge',
              'Demand insights dashboard',
              'All Growth features',
            ],
          },
        ],
      });
    }

    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price_kes', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tiers: tiers || [] });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
  }
}

