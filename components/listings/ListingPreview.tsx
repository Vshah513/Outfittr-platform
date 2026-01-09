'use client';

import React from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface ListingPreviewProps {
  title: string;
  description: string;
  price: string;
  images: string[];
  coverIndex: number;
  category: string;
  subcategory: string;
  size?: string;
  condition: string;
  brand?: string;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
};

export default function ListingPreview({
  title,
  description,
  price,
  images,
  coverIndex,
  category,
  subcategory,
  size,
  condition,
  brand,
}: ListingPreviewProps) {
  // Always use the first image as cover for marketplace display
  const coverImage = images[0];
  const displayPrice = price ? parseFloat(price) : 0;

  return (
    <div className="sticky top-24 space-y-4">
      {/* Header */}
      <div className="bg-vintage-paper border border-vintage rounded-vintage p-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-vintage-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] font-medium text-vintage-muted">
              Marketplace Preview
            </p>
            <p className="text-[10px] text-vintage-secondary">
              Showing first image as cover
            </p>
          </div>
        </div>
      </div>

      {/* Product Card Preview */}
      <div className="vintage-card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-vintage-stone">
          {coverImage ? (
            <Image
              src={coverImage}
              alt="Preview"
              fill
              className="object-cover filter-vintage"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-vintage-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-vintage-secondary">Upload photos</p>
              </div>
            </div>
          )}

          {/* Image Count Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {images.length}
            </div>
          )}

          {/* Condition Badge */}
          {condition && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
              {CONDITION_LABELS[condition]}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-4 space-y-2">
          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {title || (
              <span className="text-vintage-secondary italic">Enter a title...</span>
            )}
          </h3>

          {/* Price */}
          <p className="price-vintage">
            {displayPrice > 0 ? formatPrice(displayPrice) : (
              <span className="text-vintage-secondary text-sm font-normal italic">KES 0</span>
            )}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-vintage-secondary">
            {brand && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {brand}
              </span>
            )}
            {size && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {size}
              </span>
            )}
            {subcategory && (
              <span>• {subcategory}</span>
            )}
          </div>

          {/* Description Preview */}
          {description && (
            <p className="text-xs text-vintage-secondary line-clamp-2 pt-2 border-t border-vintage">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-vintage-paper border border-vintage rounded-vintage p-3 space-y-2">
        <p className="text-xs font-medium text-vintage-primary flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Listing Tips
        </p>
        <ul className="space-y-1.5 text-[11px] text-vintage-secondary">
          <li className="flex items-start gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0 mt-0.5 text-vintage-muted" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Use natural lighting for photos
          </li>
          <li className="flex items-start gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0 mt-0.5 text-vintage-muted" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Be specific about condition & flaws
          </li>
          <li className="flex items-start gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0 mt-0.5 text-vintage-muted" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Price competitively for quick sales
          </li>
        </ul>
      </div>
    </div>
  );
}

