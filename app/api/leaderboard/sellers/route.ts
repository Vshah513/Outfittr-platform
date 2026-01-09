import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { LeaderboardData, LeaderboardSeller } from '@/types';

// GET /api/leaderboard/sellers - Get top sellers for current month
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get current month name and year
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    // Fetch top sellers by sales
    const { data: topBySales, error: salesError } = await supabase
      .rpc('get_top_sellers_by_sales', { p_limit_count: 10 });

    if (salesError) {
      console.error('Error fetching top sellers by sales:', salesError);
      // Continue with empty array if there's an error
    }

    // Fetch top sellers by views
    const { data: topByViews, error: viewsError } = await supabase
      .rpc('get_top_sellers_by_views', { p_limit_count: 10 });

    if (viewsError) {
      console.error('Error fetching top sellers by views:', viewsError);
      // Continue with empty array if there's an error
    }

    // Transform the data to match our TypeScript types
    const transformSeller = (seller: any): LeaderboardSeller => ({
      seller_id: seller.seller_id,
      full_name: seller.full_name || 'Unknown Seller',
      avatar_url: seller.avatar_url || undefined,
      location: seller.location || undefined,
      items_sold: seller.items_sold || undefined,
      total_views: seller.total_views || undefined,
      follower_count: Number(seller.follower_count) || 0,
      rating: seller.rating ? Number(seller.rating) : undefined,
      rank_position: seller.rank_position || 0,
    });

    const leaderboardData: LeaderboardData = {
      topBySales: (topBySales || []).map(transformSeller),
      topByViews: (topByViews || []).map(transformSeller),
      month,
      year,
    };

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

