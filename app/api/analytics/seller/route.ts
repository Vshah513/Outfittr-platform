import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('📊 Analytics API called');
  
  try {
    // Get Supabase client with request cookies
    const supabase = await createSupabaseServerClient(request);
    
    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔐 Session status:', session ? 'Valid' : 'Invalid', sessionError);

    if (sessionError || !session) {
      console.error('❌ Auth error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized - Please login again' }, { status: 401 });
    }

    console.log('👤 Looking for user with supabase_user_id:', session.user.id);

    // Get user details from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_user_id', session.user.id)
      .single();

    console.log('👤 User query result:', user ? 'Found' : 'Not found', userError);

    if (userError) {
      console.error('❌ User error:', userError);
      // Try alternative: check if user exists with email
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (userByEmail) {
        console.log('✅ Found user by email instead');
        // Use this user
        return await getAnalyticsForUser(supabase, userByEmail);
      }
      
      return NextResponse.json({ 
        error: 'User profile not found. Please complete your profile setup.',
        details: userError.message 
      }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return await getAnalyticsForUser(supabase, user);
  } catch (error: any) {
    console.error('❌ Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

interface AnalyticsProduct {
  id: string;
  status: string;
  price: number;
  category: string;
  subcategory?: string;
  view_count?: number;
  created_at: string;
  updated_at: string;
  title: string;
  images: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAnalyticsForUser(supabase: any, user: { id: string }) {
  console.log('📈 Calculating analytics for user:', user.id);

  // Get all products (active and sold)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  console.log('📦 Products found:', products?.length || 0, productsError);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  const typedProducts = (products || []) as AnalyticsProduct[];

  // Calculate statistics
  const activeListings = typedProducts.filter(p => p.status === 'active');
  const soldProducts = typedProducts.filter(p => p.status === 'sold');
  
  const totalEarnings = soldProducts.reduce((sum, p) => sum + Number(p.price), 0);
  const totalViews = typedProducts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  console.log('💰 Calculated:', {
    totalEarnings,
    activeListings: activeListings.length,
    soldProducts: soldProducts.length,
    totalViews
  });

  // Calculate best-selling categories (top 5)
  const categorySales: Record<string, { count: number; earnings: number }> = {};
  soldProducts.forEach(product => {
    const category = product.subcategory || product.category;
    if (!categorySales[category]) {
      categorySales[category] = { count: 0, earnings: 0 };
    }
    categorySales[category].count += 1;
    categorySales[category].earnings += Number(product.price);
  });

  const topCategories = Object.entries(categorySales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent sales (last 30 days grouped by week)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSales = soldProducts
    .filter(p => new Date(p.updated_at) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  // Group sales by week
  const salesByWeek: Record<string, number> = {};
  recentSales.forEach(product => {
    const date = new Date(product.updated_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    salesByWeek[weekKey] = (salesByWeek[weekKey] || 0) + Number(product.price);
  });

  const salesTrend = Object.entries(salesByWeek).map(([date, amount]) => ({
    date,
    amount,
  }));

  // Average price
  const averagePrice = soldProducts.length > 0 
    ? soldProducts.reduce((sum, p) => sum + Number(p.price), 0) / soldProducts.length 
    : 0;

  console.log('✅ Analytics calculated successfully');

  return NextResponse.json({
    success: true,
    analytics: {
      overview: {
        totalEarnings,
        activeListings: activeListings.length,
        soldItems: soldProducts.length,
        totalViews,
        averagePrice,
      },
      topCategories,
      salesTrend,
      recentListings: activeListings.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        images: p.images,
        status: p.status,
        views: p.view_count || 0,
        created_at: p.created_at,
      })),
    },
  });
}

