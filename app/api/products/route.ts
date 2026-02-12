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

    // Build exclude list: client seen IDs + saved items for authenticated user (so saved items don't reappear until removed from cart)
    // Listings are public: never require auth for GET. If auth fails or is missing, we still return products.
    let excludeIdSet = new Set<string>();
    if (filters.exclude_ids) {
      filters.exclude_ids.split(',').map(id => id.trim()).filter(Boolean).forEach(id => excludeIdSet.add(id));
    }
    let user: { id: string } | null = null;
    try {
      const auth = await getAuthenticatedUser(request);
      user = auth.user;
    } catch {
      // Unauthenticated or auth error: continue without excluding saved items
    }
    if (user) {
      const { data: savedRows } = await supabase
        .from('saved_items')
        .select('product_id')
        .eq('user_id', user.id);
      if (savedRows?.length) {
        savedRows.forEach((row: { product_id: string }) => excludeIdSet.add(row.product_id));
      }
    }
    const excludeIdArray = [...excludeIdSet];
    
    // Simple query: all active products with seller. No boost join so we always return listings.
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users(id, full_name, avatar_url, location)
      `, { count: 'exact' })
      .eq('status', 'active');

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
    // Search: supports multiple keywords separated by | (OR logic) - matches title or description
    if (filters.searchQuery) {
      const terms = filters.searchQuery.split('|').map((t) => t.trim()).filter(Boolean);
      if (terms.length > 0) {
        const orParts = terms.flatMap(
          (term) => [`title.ilike.%${term}%`, `description.ilike.%${term}%`]
        );
        query = query.or(orParts.join(','));
      }
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

    // Exclude already-seen + saved product IDs (for swipe discovery)
    if (excludeIdArray.length > 0) {
      query = query.not('id', 'in', `(${excludeIdArray.join(',')})`);
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

    const transformedData = (data || []).map((product: Record<string, unknown>) => ({
      ...product,
      is_boosted: false,
      boost_type: null,
    }));

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
// Use coercion and preprocessing to handle form data edge cases (empty strings, string numbers)
const createProductSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().positive('Price must be positive'),
  category: z.enum(['mens', 'womens', 'kids', 'sports', 'clothing', 'shoes', 'accessories', 'bags', 'vintage', 'trending', 'sale']),
  subcategory: z.string().min(1, 'Subcategory is required'),
  size: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), z.string().optional()),
  condition: z.enum(['brand_new', 'like_new', 'excellent', 'good', 'fair']),
  brand: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), z.string().optional()),
  images: z.array(z.string().min(1, 'Image URL cannot be empty')).min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  delivery_method: z.enum(['pickup', 'shipping', 'both']),
  meetup_location: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), z.string().optional()),
  shipping_cost: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0, 'Shipping cost cannot be negative').optional()
  ),
  status: z.enum(['active', 'draft', 'sold']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const field = firstError.path.join('.') || 'field';
      const message = firstError.message || 'Invalid input';
      return NextResponse.json(
        { error: `${message} (${field})` },
        { status: 400 }
      );
    }
    const productData = parsed.data;

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
      const first = error.errors[0];
      const field = first?.path?.join('.') || 'field';
      return NextResponse.json(
        { error: `${first?.message || 'Invalid input'} (${field})` },
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

