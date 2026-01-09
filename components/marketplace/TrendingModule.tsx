'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface TrendingModuleProps {
  products: Product[];
  title?: string;
}

export default function TrendingModule({ 
  products, 
  title = 'Popular this week' 
}: TrendingModuleProps) {
  if (products.length === 0) return null;

  return (
    <div className="trending-module mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-vintage-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="subheader-vintage">{title}</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {products.slice(0, 3).map((product, index) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group"
          >
            <div className="relative aspect-square overflow-hidden rounded-vintage bg-vintage-stone mb-2">
              <Image
                src={product.images[0] || '/placeholder-product.jpg'}
                alt={product.title}
                fill
                className="object-cover filter-vintage group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 33vw, 100px"
              />
              {/* Rank badge */}
              <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-vintage-paper/90 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-semibold text-vintage-primary">{index + 1}</span>
              </div>
            </div>
            <p className="text-xs text-vintage-primary font-medium truncate">
              {formatPrice(product.price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

