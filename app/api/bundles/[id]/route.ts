import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { z } from 'zod';

// GET /api/bundles/[id] - Get a specific bundle request
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

    const { data: bundle, error } = await supabase
      .from('bundle_requests')
      .select(`
        *,
        buyer:users!bundle_requests_buyer_id_fkey(id, full_name, avatar_url),
        seller:users!bundle_requests_seller_id_fkey(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error || !bundle) {
      return NextResponse.json(
        { error: 'Bundle request not found' },
        { status: 404 }
      );
    }

    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', bundle.product_ids);

    return NextResponse.json({
      data: {
        ...bundle,
        products: products || [],
      },
    });
  } catch (error) {
    console.error('Error fetching bundle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundle' },
      { status: 500 }
    );
  }
}

// PATCH /api/bundles/[id] - Accept or decline a bundle request
const updateBundleSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id } = await params;
    const body = await request.json();
    const { action } = updateBundleSchema.parse(body);

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get the bundle request
    const { data: bundle, error: bundleError } = await supabase
      .from('bundle_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (bundleError || !bundle) {
      return NextResponse.json(
        { error: 'Bundle request not found' },
        { status: 404 }
      );
    }

    // Only seller can accept/decline
    if (bundle.seller_id !== session.userId) {
      return NextResponse.json(
        { error: 'Only the seller can respond to this bundle request' },
        { status: 403 }
      );
    }

    // Check bundle is still pending
    if (bundle.status !== 'pending') {
      return NextResponse.json(
        { error: `Bundle request has already been ${bundle.status}` },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Reserve products for 24 hours
      const reservedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Check all products are still available
      const { data: products } = await supabase
        .from('products')
        .select('id, title, status, reserved_by')
        .in('id', bundle.product_ids);

      const unavailable = products?.find(
        p => p.status !== 'active' || (p.reserved_by && p.reserved_by !== bundle.buyer_id)
      );

      if (unavailable) {
        return NextResponse.json(
          { error: `Product "${unavailable.title}" is no longer available` },
          { status: 400 }
        );
      }

      // Reserve the products
      await supabase
        .from('products')
        .update({
          reserved_by: bundle.buyer_id,
          reserved_until: reservedUntil,
        })
        .in('id', bundle.product_ids);

      // Update bundle status
      const { data: updatedBundle, error: updateError } = await supabase
        .from('bundle_requests')
        .update({
          status: 'accepted',
          reserved_until: reservedUntil,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send acceptance message
      await supabase
        .from('messages')
        .insert({
          conversation_id: bundle.conversation_id,
          sender_id: session.userId,
          recipient_id: bundle.buyer_id,
          content: `✅ Bundle Accepted!\n\nI've reserved these items for you for 24 hours. Let's complete the deal!\n\n[Bundle ID: ${bundle.id}]`,
        });

      return NextResponse.json({ data: updatedBundle });
    } else {
      // Decline the bundle
      const { data: updatedBundle, error: updateError } = await supabase
        .from('bundle_requests')
        .update({ status: 'declined' })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send decline message
      await supabase
        .from('messages')
        .insert({
          conversation_id: bundle.conversation_id,
          sender_id: session.userId,
          recipient_id: bundle.buyer_id,
          content: `Bundle request declined.\n\n[Bundle ID: ${bundle.id}]`,
        });

      return NextResponse.json({ data: updatedBundle });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to update bundle request' },
      { status: 500 }
    );
  }
}


