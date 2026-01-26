'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product, SellerTrustMetrics } from '@/types';
import { formatPrice } from '@/lib/utils';
import FollowButton from '@/components/ui/FollowButton';
import AddToBundleButton from '@/components/bundles/AddToBundleButton';

interface VintageProductCardProps {
  product: Product & {
    seller?: {
      id: string;
      full_name: string;
      avatar_url?: string;
      location?: string;
      trust_metrics?: SellerTrustMetrics;
    };
    // Tier-based features from API
    seller_tier?: string;
    is_featured_seller?: boolean;
    is_trending_eligible?: boolean;
  };
  showFollowButton?: boolean;
  isFollowing?: boolean;
  showQuickView?: boolean;
  showBundleButton?: boolean;
  onSave?: (productId: string) => void;
  isSaved?: boolean;
}

export default function VintageProductCard({ 
  product, 
  showFollowButton = false,
  isFollowing = false,
  showQuickView = true,
  showBundleButton = true,
  onSave,
  isSaved = false,
}: VintageProductCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Safely get the first image with fallback
  const mainImage = (product.images && Array.isArray(product.images) && product.images.length > 0)
    ? product.images[0]
    : '/placeholder-product.jpg';
  
  // Use placeholder if image failed to load
  const displayImage = imageError ? '/placeholder-product.jpg' : mainImage;
  
  const sellerId = product.seller?.id || product.seller_id;
  const sellerName = product.seller?.full_name || product.seller_name || 'Seller';
  const trustMetrics = product.seller?.trust_metrics;
  
  // Reset error state when product changes
  React.useEffect(() => {
    setImageError(false);
  }, [product.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    onSave?.(product.id);
  };

  // Get up to 2 trust badges
  const getTrustBadges = () => {
    if (!trustMetrics) return [];
    const badges: { label: string; type: 'success' | 'info' }[] = [];
    
    if (trustMetrics.response_time_tier === 'fast') {
      badges.push({ label: 'Fast replies', type: 'info' });
    }
    if (trustMetrics.vouch_count > 0) {
      badges.push({ label: 'Vouched', type: 'success' });
    }
    if (badges.length < 2 && (trustMetrics.phone_verified || trustMetrics.email_verified)) {
      badges.push({ label: 'Verified', type: 'success' });
    }
    
    return badges.slice(0, 2);
  };

  const trustBadges = getTrustBadges();

  return (
    <div 
      className="vintage-card group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.id}`}>
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-vintage-stone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover filter-vintage transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              console.error('Image failed to load:', { src: mainImage, product: product.title });
              setImageError(true);
            }}
          />
          
          {/* Film grain overlay */}
          <div className="film-grain-light" />
          
          {/* Top action buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {/* Bundle Button */}
            {showBundleButton && product.status === 'active' && (
              <AddToBundleButton product={product} size="sm" />
            )}
            
            {/* Save/Bookmark Button */}
            <button 
              onClick={handleSave}
              className={`save-btn-vintage ${saved ? 'saved' : ''}`}
              aria-label={saved ? 'Remove from saved' : 'Save item'}
            >
              <svg 
                className="w-5 h-5" 
                fill={saved ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
            </button>
          </div>

          {/* Badges Row */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {/* Condition Badge */}
            {product.condition === 'brand_new' && (
              <div className="badge-vintage-success">
                New with tags
              </div>
            )}
            
            {/* Featured Seller Badge (Pro) */}
            {product.is_featured_seller && (
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-md">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                </svg>
                Pro
              </div>
            )}
            
            {/* Trending Badge (Growth+ with high views) */}
            {product.is_trending_eligible && !product.is_featured_seller && (product.view_count || 0) >= 10 && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-md">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                Trending
              </div>
            )}
          </div>

          {/* Quick View Overlay */}
          {showQuickView && (
            <div className={`quick-view-overlay flex flex-col items-center justify-center p-4 ${isHovered ? 'opacity-100 visible' : ''}`}>
              <div className="text-center space-y-3">
                <div className="space-y-1">
                  {product.size && (
                    <p className="text-sm text-vintage-muted">
                      Size: <span className="font-medium text-vintage-primary">{product.size}</span>
                    </p>
                  )}
                  <p className="text-sm text-vintage-muted">
                    Condition: <span className="font-medium text-vintage-primary capitalize">{product.condition.replace('_', ' ')}</span>
                  </p>
                  {product.location && (
                    <p className="text-sm text-vintage-muted">
                      {product.location}
                    </p>
                  )}
                </div>
                
                <button 
                  className="btn-vintage-primary text-xs px-4 py-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Navigate to product page with message intent
                    window.location.href = `/product/${product.id}?action=message`;
                  }}
                >
                  Message Seller
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-3 space-y-2">
          {/* Price - First */}
          <p className="price-vintage">{formatPrice(product.price)}</p>
          
          {/* Title - Second */}
          <h3 className="text-sm text-vintage-primary line-clamp-2 leading-snug group-hover:underline decoration-vintage-border">
            {product.title}
          </h3>
          
          {/* Size & Condition - Third */}
          <div className="flex items-center gap-2 text-xs text-vintage-secondary">
            {product.size && <span>Size {product.size}</span>}
            {product.size && <span className="text-vintage-border">·</span>}
            <span className="capitalize">{product.condition.replace('_', ' ')}</span>
          </div>

          {/* Trust Badges Row - Compact, max 2 */}
          {trustBadges.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {trustBadges.map((badge, index) => (
                <span 
                  key={index} 
                  className={badge.type === 'success' ? 'badge-vintage-success' : 'badge-vintage'}
                >
                  {badge.type === 'success' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {badge.type === 'info' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {/* Seller Info - Last */}
          <div className="flex items-center justify-between pt-1">
            <span 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/seller/${sellerId}`;
              }}
              className="text-xs text-vintage-secondary hover:text-vintage-primary transition-colors truncate max-w-[70%] cursor-pointer"
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
        </div>
      </Link>
    </div>
  );
}

