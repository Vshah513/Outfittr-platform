'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type VibeKey = 'under-1000' | 'vintage' | 'streetwear';

const VIBES: { key: VibeKey; label: string }[] = [
  { key: 'under-1000', label: 'Under Ksh 1,000' },
  { key: 'vintage', label: 'Vintage / Old Money' },
  { key: 'streetwear', label: 'Streetwear' },
];

function VibeProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const mainImage = (product.images && product.images.length > 0) ? product.images[0] : '/placeholder-product.jpg';
  const displayImage = imageError ? '/placeholder-product.jpg' : mainImage;

  const subtitle = [product.size, product.color, product.subcategory].filter(Boolean).join(' ');
  const description = subtitle ? `${product.title} - ${subtitle}` : product.title;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block flex-shrink-0 w-full min-w-0 bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-white mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      </div>
      <p className="font-bold text-[var(--text)]">{formatPrice(product.price)}</p>
      <p className="text-sm text-[var(--text-2)] line-clamp-2 mt-0.5 group-hover:underline">
        {description}
      </p>
    </Link>
  );
}

export default function BrowseByVibe() {
  const [activeVibe, setActiveVibe] = useState<VibeKey>('under-1000');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '4');
      params.append('sortBy', 'popular');

      if (activeVibe === 'under-1000') {
        params.append('maxPrice', '1000');
      } else if (activeVibe === 'vintage') {
        params.append('searchQuery', 'vintage|old money|retro');
      } else if (activeVibe === 'streetwear') {
        params.append('searchQuery', 'streetwear|street wear');
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setProducts(data.data || []);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeVibe]);

  return (
    <section className="py-16 md:py-20 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-editorial text-3xl md:text-4xl font-medium tracking-tight text-[var(--text)]">
            Browse by vibe.
          </h2>
        </div>

        {/* Category tabs - like reference: rectangular, one active with dark bg */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {VIBES.map((vibe) => (
            <button
              key={vibe.key}
              type="button"
              onClick={() => setActiveVibe(vibe.key)}
              className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeVibe === vibe.key
                  ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                  : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--text-2)]'
              }`}
            >
              {vibe.label}
            </button>
          ))}
        </div>

        {/* Product grid - 4 items, clean white cards like reference */}
        <div className="mb-10">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4">
                  <div className="aspect-[3/4] rounded-lg bg-[var(--surface-2)] mb-3" />
                  <div className="h-5 w-20 bg-[var(--surface-2)] rounded mb-2" />
                  <div className="h-4 w-full bg-[var(--surface-2)] rounded" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <VibeProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--text-2)] py-12">
              No listings in this category yet. Check back soon!
            </p>
          )}
        </div>

        <div className="text-center">
          <Link href="/marketplace">
            <Button variant="outline" size="lg" className="px-10">
              Browse marketplace
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
