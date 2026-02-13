'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface CatalogProductCardProps {
  product: Product & {
    seller?: {
      id: string;
      full_name: string;
      avatar_url?: string;
      location?: string;
    };
  };
}

export default function CatalogProductCard({ product }: CatalogProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [secondImageError, setSecondImageError] = useState(false);
  
  // Safely get the first image with multiple fallbacks
  let mainImage = '/placeholder-product.jpg';
  
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    mainImage = product.images[0];
  }
  
  const secondImage = (product.images && product.images.length > 1) ? product.images[1] : null;
  const hasHoverImage = secondImage && !secondImageError;
  
  // Use placeholder if image failed to load or no valid image URL
  const displayImage = imageError ? '/placeholder-product.jpg' : mainImage;
  
  const sellerId = product.seller?.id || product.seller_id;
  const sellerName = product.seller?.full_name || product.seller_name || 'Seller';

  // Debug: Log product data to identify image loading issue
  React.useEffect(() => {
    if (!product.images || product.images.length === 0) {
      console.warn('Product missing images:', {
        id: product.id,
        title: product.title,
        images: product.images,
      });
    }
  }, [product.id, product.images, product.title]);
  
  // Reset error state when product changes
  React.useEffect(() => {
    setImageError(false);
    setSecondImageError(false);
  }, [product.id]);

  return (
    <div className="group relative">
      <Link href={`/product/${product.id}`}>
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--surface-2)] mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              console.error('Image failed to load:', {
                src: mainImage,
                product: product.title,
              });
              setImageError(true);
            }}
          />
          {hasHoverImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={secondImage}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:scale-105"
              onError={() => setSecondImageError(true)}
            />
          )}
          
          {/* Like Button */}
          <button 
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all z-10 bg-[var(--surface)]/90 hover:bg-[var(--surface)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Implement save functionality
            }}
            aria-label="Save item"
          >
            <svg className="w-5 h-5 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Condition Badge */}
          {product.condition === 'brand_new' && (
            <div className="absolute bottom-2 left-2 bg-[var(--surface)] px-2 py-1 rounded-md text-xs font-medium text-[var(--text)]">
              New
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="space-y-1">
          {/* Price */}
          <p className="font-bold text-[var(--text)]">{formatPrice(product.price)}</p>
          
          {/* Title */}
          <h3 className="text-sm text-[var(--text)] line-clamp-2 group-hover:underline">
            {product.title}
          </h3>
          
          {/* Size */}
          {product.size && (
            <p className="text-xs text-[var(--text-3)]">Size {product.size}</p>
          )}

          {/* Seller */}
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/seller/${sellerId}`;
            }}
            className="text-xs text-[var(--text-3)] hover:text-[var(--text)] hover:underline truncate block cursor-pointer"
          >
            {sellerName}
          </span>
        </div>
      </Link>
    </div>
  );
}

