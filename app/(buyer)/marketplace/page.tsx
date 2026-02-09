'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VintageProductCard from '@/components/products/VintageProductCard';
import MarketplaceControls from '@/components/marketplace/MarketplaceControls';
import FilterRail from '@/components/marketplace/FilterRail';
import FilterDrawer from '@/components/marketplace/FilterDrawer';
import RecentlyViewed from '@/components/marketplace/RecentlyViewed';
import TrendingModule from '@/components/marketplace/TrendingModule';
import EmptyState from '@/components/ui/EmptyState';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Product, ProductCategory, ProductCondition, DeliveryMethod, MarketplaceTab } from '@/types';

// Marketplace and listings are public: no sign-in required to browse.
// Sign-in is only required for: uploading listings, saving items, following sellers, and purchasing.

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Tab state — default to 'for-you' so guests always see listings
  const [activeTab, setActiveTab] = useState<MarketplaceTab>(
    (searchParams.get('tab') as MarketplaceTab) || 'for-you'
  );
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | undefined>(
    searchParams.get('category') as ProductCategory || undefined
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(
    searchParams.get('subcategory') || undefined
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '100000'),
  ]);
  const [condition, setCondition] = useState<ProductCondition | undefined>(
    searchParams.get('condition') as ProductCondition || undefined
  );
  const [location, setLocation] = useState<string | undefined>(
    searchParams.get('location') || undefined
  );
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | undefined>(
    searchParams.get('deliveryMethod') as DeliveryMethod || undefined
  );
  const [size, setSize] = useState<string | undefined>(
    searchParams.get('size') || undefined
  );
  const [color, setColor] = useState<string | undefined>(
    searchParams.get('color') || undefined
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Hooks
  const { items: recentlyViewed, clearAll: clearRecentlyViewed } = useRecentlyViewed();
  const { toggleSave, isSaved } = useSavedItems();
  
  // Load more function (defined early for infinite scroll hook)
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
    }
  }, [page, isLoadingMore, hasMore]);

  // Infinite scroll hook
  const { setLoadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
    rootMargin: '200px',
  });

  // Fetch current user (non-blocking: listings load regardless)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // When not logged in, force "for-you" tab so guests always see listings (not "Sign in to follow sellers")
  useEffect(() => {
    if (!currentUser && activeTab === 'following') {
      setActiveTab('for-you');
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'for-you');
      router.replace(`/marketplace?${params.toString()}`, { scroll: false });
    }
  }, [currentUser, activeTab, searchParams, router]);

  // Fetch followed sellers when user is logged in
  useEffect(() => {
    const fetchFollows = async () => {
      if (!currentUser) {
        setFollowedSellerIds([]);
        return;
      }
      try {
        const response = await fetch('/api/follows');
        const data = await response.json();
        if (response.ok && data.data) {
          setFollowedSellerIds(data.data.map((f: any) => f.seller_id));
        }
      } catch (error) {
        console.error('Error fetching follows:', error);
      }
    };
    fetchFollows();
  }, [currentUser]);

  // Fetch trending products (for sidebar module)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/products?sortBy=popular&limit=3');
        const data = await response.json();
        if (response.ok) {
          setTrendingProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      }
    };
    fetchTrending();
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: MarketplaceTab) => {
    setActiveTab(tab);
    setPage(1);
    setProducts([]);
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      
      // Add tab-specific parameters
      params.append('tab', activeTab);
      
      // For "following" tab, pass followed seller IDs
      if (activeTab === 'following' && followedSellerIds.length > 0) {
        params.append('sellerIds', followedSellerIds.join(','));
      }
      
      // Sorting based on tab
      if (activeTab === 'for-you') {
        params.append('sortBy', 'popular');
      } else if (activeTab === 'new') {
        params.append('sortBy', 'newest');
      } else if (sortBy) {
        params.append('sortBy', sortBy);
      }
      
      // Apply filters
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (priceRange[0]) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 100000) params.append('maxPrice', priceRange[1].toString());
      if (condition) params.append('condition', condition);
      if (location) params.append('location', location);
      if (deliveryMethod) params.append('deliveryMethod', deliveryMethod);
      if (size) params.append('size', size);
      if (color) params.append('color', color);
      
      const searchQuery = searchParams.get('search');
      if (searchQuery) params.append('searchQuery', searchQuery);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        const newProducts = data.data || [];
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab, selectedCategory, selectedSubcategory, priceRange, condition, location, deliveryMethod, size, color, sortBy, searchParams, followedSellerIds]);

  // Initial fetch and re-fetch on filter changes
  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [activeTab, selectedCategory, selectedSubcategory, priceRange, condition, location, deliveryMethod, size, color, sortBy, followedSellerIds]);

  // Fetch more when page changes (for infinite scroll)
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, true);
    }
  }, [page]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setPriceRange([0, 100000]);
    setCondition(undefined);
    setLocation(undefined);
    setDeliveryMethod(undefined);
    setSize(undefined);
    setColor(undefined);
  }, []);

  // Count active filters
  const activeFilterCount = [
    selectedCategory,
    selectedSubcategory,
    condition,
    location,
    deliveryMethod,
    size,
    color,
    priceRange[0] > 0 ? 'minPrice' : null,
    priceRange[1] < 100000 ? 'maxPrice' : null,
  ].filter(Boolean).length;

  // Render empty state based on context
  const renderEmptyState = () => {
    if (activeTab === 'following') {
      return (
        <EmptyState 
          variant="following" 
          isLoggedIn={!!currentUser}
          onAction={() => handleTabChange('for-you')}
        />
      );
    }
    
    if (activeFilterCount > 0) {
      return (
        <EmptyState 
          variant="filters" 
          onAction={clearFilters}
        />
      );
    }
    
    if (searchParams.get('search')) {
      return (
        <EmptyState 
          variant="search" 
          onAction={() => router.push('/marketplace')}
        />
      );
    }
    
    return <EmptyState variant="default" />;
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] skeleton-vintage" />
          <div className="space-y-2">
            <div className="h-4 skeleton-vintage w-1/3" />
            <div className="h-4 skeleton-vintage w-2/3" />
            <div className="h-3 skeleton-vintage w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-marketplace">
      <Navbar />
      
      {/* Marketplace Header */}
      <div className="bg-vintage-paper border-b border-vintage">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="section-header-vintage">Marketplace</h1>
          <p className="text-vintage-secondary text-sm mt-1">
            Discover unique finds from trusted sellers
          </p>
        </div>
      </div>
      
      {/* Controls Bar */}
      <MarketplaceControls
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isLoggedIn={!!currentUser}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onFilterClick={() => setShowFilterDrawer(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-8">
            {/* Desktop Filter Rail */}
            <aside className="hidden md:block">
              {/* Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div className="w-64 mb-6">
                  <RecentlyViewed 
                    items={recentlyViewed} 
                    onClear={clearRecentlyViewed}
                  />
                </div>
              )}
              
              {/* Trending Module */}
              {trendingProducts.length > 0 && activeTab === 'for-you' && (
                <div className="w-64 mb-6">
                  <TrendingModule products={trendingProducts} />
                </div>
              )}
              
              <FilterRail
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                priceRange={priceRange}
                condition={condition}
                location={location}
                deliveryMethod={deliveryMethod}
                size={size}
                color={color}
                onCategoryChange={setSelectedCategory}
                onSubcategoryChange={setSelectedSubcategory}
                onPriceRangeChange={setPriceRange}
                onConditionChange={setCondition}
                onLocationChange={setLocation}
                onDeliveryMethodChange={setDeliveryMethod}
                onSizeChange={setSize}
                onColorChange={setColor}
                onClearAll={clearFilters}
              />
            </aside>

            {/* Products Grid */}
            <main className="flex-1 min-w-0">
              {/* Mobile Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div className="md:hidden mb-6">
                  <RecentlyViewed 
                    items={recentlyViewed} 
                    onClear={clearRecentlyViewed}
                  />
                </div>
              )}

              {/* Active Filters Pills */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vintage-stone hover:bg-vintage-warm rounded-full text-xs text-vintage-primary transition-colors"
                    >
                      {selectedCategory}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {condition && (
                    <button
                      onClick={() => setCondition(undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vintage-stone hover:bg-vintage-warm rounded-full text-xs text-vintage-primary transition-colors"
                    >
                      {condition.replace('_', ' ')}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {size && (
                    <button
                      onClick={() => setSize(undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vintage-stone hover:bg-vintage-warm rounded-full text-xs text-vintage-primary transition-colors"
                    >
                      Size {size}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {color && (
                    <button
                      onClick={() => setColor(undefined)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vintage-stone hover:bg-vintage-warm rounded-full text-xs text-vintage-primary transition-colors"
                    >
                      {color}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-vintage-muted hover:text-vintage-primary transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Item Count */}
              <div className="text-xs text-vintage-secondary mb-4">
                {isLoading ? 'Loading...' : `${products.length} items`}
              </div>

              {/* Products */}
              {isLoading ? (
                renderSkeleton()
              ) : products.length === 0 ? (
                renderEmptyState()
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product) => (
                      <VintageProductCard
                        key={product.id}
                        product={product}
                        showFollowButton={true}
                        isFollowing={followedSellerIds.includes(product.seller_id)}
                        isSaved={isSaved(product.id)}
                        onSave={toggleSave}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll Trigger / Load More */}
                  {hasMore && (
                    <div ref={setLoadMoreRef} className="mt-8 text-center">
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-vintage-muted">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-sm">Loading more...</span>
                        </div>
                      ) : (
                        <button
                          onClick={loadMore}
                          className="btn-vintage px-8 py-3"
                        >
                          Load more
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        priceRange={priceRange}
        condition={condition}
        location={location}
        deliveryMethod={deliveryMethod}
        size={size}
        color={color}
        onCategoryChange={setSelectedCategory}
        onSubcategoryChange={setSelectedSubcategory}
        onPriceRangeChange={setPriceRange}
        onConditionChange={setCondition}
        onLocationChange={setLocation}
        onDeliveryMethodChange={setDeliveryMethod}
        onSizeChange={setSize}
        onColorChange={setColor}
        onClearAll={clearFilters}
      />

      <Footer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
