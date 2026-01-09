'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  image: string;
  viewedAt: string;
}

interface RecentlyViewedProps {
  items: RecentlyViewedItem[];
  onClear?: () => void;
}

export default function RecentlyViewed({ items, onClear }: RecentlyViewedProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="subheader-vintage">Recently Viewed</h3>
        {onClear && items.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-vintage-secondary hover:text-vintage-muted transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="scroll-x-vintage">
        {items.slice(0, 10).map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="recently-viewed-item group flex-shrink-0"
          >
            <div className="relative w-20 h-20 overflow-hidden rounded-vintage bg-vintage-stone">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover filter-vintage group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

