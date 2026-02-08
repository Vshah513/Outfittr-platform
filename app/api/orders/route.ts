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

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
