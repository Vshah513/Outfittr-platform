import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db';

// Tier-based analytics access levels
const ANALYTICS_ACCESS = {
  free: { hasBasic: false, hasAdvanced: false, hasDemandInsights: false },
  base: { hasBasic: true, hasAdvanced: false, hasDemandInsights: false },
  growth: { hasBasic: true, hasAdvanced: true, hasDemandInsights: false },
  pro: { hasBasic: true, hasAdvanced: true, hasDemandInsights: true },
};

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
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

  // Get user's subscription tier using service client for RPC
  const serviceSupabase = getServiceSupabase();
  let userTier = 'free';
  let accessLevel = ANALYTICS_ACCESS.free;
  
  if (serviceSupabase) {
    try {
      const { data: planData } = await serviceSupabase
        .rpc('get_seller_plan', { p_seller_id: user.id });
      
      if (planData && planData[0]) {
        const plan = planData[0];
        const isActive = plan.tier_id === 'free' || 
          (plan.current_period_end && new Date(plan.current_period_end) > new Date());
        
        if (isActive) {
          userTier = plan.tier_id as keyof typeof ANALYTICS_ACCESS;
          accessLevel = ANALYTICS_ACCESS[userTier as keyof typeof ANALYTICS_ACCESS] || ANALYTICS_ACCESS.free;
        }
      }
    } catch (error) {
      console.error('Error fetching user plan for analytics:', error);
    }
  }

  console.log('📊 Analytics tier access:', { userTier, accessLevel });

  // Free tier: Return upgrade prompt
  if (!accessLevel.hasBasic) {
    return NextResponse.json({
      success: true,
      tier: userTier,
      accessLevel,
      requiresUpgrade: true,
      upgradeMessage: 'Upgrade to Base plan or higher to access seller analytics.',
      analytics: null,
    });
  }

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

  // Base response with basic analytics
  const response: {
    success: boolean;
    tier: string;
    accessLevel: typeof accessLevel;
    analytics: {
      overview: {
        totalEarnings: number;
        activeListings: number;
        soldItems: number;
        totalViews: number;
        averagePrice: number;
      };
      topCategories?: Array<{ name: string; count: number; earnings: number }>;
      salesTrend?: Array<{ date: string; amount: number }>;
      recentListings?: Array<{
        id: string;
        title: string;
        price: number;
        images: string[];
        status: string;
        views: number;
        created_at: string;
      }>;
      demandInsights?: {
        trendingCategories: Array<{ category: string; growth: number }>;
        peakHours: Array<{ hour: number; viewCount: number }>;
        priceRecommendations: Array<{ category: string; avgPrice: number; yourAvg: number }>;
      };
    };
  } = {
    success: true,
    tier: userTier,
    accessLevel,
    analytics: {
      overview: {
        totalEarnings,
        activeListings: activeListings.length,
        soldItems: soldProducts.length,
        totalViews,
        averagePrice: soldProducts.length > 0 
          ? soldProducts.reduce((sum, p) => sum + Number(p.price), 0) / soldProducts.length 
          : 0,
      },
    },
  };

  // Advanced analytics for Growth+ tiers
  if (accessLevel.hasAdvanced) {
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

    response.analytics.topCategories = Object.entries(categorySales)
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

    response.analytics.salesTrend = Object.entries(salesByWeek).map(([date, amount]) => ({
      date,
      amount,
    }));

    response.analytics.recentListings = activeListings.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      images: p.images,
      status: p.status,
      views: p.view_count || 0,
      created_at: p.created_at,
    }));
  }

  // Demand insights for Pro tier
  if (accessLevel.hasDemandInsights && serviceSupabase) {
    try {
      // Get trending categories from all products on the platform
      const { data: allProducts } = await serviceSupabase
        .from('products')
        .select('category, subcategory, view_count, price, created_at')
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (allProducts && allProducts.length > 0) {
        // Calculate trending categories by view growth
        const categoryViews: Record<string, number> = {};
        allProducts.forEach((p: { category: string; subcategory?: string; view_count?: number }) => {
          const cat = p.subcategory || p.category;
          categoryViews[cat] = (categoryViews[cat] || 0) + (p.view_count || 0);
        });

        const trendingCategories = Object.entries(categoryViews)
          .map(([category, views]) => ({ category, growth: views }))
          .sort((a, b) => b.growth - a.growth)
          .slice(0, 5);

        // Price recommendations based on market average
        const categoryPrices: Record<string, number[]> = {};
        allProducts.forEach((p: { category: string; subcategory?: string; price: number }) => {
          const cat = p.subcategory || p.category;
          if (!categoryPrices[cat]) categoryPrices[cat] = [];
          categoryPrices[cat].push(p.price);
        });

        // Get user's average prices per category
        const userCategoryPrices: Record<string, number[]> = {};
        typedProducts.forEach(p => {
          const cat = p.subcategory || p.category;
          if (!userCategoryPrices[cat]) userCategoryPrices[cat] = [];
          userCategoryPrices[cat].push(p.price);
        });

        const priceRecommendations = Object.keys(userCategoryPrices)
          .filter(cat => categoryPrices[cat])
          .map(cat => ({
            category: cat,
            avgPrice: Math.round(categoryPrices[cat].reduce((a, b) => a + b, 0) / categoryPrices[cat].length),
            yourAvg: Math.round(userCategoryPrices[cat].reduce((a, b) => a + b, 0) / userCategoryPrices[cat].length),
          }))
          .slice(0, 5);

        response.analytics.demandInsights = {
          trendingCategories,
          peakHours: [], // Could be calculated from view timestamps if we had that data
          priceRecommendations,
        };
      }
    } catch (error) {
      console.error('Error calculating demand insights:', error);
    }
  }

  console.log('✅ Analytics calculated successfully');
  return NextResponse.json(response);
}

