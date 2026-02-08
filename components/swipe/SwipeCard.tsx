'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

const SWIPE_THRESHOLD = 100; // px distance
const VELOCITY_THRESHOLD = 500; // px/s

interface SwipeCardProps {
  product: Product;
  onSwipe: (direction: 'left' | 'right') => void;
  onExpandClick: () => void;
  isTop: boolean;
  stackIndex: number;
}

export default function SwipeCard({
  product,
  onSwipe,
  onExpandClick,
  isTop,
  stackIndex,
}: SwipeCardProps) {
  const x = useMotionValue(0);

  // Rotation based on drag offset (max ~12deg)
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);

  // Like overlay opacity (right drag)
  const likeOpacity = useTransform(x, [0, 80, 160], [0, 0.6, 1]);

  // Nope overlay opacity (left drag)
  const nopeOpacity = useTransform(x, [-160, -80, 0], [1, 0.6, 0]);

  // Scale for stacked cards behind the top card
  const scale = isTop ? 1 : 1 - stackIndex * 0.05;
  const yOffset = isTop ? 0 : stackIndex * 8;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;

    // Swipe right
    if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
      onSwipe('right');
      return;
    }
    // Swipe left
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
      onSwipe('left');
      return;
    }
    // Snap back (framer-motion handles this automatically via dragSnapToOrigin)
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpandClick();
  };

  const imageUrl = product.images?.[0] || '/placeholder-product.jpg';
  const conditionLabel = product.condition?.replace(/_/g, ' ') || '';

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      dragSnapToOrigin
      onDragEnd={isTop ? handleDragEnd : undefined}
      // Exit animation
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.3 },
      }}
    >
      {/* Card Container */}
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl bg-gray-100 relative">
        {/* Product Image */}
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 90vw, 400px"
          className="object-cover pointer-events-none"
          priority={stackIndex === 0}
          draggable={false}
        />

        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Like Overlay (right swipe) */}
        {isTop && (
          <motion.div
            className="absolute inset-0 bg-emerald-500/30 rounded-2xl flex items-center justify-center pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            <div className="bg-emerald-500 text-white rounded-full p-4 shadow-lg">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Nope Overlay (left swipe) */}
        {isTop && (
          <motion.div
            className="absolute inset-0 bg-red-500/30 rounded-2xl flex items-center justify-center pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            <div className="bg-red-500 text-white rounded-full p-4 shadow-lg">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Expand (Fullscreen) Button */}
        {isTop && (
          <button
            onClick={handleExpandClick}
            className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 backdrop-blur-sm transition-colors"
            aria-label="View full details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        )}

        {/* Product Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white pointer-events-none">
          <h3 className="text-xl font-bold mb-1 line-clamp-2">{product.title}</h3>
          <p className="text-2xl font-bold mb-2">{formatPrice(product.price)}</p>
          <div className="flex items-center gap-2 text-sm text-white/80">
            {product.size && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                {product.size}
              </span>
            )}
            {conditionLabel && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                {conditionLabel}
              </span>
            )}
            {product.brand && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                {product.brand}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
