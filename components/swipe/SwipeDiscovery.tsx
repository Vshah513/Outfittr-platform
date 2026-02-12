'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import SwipeCardStack from './SwipeCardStack';
import FullscreenProductView from './FullscreenProductView';

// ---- Types ----

type GenderFilter = 'all' | 'womens' | 'mens';
type ConditionFilter = '' | 'brand_new' | 'like_new' | 'excellent' | 'good' | 'fair';
type SwipeEventType = 'impression' | 'swipe_left' | 'swipe_right' | 'fullscreen_open';

interface Filters {
  gender: GenderFilter;
  size: string;
  minPrice: string;
  maxPrice: string;
  condition: ConditionFilter;
  subcategory: string;
}

// ---- Storage Helpers ----

const SEEN_IDS_KEY = 'outfittr_swipe_seen_ids';
const GESTURE_DEMO_KEY = 'outfittr_swipe_gesture_demo_shown';

function loadSeenIds(): Set<string> {
  try {
    const stored = sessionStorage.getItem(SEEN_IDS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

// ---- Swipe Event Logger ----

function logSwipeEvent(event: SwipeEventType, productId: string) {
  // Fire-and-forget; don't block the UI
  fetch('/api/swipe-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, product_id: productId }),
  }).catch(() => {
    // Silently fail -- analytics are non-critical
  });
}

// ---- Fetch Limit ----

const PAGE_SIZE = 20;
const PREFETCH_THRESHOLD = 5; // prefetch when this many cards remain

// ---- Component ----
// Swipe feed is public: anyone can browse. Sign-in is only required for Save and for purchasing (handled on product page).

export default function SwipeDiscovery() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  // Products & pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const isFetchingRef = useRef(false);

  // Seen tracking
  const [seenIds, setSeenIds] = useState<Set<string>>(() => loadSeenIds());

  // Filters
  const [filters, setFilters] = useState<Filters>({
    gender: 'all',
    size: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    subcategory: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fullscreen modal
  const [fullscreenProduct, setFullscreenProduct] = useState<Product | null>(null);

  // Gesture demo: show half-swipe hint once per session when section is in view
  const sectionRef = useRef<HTMLDivElement>(null);
  const [runGestureDemo, setRunGestureDemo] = useState(false);

  // ---- Data Fetching ----

  const fetchProducts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('page', String(pageNum));
        params.set('sortBy', 'newest');

        // Gender → category
        if (filters.gender !== 'all') {
          params.set('category', filters.gender);
        }
        if (filters.size) params.set('size', filters.size);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.condition) params.set('condition', filters.condition);
        if (filters.subcategory) params.set('subcategory', filters.subcategory);

        // Exclude seen IDs
        const currentSeen = reset ? new Set<string>() : seenIds;
        if (currentSeen.size > 0) {
          params.set('exclude_ids', [...currentSeen].join(','));
        }

        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        const newProducts: Product[] = data.data || [];

        if (reset) {
          setProducts(newProducts);
          setCurrentIndex(0);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        setHasMore(data.hasMore ?? false);

        // Log impression for the first visible card
        if (newProducts.length > 0) {
          const firstId = reset ? newProducts[0].id : newProducts[0].id;
          if (reset) {
            logSwipeEvent('impression', firstId);
          }
        }
      } catch (error) {
        console.error('Error fetching products for swipe:', error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [filters, seenIds]
  );

  // Track when swipe section is in view
  const [sectionInView, setSectionInView] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setSectionInView(!!entries[0]?.isIntersecting),
      { threshold: 0.4, rootMargin: '0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When section is in view and we have a card, trigger gesture demo once per session
  useEffect(() => {
    if (!sectionInView || products.length === 0 || runGestureDemo) return;
    try {
      if (sessionStorage.getItem(GESTURE_DEMO_KEY) === '1') return;
    } catch {
      return;
    }
    setRunGestureDemo(true);
  }, [sectionInView, products.length, runGestureDemo]);

  // Initial fetch — clear loading quickly so we show listings or empty state
  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchProducts(1, true);

    // Stop showing loading after 1.5s so we never block the UI
    const timeoutId = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Prefetch next page when buffer is low
  useEffect(() => {
    const remaining = products.length - currentIndex;
    if (remaining <= PREFETCH_THRESHOLD && hasMore && !isFetchingRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, products.length, hasMore]);

  // Log impression when the top card changes
  useEffect(() => {
    if (products[currentIndex]) {
      logSwipeEvent('impression', products[currentIndex].id);
    }
  }, [currentIndex, products]);

  // ---- Swipe Handlers ----

  const addToSeen = useCallback(
    (productId: string) => {
      setSeenIds((prev) => {
        const next = new Set(prev);
        next.add(productId);
        saveSeenIds(next);
        return next;
      });
    },
    []
  );

  const handleSwipe = useCallback(
    (direction: 'left' | 'right', product: Product) => {
      // Only add to "seen" when skipping (left). When saving (right), don't mark as seen so
      // if the user removes the item from their cart later, it can reappear in the swipe feed.
      if (direction === 'left') {
        addToSeen(product.id);
      }

      if (direction === 'right') {
        // Save requires auth
        if (!user) {
          openAuthModal(undefined, { type: 'save', productId: product.id }, 'signin');
        } else {
          // Save (idempotent -- 409 means already saved, treat as success)
          fetch('/api/saved-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: product.id }),
          })
            .then((res) => {
              if (res.ok || res.status === 409) window.dispatchEvent(new CustomEvent('saved-items-changed'));
            })
            .catch(() => {});
        }
        logSwipeEvent('swipe_right', product.id);
      } else {
        logSwipeEvent('swipe_left', product.id);
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [user, openAuthModal, addToSeen]
  );

  const handleBuyNow = useCallback(
    (product: Product) => {
      addToSeen(product.id);
      setCurrentIndex((prev) => prev + 1);
      router.push(`/product/${product.id}`);
    },
    [addToSeen, router]
  );

  // ---- Fullscreen Handlers ----

  const handleExpandClick = useCallback((product: Product) => {
    logSwipeEvent('fullscreen_open', product.id);
    setFullscreenProduct(product);
  }, []);

  const handleFullscreenSave = useCallback(() => {
    if (!fullscreenProduct) return;

    if (!user) {
      openAuthModal(undefined, { type: 'save', productId: fullscreenProduct.id }, 'signin');
      return;
    }

    fetch('/api/saved-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: fullscreenProduct.id }),
    })
      .then((res) => {
        if (res.ok || res.status === 409) window.dispatchEvent(new CustomEvent('saved-items-changed'));
      })
      .catch(() => {});

    logSwipeEvent('swipe_right', fullscreenProduct.id);
    // Don't add to seen: if they remove from cart later, item can reappear in swipe feed
    setFullscreenProduct(null);
    setCurrentIndex((prev) => prev + 1);
  }, [fullscreenProduct, user, openAuthModal]);

  const handleFullscreenSkip = useCallback(() => {
    if (!fullscreenProduct) return;
    logSwipeEvent('swipe_left', fullscreenProduct.id);
    addToSeen(fullscreenProduct.id);
    setFullscreenProduct(null);
    setCurrentIndex((prev) => prev + 1);
  }, [fullscreenProduct, addToSeen]);

  const handleFullscreenBuyNow = useCallback(() => {
    if (!fullscreenProduct) return;
    addToSeen(fullscreenProduct.id);
    setFullscreenProduct(null);
    setCurrentIndex((prev) => prev + 1);
    router.push(`/product/${fullscreenProduct.id}`);
  }, [fullscreenProduct, addToSeen, router]);

  // ---- Filter Handlers ----

  const setGender = (g: GenderFilter) => {
    setFilters((prev) => ({ ...prev, gender: g }));
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ gender: 'all', size: '', minPrice: '', maxPrice: '', condition: '', subcategory: '' });
  };

  const activeFilterCount =
    (filters.size ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.condition ? 1 : 0) +
    (filters.subcategory ? 1 : 0);

  // ---- Derived State ----

  const isDone = !isLoading && currentIndex >= products.length && !hasMore;
  const currentProduct = products[currentIndex] || null;

  // ---- Render ----

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <div className="mb-6">
        {/* Gender Tabs */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {(
            [
              ['all', 'All'],
              ['womens', 'Women'],
              ['mens', 'Men'],
            ] as [GenderFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGender(value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                filters.gender === value
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`ml-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              showFilters || activeFilterCount > 0
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-black w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filter Options */}
        {showFilters && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4 max-w-[400px] mx-auto">
            {/* Size */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Size</label>
              <input
                type="text"
                placeholder="e.g. M, L, 42"
                value={filters.size}
                onChange={(e) => updateFilter('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Price Range */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Min Price</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Max Price</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
              >
                <option value="">Any condition</option>
                <option value="brand_new">Brand New</option>
                <option value="like_new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            {/* Category / Subcategory */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <input
                type="text"
                placeholder="e.g. Dresses, Sneakers"
                value={filters.subcategory}
                onChange={(e) => updateFilter('subcategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-black underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Stack Area — show listings as soon as we have them; minimal loading */}
      <div
        ref={sectionRef}
        className="relative min-h-[500px] flex flex-col items-center justify-center"
      >
        {currentProduct ? (
          <>
            {/* Swipe hint — just above product listing (mobile + laptop) */}
            <p className="text-center text-sm sm:text-base text-gray-600 font-medium mb-2 px-4 w-full">
              Swipe right to add to saved items and swipe left to skip
            </p>
            <SwipeCardStack
              products={products}
              currentIndex={currentIndex}
              onSwipe={handleSwipe}
              onExpandClick={handleExpandClick}
              runGestureDemo={runGestureDemo}
              onGestureDemoComplete={() => {
                try {
                  sessionStorage.setItem(GESTURE_DEMO_KEY, '1');
                } catch {
                  // ignore
                }
                setRunGestureDemo(false);
              }}
            />

            {/* Skip / Save / Buy now action buttons (below card, clearly below the card with space before next section) */}
            <div className="absolute -bottom-10 left-0 right-0 z-10 flex justify-center items-center gap-6 sm:gap-8 text-xs font-medium flex-wrap">
              <button
                type="button"
                onClick={() => handleSwipe('left', currentProduct)}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer touch-manipulation"
                aria-label="Skip this item"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Skip
              </button>
              <button
                type="button"
                onClick={() => handleSwipe('right', currentProduct)}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer touch-manipulation"
                aria-label="Save this item"
              >
                Save
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleBuyNow(currentProduct)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors cursor-pointer touch-manipulation"
                aria-label="Buy now - view listing"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Buy now
              </button>
            </div>
          </>
        ) : (
          /* No current card: loading (brief) or no listings / seen all */
          <div className="flex flex-col items-center gap-4 text-center px-6">
            {isLoading && products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                <p className="text-xs font-medium">Loading listings...</p>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {products.length === 0 ? 'No listings yet' : "You've seen everything!"}
                </h3>
                <p className="text-gray-500 max-w-xs">
                  {products.length === 0
                    ? 'Listings will show here as sellers add them. Browse the marketplace in the meantime.'
                    : 'Check back later for new listings, or browse the full marketplace.'}
                </p>
                <Link
                  href="/marketplace"
                  className="mt-2 px-6 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Browse Marketplace
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Product View */}
      {fullscreenProduct && (
        <FullscreenProductView
          product={fullscreenProduct}
          isOpen={!!fullscreenProduct}
          onClose={() => setFullscreenProduct(null)}
          onSave={handleFullscreenSave}
          onSkip={handleFullscreenSkip}
          onBuyNow={handleFullscreenBuyNow}
        />
      )}
    </div>
  );
}
