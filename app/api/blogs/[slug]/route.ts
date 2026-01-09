import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Helper to check if user is admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  const supabase = await createSupabaseServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return false;
  
  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) return false;
  
  const { data: user } = await serviceSupabase
    .from('users')
    .select('is_admin')
    .eq('supabase_user_id', session.user.id)
    .single();
  
  return user?.is_admin === true;
}

// GET /api/blogs/[slug] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const isAdminUser = await isAdmin(request);

    let query = serviceSupabase
      .from('blog_posts')
      .select(`
        *,
        author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .eq('slug', slug);

    // Only admins can see drafts/archived
    if (!isAdminUser) {
      query = query.eq('status', 'published').not('published_at', 'is', null);
    }

    const { data: post, error } = await query.single();

    if (error || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    logger.error('Error in GET /api/blogs/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/blogs/[slug] - Update blog post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, excerpt, content, featured_image_url, meta_title, meta_description, keywords, status, published_at } = body;

    // Check if post exists
    const { data: existingPost } = await serviceSupabase
      .from('blog_posts')
      .select('id, slug, published_at')
      .eq('slug', slug)
      .single();

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      // Regenerate slug if title changed
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Check if new slug exists (excluding current post)
      let finalSlug = newSlug;
      let counter = 0;
      while (true) {
        const { data: existing } = await serviceSupabase
          .from('blog_posts')
          .select('id')
          .eq('slug', finalSlug)
          .neq('id', existingPost.id)
          .single();
        
        if (!existing) break;
        counter++;
        finalSlug = `${newSlug}-${counter}`;
      }
      updateData.slug = finalSlug;
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at if publishing for first time
      if (status === 'published' && !existingPost.published_at) {
        updateData.published_at = published_at || new Date().toISOString();
      }
    }
    if (published_at !== undefined) updateData.published_at = published_at;

    const { data: post, error } = await serviceSupabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', existingPost.id)
      .select(`
        *,
        author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      logger.error('Error updating blog post:', error);
      return NextResponse.json(
        { error: 'Failed to update blog post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    logger.error('Error in PUT /api/blogs/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/blogs/[slug] - Delete blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { error } = await serviceSupabase
      .from('blog_posts')
      .delete()
      .eq('slug', slug);

    if (error) {
      logger.error('Error deleting blog post:', error);
      return NextResponse.json(
        { error: 'Failed to delete blog post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/blogs/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

