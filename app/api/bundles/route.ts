import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { z } from 'zod';
import { formatPrice } from '@/lib/utils';

// GET /api/bundles - Get user's bundle requests
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer'; // 'buyer' or 'seller'

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json({ data: [] });
    }

    // Expire old reservations first
    await supabase.rpc('expire_bundle_reservations');

    const query = supabase
      .from('bundle_requests')
      .select(`
        *,
        buyer:users!bundle_requests_buyer_id_fkey(id, full_name, avatar_url),
        seller:users!bundle_requests_seller_id_fkey(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (role === 'seller') {
      query.eq('seller_id', session.userId);
    } else {
      query.eq('buyer_id', session.userId);
    }

    const { data: bundles, error } = await query;

    if (error) throw error;

    // Fetch products for each bundle
    const bundlesWithProducts = await Promise.all(
      (bundles || []).map(async (bundle) => {
        const { data: products } = await supabase
          .from('products')
          .select('id, title, price, images, status, reserved_by, reserved_until')
          .in('id', bundle.product_ids);
        
        return {
          ...bundle,
          products: products || [],
        };
      })
    );

    return NextResponse.json({ data: bundlesWithProducts });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    );
  }
}

// POST /api/bundles - Create a bundle request
const createBundleSchema = z.object({
  seller_id: z.string().uuid(),
  product_ids: z.array(z.string().uuid()).min(1, 'At least one product required'),
  offer_amount: z.number().positive().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const body = await request.json();
    const { seller_id, product_ids, offer_amount } = createBundleSchema.parse(body);

    // Can't bundle with yourself
    if (seller_id === session.userId) {
      return NextResponse.json(
        { error: 'You cannot create a bundle request for your own products' },
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

    // Verify all products exist, belong to seller, and are active
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, seller_id, status, reserved_by')
      .in('id', product_ids);

    if (productsError) throw productsError;

    if (!products || products.length !== product_ids.length) {
      return NextResponse.json(
        { error: 'Some products were not found' },
        { status: 400 }
      );
    }

    // Check all products belong to the seller
    const wrongSeller = products.find(p => p.seller_id !== seller_id);
    if (wrongSeller) {
      return NextResponse.json(
        { error: 'All products must belong to the same seller' },
        { status: 400 }
      );
    }

    // Check all products are active
    const inactiveProduct = products.find(p => p.status !== 'active');
    if (inactiveProduct) {
      return NextResponse.json(
        { error: `Product "${inactiveProduct.title}" is no longer available` },
        { status: 400 }
      );
    }

    // Check no products are reserved by someone else
    const reservedProduct = products.find(
      p => p.reserved_by && p.reserved_by !== session.userId
    );
    if (reservedProduct) {
      return NextResponse.json(
        { error: `Product "${reservedProduct.title}" is currently reserved` },
        { status: 400 }
      );
    }

    // Create or get existing conversation with seller
    const { data: existingConversation } = await supabase
      .from('messages')
      .select('conversation_id')
      .or(`and(sender_id.eq.${session.userId},recipient_id.eq.${seller_id}),and(sender_id.eq.${seller_id},recipient_id.eq.${session.userId})`)
      .limit(1)
      .single();

    const conversationId = existingConversation?.conversation_id || crypto.randomUUID();

    // Calculate total
    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);

    // Create bundle request
    const { data: bundle, error: bundleError } = await supabase
      .from('bundle_requests')
      .insert({
        buyer_id: session.userId,
        seller_id: seller_id,
        conversation_id: conversationId,
        product_ids: product_ids,
        offer_amount: offer_amount,
        status: 'pending',
      })
      .select()
      .single();

    if (bundleError) throw bundleError;

    // Create a message for the bundle request
    const itemsList = products.map(p => `• ${p.title} (${formatPrice(p.price)})`).join('\n');
    const messageContent = `📦 Bundle Request\n\n${itemsList}\n\nTotal: ${formatPrice(totalPrice)}${offer_amount ? `\nMy offer: ${formatPrice(offer_amount)}` : ''}\n\n[Bundle ID: ${bundle.id}]`;

    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: session.userId,
        recipient_id: seller_id,
        content: messageContent,
      });

    return NextResponse.json({ 
      data: {
        ...bundle,
        conversation_id: conversationId,
        products,
      } 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to create bundle request' },
      { status: 500 }
    );
  }
}


