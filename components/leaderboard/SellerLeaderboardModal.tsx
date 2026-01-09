'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeaderboardData, LeaderboardSeller } from '@/types';
import FollowButton from '@/components/ui/FollowButton';

interface SellerLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LeaderboardTab = 'sales' | 'views';

export default function SellerLeaderboardModal({
  isOpen,
  onClose,
}: SellerLeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('sales');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      
      // Set up auto-refresh every 30 seconds when modal is open
      const intervalId = setInterval(() => {
        fetchLeaderboard(true); // Silent refresh (no loading spinner)
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isOpen]);

  const fetchLeaderboard = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch('/api/leaderboard/sellers');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }
      
      setData(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const sellers = activeTab === 'sales' 
    ? (data?.topBySales || [])
    : (data?.topByViews || []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-sm shadow-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold text-sm shadow-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
        {rank}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-6 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Top Sellers</h2>
              <p className="text-white/80 text-sm">
                {data ? `${data.month} ${data.year}` : 'This Month'}
              </p>
              {lastUpdated && (
                <p className="text-white/60 text-xs mt-1">
                  Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sales'
                  ? 'bg-white text-purple-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Top Sellers
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'views'
                  ? 'bg-white text-purple-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Most Viewed
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchLeaderboard()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No sellers found for this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sellers.map((seller) => (
                <div
                  key={seller.seller_id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    {getRankBadge(seller.rank_position)}
                  </div>

                  {/* Avatar */}
                  <Link
                    href={`/seller/${seller.seller_id}`}
                    className="flex-shrink-0"
                    onClick={onClose}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                      {seller.avatar_url ? (
                        <img
                          src={seller.avatar_url}
                          alt={seller.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
                          {seller.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Seller Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/seller/${seller.seller_id}`}
                      onClick={onClose}
                      className="block"
                    >
                      <h3 className="font-semibold text-gray-900 truncate hover:text-purple-600 transition-colors">
                        {seller.full_name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      {seller.location && (
                        <p className="text-sm text-gray-500 truncate">{seller.location}</p>
                      )}
                      {seller.rating && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-600">{seller.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-500">
                        {seller.follower_count} {seller.follower_count === 1 ? 'follower' : 'followers'}
                      </span>
                    </div>
                  </div>

                  {/* Metric Value */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {activeTab === 'sales' 
                        ? `${seller.items_sold || 0}`
                        : `${seller.total_views || 0}`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {activeTab === 'sales' ? 'items sold' : 'views'}
                    </div>
                  </div>

                  {/* Follow Button */}
                  <div className="flex-shrink-0">
                    <FollowButton
                      sellerId={seller.seller_id}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

