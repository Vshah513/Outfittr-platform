'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CatalogProductCard from '@/components/products/CatalogProductCard';
import { Product, ProductCondition } from '@/types';
import { SIZE_PRESETS } from '@/components/listings/SizeSelector';

const SUBCATEGORIES = [
  'All',
  'T-Shirts',
  'Shirts',
  'Hoodies',
  'Jeans',
  'Trousers',
  'Sweaters',
  'Coats & Jackets',
  'Activewear',
  'Shoes',
  'Bags',
  'Accessories',
];

const CONDITIONS: { value: ProductCondition | ''; label: string }[] = [
  { value: '', label: 'All Conditions' },
  { value: 'brand_new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

function MenCategoryContent() {
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'All');
  const [condition, setCondition] = useState<ProductCondition | ''>(searchParams.get('condition') as ProductCondition || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');
  const [size, setSize] = useState<string | undefined>(searchParams.get('size') || undefined);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const menSizes = SIZE_PRESETS.mens.map(s => s.value);

  useEffect(() => {
    fetchProducts();
  }, [selectedSubcategory, condition, sortBy, priceMin, priceMax, size]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('category', 'mens');
      
      if (selectedSubcategory && selectedSubcategory !== 'All') {
        params.append('subcategory', selectedSubcategory.toLowerCase());
      }
      if (condition) params.append('condition', condition);
      if (sortBy) params.append('sortBy', sortBy);
      if (priceMin) params.append('minPrice', priceMin);
      if (priceMax) params.append('maxPrice', priceMax);
      if (size) params.append('size', size);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedSubcategory('All');
    setCondition('');
    setPriceMin('');
    setPriceMax('');
    setSize(undefined);
    setSortBy('newest');
  };

  const hasActiveFilters = selectedSubcategory !== 'All' || condition || priceMin || priceMax || size;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text)] mb-2">
              Men
            </h1>
            <p className="text-[var(--text-2)]">
              Curated secondhand pieces for men
            </p>
          </div>

          {/* Subcategory Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
            {SUBCATEGORIES.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSubcategory === sub
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface)]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--divider)]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium">Filters</span>
              </button>

              <span className="text-sm text-[var(--text-2)]">
                {isLoading ? 'Loading...' : `${products.length} items`}
              </span>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-fill)] text-[var(--text)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition-all"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden md:block w-56 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-fill)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    />
                    <span className="text-[var(--text-3)]">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-fill)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    />
                  </div>
                </div>

                <hr className="border-[var(--divider)]" />

                <div>
                  <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {menSizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(size === s ? undefined : s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          size === s
                            ? 'bg-[var(--text)] text-[var(--bg)]'
                            : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-[var(--divider)]" />

                <div>
                  <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Condition</h3>
                  <div className="space-y-2">
                    {CONDITIONS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="condition"
                          checked={condition === value}
                          onChange={() => setCondition(value)}
                          className="w-4 h-4 border-[var(--border)] text-[var(--text)] focus:ring-[var(--brand)]"
                        />
                        <span className="text-sm text-[var(--text-2)]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-[var(--surface-2)] rounded-lg mb-3" />
                      <div className="space-y-2">
                        <div className="h-4 bg-[var(--surface-2)] rounded w-1/3" />
                        <div className="h-4 bg-[var(--surface-2)] rounded w-2/3" />
                        <div className="h-3 bg-[var(--surface-2)] rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <svg 
                    className="mx-auto h-12 w-12 text-[var(--text-3)]" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-[var(--text)]">No items found</h3>
                  <p className="mt-2 text-sm text-[var(--text-2)]">
                    Try adjusting your filters or check back later for new listings.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-6 py-2 bg-[var(--text)] text-[var(--bg)] rounded-full text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => (
                    <CatalogProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilters(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up-drawer bg-[var(--surface)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 px-4 py-4 border-b flex items-center justify-between bg-[var(--surface)] border-[var(--divider)]">
              <h2 className="text-lg font-bold text-[var(--text)]">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-[var(--surface-2)] rounded-lg text-[var(--text)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-fill)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                  <span className="text-[var(--text-3)]">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-fill)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {menSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(size === s ? undefined : s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        size === s
                          ? 'bg-[var(--text)] text-[var(--bg)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Condition</h3>
                <div className="space-y-2">
                  {CONDITIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition-mobile"
                        checked={condition === value}
                        onChange={() => setCondition(value)}
                        className="w-4 h-4 border-[var(--border)] text-[var(--text)] focus:ring-[var(--brand)]"
                      />
                      <span className="text-sm text-[var(--text-2)]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-4 border-t flex gap-3 bg-[var(--surface)] border-[var(--divider)]">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 border border-[var(--border)] rounded-lg font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 bg-[var(--text)] text-[var(--bg)] rounded-lg font-medium hover:opacity-90 transition-colors"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function MenCategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text)]"></div>
      </div>
    }>
      <MenCategoryContent />
    </Suspense>
  );
}

