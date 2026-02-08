import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// GET /api/products - List products with filters
const filterSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  searchQuery: z.string().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  tab: z.enum(['for-you', 'following', 'new']).optional(),
  sellerIds: z.string().optional(), // Comma-separated seller IDs for following tab
  size: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  cursor: z.string().optional(), // For cursor-based pagination
  exclude_ids: z.string().optional(), // Comma-separated product IDs to exclude (swipe discovery)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = filterSchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '20');
    const offset = (page - 1) * limit;

    const supabase = getServiceSupabase();
    
    // If Supabase is not configured, return mock data
    if (!supabase) {
      logger.log('[DEV MODE] Returning mock product data - Supabase not configured');
      return NextResponse.json({
        data: [],
        page,
        limit,
        total: 0,
        hasMore: false,
      });
    }
    
    // Build query with boost information
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users(id, full_name, avatar_url, location),
        active_boost:product_boosts(id, boost_type, ends_at)
      `, { count: 'exact' })
      .eq('status', 'active')
      .eq('product_boosts.is_active', true)
      .gt('product_boosts.ends_at', new Date().toISOString());

    // Apply seller IDs filter for "following" tab
    if (filters.sellerIds) {
      const sellerIdArray = filters.sellerIds.split(',').filter(id => id.trim());
      if (sellerIdArray.length > 0) {
        query = query.in('seller_id', sellerIdArray);
      }
    }
    
    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.subcategory) {
      query = query.ilike('subcategory', `%${filters.subcategory}%`);
    }
    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice));
    }
    if (filters.location) {
      query = query.ilike('meetup_location', `%${filters.location}%`);
    }
    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }
    // New filters for enhanced marketplace
    if (filters.size) {
      query = query.ilike('size', `%${filters.size}%`);
    }
    if (filters.color) {
      query = query.ilike('color', `%${filters.color}%`);
    }
    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }

    // Exclude already-seen product IDs (for swipe discovery)
    if (filters.exclude_ids) {
      const excludeIdArray = filters.exclude_ids.split(',').map(id => id.trim()).filter(Boolean);
      if (excludeIdArray.length > 0) {
        query = query.not('id', 'in', `(${excludeIdArray.join(',')})`);
      }
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error: queryError, count } = await query;

    if (queryError) {
      throw queryError;
    }

    // Sort boosted products to the top (client-side since Supabase doesn't support ordering by joined table)
    const sortedData = (data || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aBoost = a.active_boost as Array<{ boost_type: string }> | null;
      const bBoost = b.active_boost as Array<{ boost_type: string }> | null;
      const aHasBoost = aBoost && aBoost.length > 0;
      const bHasBoost = bBoost && bBoost.length > 0;
      
      // Featured (homepage_carousel) first, then top_category, then non-boosted
      if (aHasBoost && !bHasBoost) return -1;
      if (!aHasBoost && bHasBoost) return 1;
      if (aHasBoost && bHasBoost) {
        const aFeatured = aBoost?.some(boost => boost.boost_type === 'homepage_carousel');
        const bFeatured = bBoost?.some(boost => boost.boost_type === 'homepage_carousel');
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
      }
      return 0;
    });

    // Transform data to include isBoosted flag
    const transformedData = sortedData.map((product: Record<string, unknown>) => {
      const boosts = product.active_boost as Array<{ boost_type: string }> | null;
      return {
        ...product,
        is_boosted: boosts && boosts.length > 0,
        boost_type: boosts?.[0]?.boost_type || null,
        active_boost: undefined, // Remove the raw boost data
      };
    });

    return NextResponse.json({
      data: transformedData,
      page,
      limit,
      total: count || 0,
      hasMore: count ? offset + limit < count : false,
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
const createProductSchema = z.object({
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
  status: z.enum(['active', 'draft', 'sold']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const productData = createProductSchema.parse(body);

    const supabase = getServiceSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Supabase to create products.' },
        { status: 503 }
      );
    }

    // Check listing limits before creating (only for active listings)
    const targetStatus = productData.status || 'active';
    if (targetStatus === 'active') {
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('can_seller_create_listing', { p_seller_id: user.id });

      if (limitError) {
        logger.error('Error checking listing limits:', limitError);
        // Don't block on error, proceed with creation
      } else if (limitCheck && limitCheck[0]) {
        const { can_create, current_count, listing_limit, tier_id } = limitCheck[0];
        
        if (!can_create) {
          return NextResponse.json(
            { 
              error: `You've reached your listing limit (${current_count}/${listing_limit}). Upgrade your plan to list more items.`,
              code: 'LISTING_LIMIT_REACHED',
              currentCount: current_count,
              limit: listing_limit,
              tier: tier_id,
            },
            { status: 403 }
          );
        }
      }
    }
    
    const { data, error: insertError } = await supabase
      .from('products')
      .insert({
        ...productData,
        seller_id: user.id,
        status: targetStatus,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

