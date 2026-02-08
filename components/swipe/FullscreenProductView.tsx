'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useBundle } from '@/components/bundles/BundleContext';

interface FullscreenProductViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onSkip: () => void;
}

export default function FullscreenProductView({
  product,
  isOpen,
  onClose,
  onSave,
  onSkip,
}: FullscreenProductViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem, isInBundle, canAddToBundle } = useBundle();
  const [addedToCart, setAddedToCart] = useState(false);

  const images = product.images?.length ? product.images : ['/placeholder-product.jpg'];

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setAddedToCart(false);
  }, [product.id]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevImage, nextImage]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAddToCart = () => {
    if (canAddToBundle(product)) {
      addItem(product);
      setAddedToCart(true);
    }
  };

  const conditionLabel = product.condition?.replace(/_/g, ' ') || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Link
              href={`/product/${product.id}`}
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
            >
              View listing page
            </Link>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>

          {/* Content: single column on mobile, two columns on large screens */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row md:overflow-hidden">
            {/* Image Carousel - on desktop fills height almost to the action bar */}
            <div className="relative aspect-square md:aspect-auto md:h-full md:flex-shrink-0 md:w-1/2 bg-gray-100">
              <Image
                src={images[currentImageIndex]}
                alt={`${product.title} - image ${currentImageIndex + 1}`}
                fill
                sizes="100vw"
                className="object-cover md:object-contain"
                priority
              />

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Product Details - scrollable column on desktop */}
            <div className="flex-1 min-h-0 overflow-y-auto md:w-1/2">
              <div className="px-5 py-4 md:py-5 space-y-4">
                {/* Title & Price */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{product.title}</h2>
                  <p className="text-xl md:text-2xl font-bold text-black">{formatPrice(product.price)}</p>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-2">
                {product.size && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    Size: {product.size}
                  </span>
                )}
                {conditionLabel && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {conditionLabel}
                  </span>
                )}
                {product.brand && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {product.category}
                  </span>
                )}
              </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line line-clamp-6 md:line-clamp-4 text-sm md:text-base">
                      {product.description}
                    </p>
                  </div>
                )}

                  {/* Seller Info */}
                {(product.seller || product.seller_name) && (
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    {(product.seller?.avatar_url || product.seller_avatar) && (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <Image
                          src={product.seller?.avatar_url || product.seller_avatar || ''}
                          alt={product.seller?.full_name || product.seller_name || 'Seller'}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.seller?.full_name || product.seller_name}
                      </p>
                      {product.seller?.location && (
                        <p className="text-sm text-gray-500">{product.seller.location}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{product.location || 'Location not specified'}</span>
                  </div>
                  {product.delivery_method && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="capitalize">{product.delivery_method === 'both' ? 'Pickup & Shipping' : product.delivery_method}</span>
                      {product.shipping_cost != null && product.shipping_cost > 0 && (
                        <span className="text-gray-400">({formatPrice(product.shipping_cost)} shipping)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar (fixed) */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 flex gap-3">
            {/* Skip Button */}
            <button
              onClick={onSkip}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Skip
            </button>

            {/* Save Button */}
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Save
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addedToCart || isInBundle(product.id) || !canAddToBundle(product)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                addedToCart || isInBundle(product.id)
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : !canAddToBundle(product)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {addedToCart || isInBundle(product.id) ? 'In Bundle' : 'Add to Cart'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
