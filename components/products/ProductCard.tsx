'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, SellerTrustMetrics } from '@/types';
import { formatPrice } from '@/lib/utils';
import FollowButton from '@/components/ui/FollowButton';
import AddToBundleButton from '@/components/bundles/AddToBundleButton';

interface ProductCardProps {
  product: Product & {
    seller?: {
      id: string;
      full_name: string;
      avatar_url?: string;
      location?: string;
      trust_metrics?: SellerTrustMetrics;
    };
  };
  showFollowButton?: boolean;
  isFollowing?: boolean;
  showTrustBadges?: boolean;
  showBundleButton?: boolean;
}

export default function ProductCard({ 
  product, 
  showFollowButton = false,
  isFollowing = false,
  showTrustBadges = false,
  showBundleButton = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [secondImageError, setSecondImageError] = useState(false);
  
  // Safely get the first image with fallback
  const mainImage = (product.images && Array.isArray(product.images) && product.images.length > 0)
    ? product.images[0]
    : '/placeholder-product.jpg';
  
  // Second image for hover (when seller uploaded more than one)
  const secondImage = (product.images && Array.isArray(product.images) && product.images.length > 1)
    ? product.images[1]
    : null;
  
  const hasHoverImage = secondImage && !secondImageError;
  
  // Use placeholder if image failed to load
  const displayImage = imageError ? '/placeholder-product.jpg' : mainImage;
  
  const sellerId = product.seller?.id || product.seller_id;
  const sellerName = product.seller?.full_name || product.seller_name || 'Seller';
  
  // Reset error state when product changes
  useEffect(() => {
    setImageError(false);
    setSecondImageError(false);
  }, [product.id]);

  return (
    <div className="group relative">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => {
              console.error('Image failed to load:', { src: mainImage, product: product.title });
              setImageError(true);
            }}
          />
          {/* Second image on hover */}
          {hasHoverImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={secondImage!}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-300 opacity-0 group-hover:opacity-100"
              onError={() => setSecondImageError(true)}
            />
          )}
          
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            {/* Bundle Button */}
            {showBundleButton && product.status === 'active' && (
              <AddToBundleButton product={product} size="sm" />
            )}
            
            {/* Like Button */}
            <button 
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement like functionality
              }}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Condition Badge */}
          {product.condition === 'brand_new' && (
            <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded-md text-xs font-medium">
              New
            </div>
          )}
        </div>

        <div className="space-y-1">
          {/* Seller Info Row */}
          <div className="flex items-center justify-between gap-2">
            <span 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/seller/${sellerId}`;
              }}
              className="text-sm text-gray-600 truncate hover:text-gray-900 hover:underline cursor-pointer"
            >
              {sellerName}
            </span>
            {showFollowButton && sellerId && (
              <FollowButton 
                sellerId={sellerId} 
                initialIsFollowing={isFollowing}
                size="sm"
              />
            )}
          </div>
          
          {/* Trust Badges (compact) */}
          {showTrustBadges && product.seller?.trust_metrics && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.seller.trust_metrics.phone_verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Phone
                </span>
              )}
              {product.seller.trust_metrics.email_verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email
                </span>
              )}
              {product.seller.trust_metrics.response_time_tier === 'fast' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Fast replies
                </span>
              )}
            </div>
          )}
          
          <h3 className="font-medium text-sm line-clamp-2 group-hover:underline">
            {product.title}
          </h3>
          <p className="font-bold">{formatPrice(product.price)}</p>
          {product.size && (
            <p className="text-xs text-gray-500">Size {product.size}</p>
          )}
        </div>
      </Link>
    </div>
  );
}

