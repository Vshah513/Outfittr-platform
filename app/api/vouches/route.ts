import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';
import { VouchTag } from '@/types';

const VALID_VOUCH_TAGS: VouchTag[] = [
  'item_as_described',
  'smooth_meetup',
  'good_communication',
  'quick_delivery',
];

// GET /api/vouches - Get vouches for a seller
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('seller_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!sellerId) {
      return NextResponse.json(
        { error: 'seller_id is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json({ data: [], total: 0 });
    }

    // Get vouches with buyer and product info
    const { data: vouches, error, count } = await supabase
      .from('vouches')
      .select(`
        *,
        buyer:users!vouches_buyer_id_fkey(id, full_name, avatar_url),
        product:products(id, title, images)
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate tag summary
    const tagCounts: Record<string, number> = {};
    for (const vouch of vouches || []) {
      for (const tag of vouch.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return NextResponse.json({
      data: vouches || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? offset + limit < count : false,
      tag_summary: tagCounts,
    });
  } catch (error) {
    console.error('Error fetching vouches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouches' },
      { status: 500 }
    );
  }
}

// POST /api/vouches - Create a vouch for a seller
const createVouchSchema = z.object({
  product_id: z.string().uuid(),
  tags: z.array(z.enum([
    'item_as_described',
    'smooth_meetup',
    'good_communication',
    'quick_delivery',
  ])).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, tags } = createVouchSchema.parse(body);

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get the product to verify it's sold and buyer is eligible
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status, sold_to_id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is sold
    if (product.status !== 'sold') {
      return NextResponse.json(
        { error: 'Can only vouch for completed purchases' },
        { status: 400 }
      );
    }

    // Check if current user was the buyer (sold_to_id) or had a conversation about this product
    const isBuyer = product.sold_to_id === user.id;
    
    if (!isBuyer) {
      // Fall back to checking if user had a conversation about this product
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('product_id', product_id)
        .eq('sender_id', user.id)
        .limit(1);
      
      if (!messages || messages.length === 0) {
        return NextResponse.json(
          { error: 'You can only vouch for items you purchased' },
          { status: 403 }
        );
      }
    }

    // Can't vouch for yourself
    if (product.seller_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot vouch for yourself' },
        { status: 400 }
      );
    }

    // Check if already vouched
    const { data: existingVouch } = await supabase
      .from('vouches')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (existingVouch) {
      return NextResponse.json(
        { error: 'You have already vouched for this purchase' },
        { status: 400 }
      );
    }

    // Create the vouch
    const { data: vouch, error: vouchError } = await supabase
      .from('vouches')
      .insert({
        seller_id: product.seller_id,
        buyer_id: user.id,
        product_id: product_id,
        tags: tags,
      })
      .select(`
        *,
        buyer:users!vouches_buyer_id_fkey(id, full_name, avatar_url),
        product:products(id, title, images)
      `)
      .single();

    if (vouchError) throw vouchError;

    return NextResponse.json({ data: vouch }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating vouch:', error);
    return NextResponse.json(
      { error: 'Failed to create vouch' },
      { status: 500 }
    );
  }
}

// DELETE /api/vouches?product_id=xxx - Delete own vouch
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { error: deleteError } = await supabase
      .from('vouches')
      .delete()
      .eq('buyer_id', user.id)
      .eq('product_id', productId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vouch:', error);
    return NextResponse.json(
      { error: 'Failed to delete vouch' },
      { status: 500 }
    );
  }
}


