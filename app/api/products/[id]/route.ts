import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*, seller:users(id, full_name, avatar_url, location, created_at)')
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
const updateProductSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  price: z.number().positive().optional(),
  category: z.enum(['mens', 'womens', 'kids', 'sports', 'trending', 'sale']).optional(),
  subcategory: z.string().optional(),
  size: z.string().optional(),
  condition: z.enum(['brand_new', 'like_new', 'excellent', 'good', 'fair']).optional(),
  brand: z.string().optional(),
  images: z.array(z.string()).min(1).max(5).optional(),
  delivery_method: z.enum(['pickup', 'shipping', 'both']).optional(),
  meetup_location: z.string().optional(),
  shipping_cost: z.number().optional(),
  status: z.enum(['active', 'sold', 'archived']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const updates = updateProductSchema.parse(body);

    const supabase = getServiceSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    // Verify ownership and get current status
    const { data: product } = await supabase
      .from('products')
      .select('seller_id, status')
      .eq('id', id)
      .single();

    if (!product || product.seller_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle sold_at timestamp based on status changes
    // The database trigger will also handle this, but we set it explicitly for clarity
    const finalUpdates: Record<string, unknown> = { ...updates };
    if (updates.status !== undefined) {
      if (updates.status === 'sold' && product.status !== 'sold') {
        // Marking as sold - set sold_at timestamp
        finalUpdates.sold_at = new Date().toISOString();
      } else if (updates.status !== 'sold' && product.status === 'sold') {
        // Unmarking as sold - clear sold_at timestamp
        finalUpdates.sold_at = null;
      }
    }

    const { data, error: updateError } = await supabase
      .from('products')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    // Verify ownership
    const { data: product } = await supabase
      .from('products')
      .select('seller_id, images')
      .eq('id', id)
      .single();

    if (!product || product.seller_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // TODO: Delete images from storage

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

