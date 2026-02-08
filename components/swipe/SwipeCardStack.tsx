'use client';

import { AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import SwipeCard from './SwipeCard';

const MAX_VISIBLE_CARDS = 3;

interface SwipeCardStackProps {
  products: Product[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right', product: Product) => void;
  onExpandClick: (product: Product) => void;
}

export default function SwipeCardStack({
  products,
  currentIndex,
  onSwipe,
  onExpandClick,
}: SwipeCardStackProps) {
  // Get the visible cards (current + up to 2 behind)
  const visibleCards = products
    .slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS)
    .map((product, i) => ({ product, stackIndex: i }));

  return (
    <div className="relative w-full aspect-[3/4] max-w-[400px] mx-auto">
      <AnimatePresence mode="popLayout">
        {visibleCards
          .slice()
          .reverse() // Render bottom cards first so top card is on top in DOM
          .map(({ product, stackIndex }) => (
            <SwipeCard
              key={product.id}
              product={product}
              stackIndex={stackIndex}
              isTop={stackIndex === 0}
              onSwipe={(direction) => onSwipe(direction, product)}
              onExpandClick={() => onExpandClick(product)}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
