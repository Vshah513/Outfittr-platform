import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/auth';

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

// GET /api/blogs - Get all published posts (public) or all posts (admin)
export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';
    const isAdminUser = await isAdmin(request);

    let query = serviceSupabase
      .from('blog_posts')
      .select(`
        *,
        author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .order('published_at', { ascending: false, nullsFirst: false });

    // Only admins can see drafts/archived, public only sees published
    if (!isAdminUser) {
      query = query.eq('status', 'published').not('published_at', 'is', null);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data || [] });
  } catch (error) {
    console.error('Error in GET /api/blogs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/blogs - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
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

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: user } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists, append number if needed
    let finalSlug = slug;
    let counter = 0;
    while (true) {
      const { data: existing } = await serviceSupabase
        .from('blog_posts')
        .select('id')
        .eq('slug', finalSlug)
        .single();
      
      if (!existing) break;
      counter++;
      finalSlug = `${slug}-${counter}`;
    }

    // Prepare post data
    const postData: any = {
      title,
      slug: finalSlug,
      content,
      author_id: user.id,
      status: status || 'draft',
      is_user_post: false,
    };

    if (excerpt) postData.excerpt = excerpt;
    if (featured_image_url) postData.featured_image_url = featured_image_url;
    if (meta_title) postData.meta_title = meta_title;
    if (meta_description) postData.meta_description = meta_description;
    if (keywords && Array.isArray(keywords)) postData.keywords = keywords;
    if (status === 'published' && published_at) {
      postData.published_at = published_at;
    } else if (status === 'published') {
      postData.published_at = new Date().toISOString();
    }

    const { data: post, error } = await serviceSupabase
      .from('blog_posts')
      .insert(postData)
      .select(`
        *,
        author:users!blog_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/blogs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

