import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Bulk product schema
const bulkProductSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['mens', 'womens', 'kids', 'sports', 'clothing', 'shoes', 'accessories', 'bags', 'vintage', 'trending', 'sale']),
  subcategory: z.string().min(1, 'Subcategory is required'),
  size: z.string().optional(),
  condition: z.enum(['brand_new', 'like_new', 'excellent', 'good', 'fair']),
  brand: z.string().optional(),
  images: z.array(z.string()).min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  delivery_method: z.enum(['pickup', 'shipping', 'both']),
  meetup_location: z.string().optional(),
  shipping_cost: z.number().optional(),
  status: z.enum(['active', 'draft']).optional().default('active'),
});

const bulkUploadSchema = z.object({
  products: z.array(bulkProductSchema).min(1, 'At least one product is required').max(50, 'Maximum 50 products per batch'),
});

/**
 * POST /api/products/bulk
 * Bulk create products - Requires Growth tier or higher
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

    // Check user's subscription tier - must be Growth or Pro
    const { data: planData } = await supabase
      .rpc('get_seller_plan', { p_seller_id: user.id });

    const plan = planData?.[0];
    const isActive = plan?.tier_id === 'free' || 
      (plan?.current_period_end && new Date(plan.current_period_end) > new Date());
    const userTier = isActive ? plan?.tier_id : 'free';

    if (!userTier || !['growth', 'pro'].includes(userTier)) {
      return NextResponse.json({
        error: 'Bulk upload requires Growth plan or higher',
        code: 'TIER_REQUIRED',
        requiredTier: 'growth',
        currentTier: userTier || 'free',
      }, { status: 403 });
    }

    const body = await request.json();
    const { products } = bulkUploadSchema.parse(body);

    // Check listing limits
    const { data: limitCheck } = await supabase
      .rpc('can_seller_create_listing', { p_seller_id: user.id });

    if (limitCheck && limitCheck[0]) {
      const { current_count, listing_limit } = limitCheck[0];
      const activeProductsCount = products.filter(p => p.status !== 'draft').length;
      
      if (listing_limit && current_count + activeProductsCount > listing_limit) {
        const remaining = Math.max(0, listing_limit - current_count);
        return NextResponse.json({
          error: `You can only add ${remaining} more active listings. You're trying to add ${activeProductsCount}.`,
          code: 'LISTING_LIMIT_EXCEEDED',
          currentCount: current_count,
          limit: listing_limit,
          attempting: activeProductsCount,
          remaining,
        }, { status: 403 });
      }
    }

    // Insert products in bulk
    const productsToInsert = products.map(product => ({
      ...product,
      seller_id: user.id,
      status: product.status || 'active',
    }));

    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select();

    if (insertError) {
      logger.error('Bulk insert error:', insertError);
      return NextResponse.json({
        error: 'Failed to create products',
        details: insertError.message,
      }, { status: 500 });
    }

    logger.log(`Bulk uploaded ${insertedProducts?.length || 0} products for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedProducts?.length || 0} products`,
      products: insertedProducts,
      count: insertedProducts?.length || 0,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }

    logger.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/bulk/template
 * Get CSV template for bulk upload
 */
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  // Return template structure
  const template = {
    fields: [
      { name: 'title', required: true, description: 'Product title (min 5 chars)', example: 'Vintage Nike Air Jordan' },
      { name: 'description', required: true, description: 'Product description (min 20 chars)', example: 'Original 1990s Air Jordan sneakers in great condition...' },
      { name: 'price', required: true, description: 'Price in KES', example: 5000 },
      { name: 'category', required: true, description: 'Product category', options: ['mens', 'womens', 'kids', 'sports', 'clothing', 'shoes', 'accessories', 'bags', 'vintage'] },
      { name: 'subcategory', required: true, description: 'Product subcategory', example: 'Sneakers' },
      { name: 'condition', required: true, description: 'Product condition', options: ['brand_new', 'like_new', 'excellent', 'good', 'fair'] },
      { name: 'size', required: false, description: 'Size (if applicable)', example: 'US 10' },
      { name: 'brand', required: false, description: 'Brand name', example: 'Nike' },
      { name: 'images', required: true, description: 'Array of image URLs (1-5)', example: ['https://example.com/image1.jpg'] },
      { name: 'delivery_method', required: true, description: 'Delivery options', options: ['pickup', 'shipping', 'both'] },
      { name: 'meetup_location', required: false, description: 'Meetup location for pickup', example: 'Nairobi CBD' },
      { name: 'shipping_cost', required: false, description: 'Shipping cost in KES', example: 200 },
      { name: 'status', required: false, description: 'Product status (default: active)', options: ['active', 'draft'] },
    ],
    example: [
      {
        title: 'Vintage Nike Air Jordan',
        description: 'Original 1990s Air Jordan sneakers in excellent condition. Size US 10. Rare colorway.',
        price: 5000,
        category: 'shoes',
        subcategory: 'Sneakers',
        condition: 'excellent',
        size: 'US 10',
        brand: 'Nike',
        images: ['https://example.com/jordan1.jpg', 'https://example.com/jordan2.jpg'],
        delivery_method: 'both',
        meetup_location: 'Nairobi CBD',
        shipping_cost: 200,
        status: 'active',
      },
    ],
  };

  return NextResponse.json(template);
}
