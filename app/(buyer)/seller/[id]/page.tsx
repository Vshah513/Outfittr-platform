'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/products/ProductGrid';
import TrustBadges from '@/components/ui/TrustBadges';
import FollowButton from '@/components/ui/FollowButton';
import { SellerProfile, Product, SubscriptionTierId } from '@/types';
import { formatDate } from '@/lib/utils';

type ProfileTab = 'active' | 'sold' | 'about';

export default function SellerProfilePage() {
  const params = useParams();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('active');
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [sellerPlan, setSellerPlan] = useState<{
    tier_id: SubscriptionTierId;
    tier_name: string;
    is_active: boolean;
    is_pro: boolean;
    is_featured: boolean;
  } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchSeller();
    }
  }, [params.id, activeTab]);

  const fetchSeller = async () => {
    setIsLoading(true);
    try {
      const tabParam = activeTab === 'about' ? 'active' : activeTab;
      const response = await fetch(`/api/sellers/${params.id}?tab=${tabParam}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setSeller(data.data);
        setListings(data.data.listings || []);
        setFollowerCount(data.data.follower_count || 0);
        setIsFollowing(data.data.is_following || false);
        setSellerPlan(data.data.seller_plan || null);
      }
    } catch (error) {
      console.error('Error fetching seller:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowChange = (newIsFollowing: boolean) => {
    setIsFollowing(newIsFollowing);
    setFollowerCount(prev => newIsFollowing ? prev + 1 : prev - 1);
  };

  if (isLoading && !seller) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Seller not found</h2>
            <a href="/marketplace" className="text-black underline">
              Back to Marketplace
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ring-4 ring-white shadow-lg">
                {seller.avatar_url ? (
                  <Image
                    src={seller.avatar_url}
                    alt={seller.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {seller.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Active indicator */}
              {seller.trust_metrics?.last_active_at && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white" 
                     title="Active this week" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{seller.full_name}</h1>
                  {/* Subscription Badge */}
                  {sellerPlan && sellerPlan.tier_id !== 'free' && sellerPlan.is_active && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      sellerPlan.tier_id === 'pro' 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                        : sellerPlan.tier_id === 'growth'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {sellerPlan.tier_id === 'pro' && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                        </svg>
                      )}
                      {sellerPlan.tier_id === 'pro' ? 'Pro Seller' : 
                       sellerPlan.tier_id === 'growth' ? 'Growth' : 
                       sellerPlan.tier_name}
                    </span>
                  )}
                </div>
                <FollowButton
                  sellerId={seller.id}
                  initialIsFollowing={isFollowing}
                  size="md"
                  variant="outline"
                  onFollowChange={handleFollowChange}
                />
              </div>
              
              {seller.location && (
                <p className="text-gray-600 flex items-center justify-center md:justify-start gap-1 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {seller.location}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                <div className="text-center">
                  <span className="block text-xl font-bold text-gray-900">
                    {seller.listings_count}
                  </span>
                  <span className="text-xs text-gray-500">Listings</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-gray-900">
                    {seller.sold_count}
                  </span>
                  <span className="text-xs text-gray-500">Sold</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-gray-900">
                    {seller.trust_metrics?.vouch_count || 0}
                  </span>
                  <span className="text-xs text-gray-500">Vouches</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-gray-900">
                    {followerCount}
                  </span>
                  <span className="text-xs text-gray-500">Followers</span>
                </div>
              </div>

              {/* Trust Badges */}
              {seller.trust_metrics && (
                <TrustBadges metrics={seller.trust_metrics} variant="compact" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1 py-2" role="tablist">
            {(['active', 'sold', 'about'] as ProfileTab[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-5 py-2 rounded-full text-sm font-medium transition-all
                  ${activeTab === tab 
                    ? 'bg-black text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                {tab === 'active' && `Active (${seller.listings_count})`}
                {tab === 'sold' && `Sold (${seller.sold_count})`}
                {tab === 'about' && 'About'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {activeTab === 'about' ? (
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              {/* Bio */}
              <div>
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-gray-700">
                  {seller.bio || 'This seller hasn\'t added a bio yet.'}
                </p>
              </div>

              {/* Member Since */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Member Since</h2>
                <p className="text-gray-700">
                  {formatDate(seller.created_at)}
                </p>
              </div>

              {/* Full Trust Details */}
              {seller.trust_metrics && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Trust & Verification</h2>
                  <TrustBadges metrics={seller.trust_metrics} variant="full" />
                </div>
              )}
            </div>
          ) : (
            <>
              {listings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {activeTab === 'active' ? 'No active listings' : 'No sold items'}
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'active' 
                      ? 'This seller doesn\'t have any active listings right now.'
                      : 'This seller hasn\'t sold any items yet.'
                    }
                  </p>
                </div>
              ) : (
                <ProductGrid products={listings} isLoading={isLoading} />
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}


