import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

/**
 * GET /api/boosts
 * Get boost packages and seller's active boosts
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Get available boost packages
    const { data: packages, error: packagesError } = await supabase
      .from('boost_packages')
      .select('*')
      .order('price_kes', { ascending: true });

    if (packagesError) {
      throw packagesError;
    }

    // If user is authenticated, get their active boosts
    let activeBoosts: unknown[] = [];
    if (user) {
      const { data: boosts, error: boostsError } = await supabase
        .from('product_boosts')
        .select(`
          *,
          product:products(id, title, images)
        `)
        .eq('seller_id', user.id)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true });

      if (!boostsError) {
        activeBoosts = boosts || [];
      }
    }

    return NextResponse.json({
      packages: packages || [],
      activeBoosts,
    });
  } catch (error) {
    console.error('Error fetching boosts:', error);
    return NextResponse.json({ error: 'Failed to fetch boosts' }, { status: 500 });
  }
}

/**
 * POST /api/boosts
 * Get boost status for a specific product or initiate boost purchase
 * Body: { productId: string, action?: 'status' | 'check' }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { productId, action = 'status' } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, title, status')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.seller_id !== user.id) {
      return NextResponse.json({ error: 'Not your product' }, { status: 403 });
    }

    if (product.status !== 'active') {
      return NextResponse.json({ error: 'Can only boost active listings' }, { status: 400 });
    }

    // Get active boost for this product
    const { data: activeBoost } = await supabase
      .from('product_boosts')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())
      .order('ends_at', { ascending: false })
      .limit(1)
      .single();

    // Get boost packages
    const { data: packages } = await supabase
      .from('boost_packages')
      .select('*')
      .order('price_kes', { ascending: true });

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
      },
      activeBoost: activeBoost || null,
      packages: packages || [],
      canBoost: !activeBoost,
    });
  } catch (error) {
    console.error('Error checking boost status:', error);
    return NextResponse.json({ error: 'Failed to check boost status' }, { status: 500 });
  }
}

