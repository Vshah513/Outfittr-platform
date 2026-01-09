import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';

// POST /api/products/[id]/view - Record a product view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, sessionId } = body;

    // Validate that we have either userId or sessionId
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
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

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Don't count views from the seller on their own product
    if (userId && userId === product.seller_id) {
      return NextResponse.json({ 
        success: true, 
        viewRecorded: false,
        reason: 'Own product' 
      });
    }

    // Record the view using the database function
    const { data: viewRecorded, error: viewError } = await supabase
      .rpc('record_product_view', {
        product_uuid: id,
        viewer_user_id: userId || null,
        viewer_session_id: sessionId || null
      });

    if (viewError) {
      console.error('Error recording view:', viewError);
      return NextResponse.json(
        { error: 'Failed to record view', details: viewError.message },
        { status: 500 }
      );
    }

    // Get updated view count
    const { data: updatedProduct } = await supabase
      .from('products')
      .select('view_count')
      .eq('id', id)
      .single();

    return NextResponse.json({ 
      success: true, 
      viewRecorded,
      viewCount: updatedProduct?.view_count || 0
    });

  } catch (error) {
    console.error('Error in view tracking:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}

