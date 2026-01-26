'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';

interface DemandInsights {
  trendingCategories: Array<{ category: string; growth: number }>;
  peakHours: Array<{ hour: number; viewCount: number }>;
  priceRecommendations: Array<{ category: string; avgPrice: number; yourAvg: number }>;
}

interface Analytics {
  overview: {
    totalEarnings: number;
    activeListings: number;
    soldItems: number;
    totalViews: number;
    averagePrice: number;
  };
  topCategories?: Array<{ name: string; count: number; earnings: number }>;
  salesTrend?: Array<{ date: string; amount: number }>;
  demandInsights?: DemandInsights;
}

export default function InsightsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnTo=/insights');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user) return;

      try {
        // First check subscription
        const subResponse = await fetch('/api/subscriptions');
        if (subResponse.ok) {
          const subData = await subResponse.json();
          const tier = subData.plan?.tier_id || 'free';
          setUserTier(tier);
          setHasAccess(tier === 'pro');
        }

        // Fetch analytics (will include demand insights for Pro users)
        const analyticsResponse = await fetch('/api/analytics/seller');
        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          if (data.analytics) {
            setAnalytics(data.analytics);
          } else if (data.requiresUpgrade) {
            setError(data.upgradeMessage);
          }
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError('Failed to load insights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [user]);

  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Demand Insights is a Pro Feature</h2>
              <p className="text-gray-600 mb-6">
                You're currently on the <span className="font-semibold capitalize">{userTier}</span> plan.
                Upgrade to Pro to access market demand insights, trending categories, and price recommendations.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/plan">
                  <Button variant="primary">Upgrade to Pro</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const insights = analytics?.demandInsights;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Demand Insights</h1>
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                </svg>
                Pro
              </span>
            </div>
            <p className="text-gray-600">Market trends and pricing insights to help you sell better</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        {analytics?.overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-emerald-600">{formatPrice(analytics.overview.totalEarnings)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Items Sold</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.overview.soldItems}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.overview.totalViews}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Avg. Price</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(analytics.overview.averagePrice)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trending Categories */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <h2 className="text-lg font-semibold">Trending Categories</h2>
              </div>
              <p className="text-sm text-gray-500">Categories with the most buyer interest this week</p>
            </CardHeader>
            <CardContent>
              {insights?.trendingCategories && insights.trendingCategories.length > 0 ? (
                <div className="space-y-3">
                  {insights.trendingCategories.map((cat, idx) => (
                    <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-orange-500 text-white' :
                          idx === 1 ? 'bg-gray-400 text-white' :
                          idx === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium capitalize">{cat.category.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{cat.growth} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No trending data available yet</p>
              )}
            </CardContent>
          </Card>

          {/* Price Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold">Price Recommendations</h2>
              </div>
              <p className="text-sm text-gray-500">How your prices compare to the market</p>
            </CardHeader>
            <CardContent>
              {insights?.priceRecommendations && insights.priceRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {insights.priceRecommendations.map((rec) => {
                    const diff = rec.yourAvg - rec.avgPrice;
                    const percentDiff = rec.avgPrice > 0 ? Math.round((diff / rec.avgPrice) * 100) : 0;
                    const isAboveMarket = diff > 0;
                    
                    return (
                      <div key={rec.category} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{rec.category.replace(/_/g, ' ')}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isAboveMarket 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isAboveMarket ? `${percentDiff}% above market` : `${Math.abs(percentDiff)}% below market`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Market avg: {formatPrice(rec.avgPrice)}</span>
                          <span className="text-gray-900 font-medium">Your avg: {formatPrice(rec.yourAvg)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">List more products to see price recommendations</p>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Categories */}
          {analytics?.topCategories && analytics.topCategories.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="text-lg font-semibold">Your Top Categories</h2>
                </div>
                <p className="text-sm text-gray-500">Your best-selling categories</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{cat.name.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-500 ml-2">{cat.count} sold</span>
                      </div>
                      <span className="font-medium text-emerald-600">{formatPrice(cat.earnings)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales Trend */}
          {analytics?.salesTrend && analytics.salesTrend.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h2 className="text-lg font-semibold">Sales Trend</h2>
                </div>
                <p className="text-sm text-gray-500">Your sales over the last 30 days</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.salesTrend.map((week) => (
                    <div key={week.date} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-24">
                        {new Date(week.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (week.amount / Math.max(...analytics.salesTrend!.map(w => w.amount))) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {formatPrice(week.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
