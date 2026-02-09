import React from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  showFollowButton?: boolean;
  showTrustBadges?: boolean;
  showBundleButton?: boolean;
  followedSellerIds?: string[];
}

export default function ProductGrid({ 
  products, 
  isLoading,
  showFollowButton = true,
  showTrustBadges = true,
  showBundleButton = true,
  followedSellerIds = [],
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-[var(--surface-2)] rounded-lg mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-[var(--surface-2)] rounded w-2/3" />
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/2" />
              <div className="h-5 bg-[var(--surface-2)] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
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
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product}
          showFollowButton={showFollowButton}
          showTrustBadges={showTrustBadges}
          showBundleButton={showBundleButton}
          isFollowing={followedSellerIds.includes(product.seller_id)}
        />
      ))}
    </div>
  );
}

