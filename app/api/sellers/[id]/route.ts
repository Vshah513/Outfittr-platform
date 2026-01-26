import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { buildSellerTrustMetrics } from '@/lib/trust';

// GET /api/sellers/[id] - Get seller profile with trust metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const listingsPage = parseInt(searchParams.get('listingsPage') || '1');
    const listingsLimit = parseInt(searchParams.get('listingsLimit') || '12');
    const listingsOffset = (listingsPage - 1) * listingsLimit;
    const tab = searchParams.get('tab') || 'active'; // 'active' or 'sold'

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get seller info
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Build trust metrics
    const trustMetrics = await buildSellerTrustMetrics(supabase, seller);

    // Get listings count
    const { count: activeCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', id)
      .eq('status', 'active');

    const { count: soldCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', id)
      .eq('status', 'sold');

    // Get paginated listings based on tab
    const listingsQuery = supabase
      .from('products')
      .select('*')
      .eq('seller_id', id)
      .eq('status', tab)
      .order('created_at', { ascending: false })
      .range(listingsOffset, listingsOffset + listingsLimit - 1);

    const { data: listings, error: listingsError } = await listingsQuery;

    if (listingsError) {
      throw listingsError;
    }

    // Check if current user is following this seller
    let isFollowing = false;
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      try {
        const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', session.userId)
          .eq('seller_id', id)
          .single();
        isFollowing = !!followData;
      } catch {
        // User not logged in or error, default to not following
      }
    }

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', id);

    // Get real-time total views from product_views table for active products
    // First get all active product IDs for this seller
    const { data: activeProductIds } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', id)
      .eq('status', 'active');
    
    let totalViews = 0;
    if (activeProductIds && activeProductIds.length > 0) {
      const productIds = activeProductIds.map(p => p.id);
      const { count } = await supabase
        .from('product_views')
        .select('id', { count: 'exact', head: true })
        .in('product_id', productIds);
      totalViews = count || 0;
    }

    // Get seller's subscription plan
    let sellerPlan = {
      tier_id: 'free',
      tier_name: 'Free',
      is_active: true,
      is_pro: false,
      is_featured: false,
    };
    
    try {
      const { data: planData } = await supabase
        .rpc('get_seller_plan', { p_seller_id: id });
      
      if (planData && planData[0]) {
        const plan = planData[0];
        sellerPlan = {
          tier_id: plan.tier_id || 'free',
          tier_name: plan.tier_name || 'Free',
          is_active: plan.is_active ?? true,
          is_pro: plan.tier_id === 'pro',
          is_featured: plan.tier_id === 'pro' || plan.tier_id === 'growth',
        };
      }
    } catch (planError) {
      console.error('Error fetching seller plan:', planError);
      // Default to free plan on error
    }

    return NextResponse.json({
      data: {
        ...seller,
        trust_metrics: trustMetrics,
        listings_count: activeCount || 0,
        sold_count: soldCount || 0,
        follower_count: followerCount || 0,
        total_views: totalViews || 0,
        is_following: isFollowing,
        seller_plan: sellerPlan,
        listings: listings || [],
        listings_pagination: {
          page: listingsPage,
          limit: listingsLimit,
          total: tab === 'active' ? activeCount : soldCount,
          hasMore: (tab === 'active' ? activeCount : soldCount) 
            ? listingsOffset + listingsLimit < (tab === 'active' ? activeCount! : soldCount!)
            : false,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller' },
      { status: 500 }
    );
  }
}


