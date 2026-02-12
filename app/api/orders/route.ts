import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

/**
 * GET /api/orders
 * Get orders for the authenticated user (as buyer or seller)
 * 
 * Query params:
 * - role: 'buyer' | 'seller' (default: 'buyer')
 * - status: 'pending' | 'completed' | 'failed' | 'refunded' (optional)
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        product:products(id, title, price, images, status, category, condition),
        buyer:users!orders_buyer_id_fkey(id, full_name, avatar_url),
        seller:users!orders_seller_id_fkey(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by role
    if (role === 'seller') {
      query = query.eq('seller_id', user.id);
    } else {
      query = query.eq('buyer_id', user.id);
    }

    // Optional status filter
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const orderList = orders || [];

    // Attach review_id and can_review for each order (for buyers, completed orders only)
    if (orderList.length > 0 && role === 'buyer') {
      const completedOrderIds = orderList
        .filter((o: { status: string }) => o.status === 'completed')
        .map((o: { id: string }) => o.id);

      if (completedOrderIds.length > 0) {
        const { data: reviewRows } = await supabase
          .from('reviews')
          .select('id, order_id')
          .in('order_id', completedOrderIds);

        const reviewByOrderId = new Map<string, string>();
        (reviewRows || []).forEach((r: { id: string; order_id: string | null }) => {
          if (r.order_id) reviewByOrderId.set(r.order_id, r.id);
        });

        orderList.forEach((o: { id: string; status: string; review_id?: string | null; can_review?: boolean }) => {
          const reviewId = reviewByOrderId.get(o.id) ?? null;
          o.review_id = reviewId;
          o.can_review = o.status === 'completed' && !reviewId;
        });
      } else {
        orderList.forEach((o: { status: string; review_id?: null; can_review?: boolean }) => {
          o.review_id = null;
          o.can_review = o.status === 'completed';
        });
      }
    } else {
      orderList.forEach((o: { review_id?: null; can_review?: boolean }) => {
        o.review_id = null;
        o.can_review = false;
      });
    }

    return NextResponse.json({ orders: orderList });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
