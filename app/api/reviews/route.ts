import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

const COMMENT_MAX_LENGTH = 2000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/reviews?seller_id=...&page=1&limit=20
 * Returns reviews for a seller with average_rating and total count.
 * No auth required (public for seller profile).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('seller_id');
    if (!sellerId) {
      return NextResponse.json(
        { error: 'seller_id is required' },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)))
    );
    const offset = (page - 1) * limit;

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Fetch reviews with reviewer and product
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        seller_id,
        buyer_id,
        product_id,
        order_id,
        rating,
        comment,
        created_at,
        reviewer:users!reviews_buyer_id_fkey(id, full_name, avatar_url),
        product:products(id, title)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get total count and average rating
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (countError) {
      console.error('Error counting reviews:', countError);
    }

    const { data: avgRow, error: avgError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId);

    let average_rating = 0;
    if (!avgError && avgRow && avgRow.length > 0) {
      const sum = avgRow.reduce((s, r) => s + (r.rating ?? 0), 0);
      average_rating = sum / avgRow.length;
    }

    return NextResponse.json({
      data: reviews || [],
      average_rating: Math.round(average_rating * 10) / 10,
      total: count ?? (reviews?.length ?? 0),
      page,
      limit,
      has_more: (count ?? 0) > offset + (reviews?.length ?? 0),
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Body: { order_id: string, rating: number, comment?: string }
 * Caller must be the buyer of the order. Order must be completed.
 * One review per order (order_id unique).
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    let body: { order_id?: string; rating?: number; comment?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { order_id, rating, comment } = body;
    if (!order_id || rating == null) {
      return NextResponse.json(
        { error: 'order_id and rating are required' },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: 'rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    const commentStr =
      comment != null ? String(comment).slice(0, COMMENT_MAX_LENGTH) : null;

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Load order and validate
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, product_id, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed orders' },
        { status: 400 }
      );
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only review orders you purchased' },
        { status: 403 }
      );
    }

    // Check no existing review for this order
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this order' },
        { status: 400 }
      );
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        seller_id: order.seller_id,
        buyer_id: order.buyer_id,
        product_id: order.product_id ?? null,
        order_id: order.id,
        rating: ratingNum,
        comment: commentStr || null,
      })
      .select('id, seller_id, buyer_id, product_id, order_id, rating, comment, created_at')
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return NextResponse.json(
        { error: 'Failed to save review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    );
  }
}
