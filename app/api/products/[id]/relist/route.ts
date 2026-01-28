import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * POST /api/products/[id]/relist
 * Relist a sold product as a new active listing
 * Requires Growth tier or higher
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Check user's subscription tier - must be Growth or Pro for auto-relist
    const { data: planData } = await supabase
      .rpc('get_seller_plan', { p_seller_id: user.id });

    const plan = planData?.[0];
    const isActive = plan?.tier_id === 'free' || 
      (plan?.current_period_end && new Date(plan.current_period_end) > new Date());
    const userTier = isActive ? plan?.tier_id : 'free';

    if (!userTier || !['growth', 'pro'].includes(userTier)) {
      return NextResponse.json({
        error: 'Auto-relist requires Growth plan or higher',
        code: 'TIER_REQUIRED',
        requiredTier: 'growth',
        currentTier: userTier || 'free',
      }, { status: 403 });
    }

    // Get the original product
    const { data: originalProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify ownership
    if (originalProduct.seller_id !== user.id) {
      return NextResponse.json({ error: 'You can only relist your own products' }, { status: 403 });
    }

    // Check if product is sold
    if (originalProduct.status !== 'sold') {
      return NextResponse.json({ 
        error: 'Only sold products can be relisted',
        currentStatus: originalProduct.status,
      }, { status: 400 });
    }

    // Check listing limits
    const { data: limitCheck } = await supabase
      .rpc('can_seller_create_listing', { p_seller_id: user.id });

    if (limitCheck && limitCheck[0] && !limitCheck[0].can_create) {
      const { current_count, listing_limit } = limitCheck[0];
      return NextResponse.json({
        error: `You've reached your listing limit (${current_count}/${listing_limit}). Upgrade your plan to list more items.`,
        code: 'LISTING_LIMIT_REACHED',
        currentCount: current_count,
        limit: listing_limit,
      }, { status: 403 });
    }

    // Parse request body for optional updates
    let updates = {};
    try {
      const body = await request.json();
      updates = body || {};
    } catch {
      // No body provided, use original values
    }

    // Create a new listing based on the original
    const newProduct = {
      seller_id: user.id,
      title: updates.title || originalProduct.title,
      description: updates.description || originalProduct.description,
      price: updates.price || originalProduct.price,
      category: originalProduct.category,
      subcategory: originalProduct.subcategory,
      condition: updates.condition || originalProduct.condition,
      size: originalProduct.size,
      color: originalProduct.color,
      brand: originalProduct.brand,
      images: originalProduct.images,
      delivery_method: originalProduct.delivery_method,
      meetup_location: originalProduct.meetup_location,
      shipping_cost: originalProduct.shipping_cost,
      status: 'active',
      view_count: 0, // Reset view count for new listing
    };

    const { data: newListing, error: insertError } = await supabase
      .from('products')
      .insert(newProduct)
      .select()
      .single();

    if (insertError) {
      logger.error('Relist insert error:', insertError);
      return NextResponse.json({
        error: 'Failed to create new listing',
        details: insertError.message,
      }, { status: 500 });
    }

    logger.log(`Product ${productId} relisted as ${newListing.id} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Product successfully relisted',
      originalProductId: productId,
      newProduct: newListing,
    }, { status: 201 });

  } catch (error) {
    logger.error('Relist error:', error);
    return NextResponse.json(
      { error: 'Failed to relist product' },
      { status: 500 }
    );
  }
}
