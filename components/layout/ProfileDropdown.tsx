'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SellerAnalytics } from '@/types';
import { formatPrice } from '@/lib/utils';
import { signOut } from '@/lib/auth';
import { createSupabaseClient } from '@/lib/auth';

interface ProfileDropdownProps {
  user: any;
  onClose: () => void;
}

export default function ProfileDropdown({ user, onClose }: ProfileDropdownProps) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSeller = user.user_type === 'seller' || user.user_type === 'both';

  useEffect(() => {
    if (isSeller) {
      fetchAnalytics();
    } else {
      setIsLoading(false);
    }
  }, [isSeller]);

  const fetchAnalytics = async () => {
    console.log('🔍 Fetching analytics for user:', user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Auth is not configured.');
        return;
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔐 Session check:', session ? 'Found' : 'Not found', sessionError);
      
      if (sessionError || !session) {
        console.error('❌ Session error:', sessionError);
        throw new Error('No active session. Please login again.');
      }

      console.log('📡 Calling analytics API...');
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/analytics/seller', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('📊 API Response status:', response.status);
      const data = await response.json();
      console.log('📊 API Response data:', data);

      if (response.ok) {
        setAnalytics(data.analytics);
        console.log('✅ Analytics loaded successfully');
      } else {
        const errorMsg = data.error || 'Failed to load analytics';
        console.error('❌ API Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Error fetching analytics:', error);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to load analytics. Please try again.');
      }
    } finally {
      setIsLoading(false);
      console.log('✅ Loading complete');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.push('/');
  };

  const maxCategoryValue = analytics?.topCategories.length 
    ? Math.max(...analytics.topCategories.map(c => c.count))
    : 1;

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* User Info Header */}
      <div className="bg-gradient-to-br from-gray-50 to-white px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-2 ring-gray-200">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {user.username && (
              <p className="text-xs text-gray-400 truncate">@{user.username}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seller Analytics Section */}
      {isSeller && (
        <div className="px-6 py-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-xs text-gray-600">Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Earnings Overview */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Earnings</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(analytics.overview.totalEarnings)}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                    <div className="text-lg font-bold text-blue-600">{analytics.overview.activeListings}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Active</div>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                    <div className="text-lg font-bold text-green-600">{analytics.overview.soldItems}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Sold</div>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                    <div className="text-lg font-bold text-purple-600">{analytics.overview.totalViews}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Views</div>
                  </div>
                </div>
              </div>

              {/* Top Selling Categories Chart */}
              {analytics.topCategories.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Top Selling</h4>
                  <div className="space-y-2.5">
                    {analytics.topCategories.map((category, index) => (
                      <div key={category.name} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 truncate flex-1">{category.name}</span>
                          <span className="text-xs font-bold text-gray-900 ml-2">{category.count}</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                              index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              index === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                              index === 3 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                              'bg-gradient-to-r from-pink-500 to-pink-600'
                            }`}
                            style={{ width: `${(category.count / maxCategoryValue) * 100}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {formatPrice(category.earnings)} earned
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Trend Mini Chart */}
              {analytics.salesTrend.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Sales Trend (30 days)</h4>
                  <div className="flex items-end justify-between h-16 gap-1">
                    {analytics.salesTrend.map((point, index) => {
                      const maxAmount = Math.max(...analytics.salesTrend.map(p => p.amount));
                      const height = maxAmount > 0 ? (point.amount / maxAmount) * 100 : 0;
                      return (
                        <div
                          key={point.date}
                          className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t transition-all hover:from-indigo-600 hover:to-indigo-500 cursor-pointer"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${new Date(point.date).toLocaleDateString()}: ${formatPrice(point.amount)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                    <span>4 weeks ago</span>
                    <span>Today</span>
                  </div>
                </div>
              )}

              {/* Average Price */}
              {analytics.overview.averagePrice > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Avg. Item Price</span>
                  <span className="font-semibold text-gray-900">{formatPrice(analytics.overview.averagePrice)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600">No sales data yet</p>
              <p className="text-xs text-gray-500 mt-1">Start selling to see your analytics</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div className="py-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">Profile</span>
        </Link>

        {isSeller && (
          <>
            <Link
              href="/listings/new"
              className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">My Listings</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">Analytics</span>
            </Link>
          </>
        )}

        <Link
          href="/saved"
          className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">Saved Items</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">Settings</span>
        </Link>

        {user.is_admin && (
          <Link
            href="/blog/admin"
            className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-2 pt-2"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-medium">Blog Admin</span>
          </Link>
        )}
      </div>

      {/* Sign Out */}
      <div className="border-t border-gray-200 py-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}

