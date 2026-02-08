'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBundle } from './BundleContext';
import { formatPrice } from '@/lib/utils';

export default function BundleTray() {
  const router = useRouter();
  const { items, sellerName, sellerId, totalPrice, itemCount, removeItem, clearBundle } = useBundle();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRequestingBundle, setIsRequestingBundle] = useState(false);
  const [offerAmount, setOfferAmount] = useState<string>('');

  const handleRequestBundle = useCallback(async () => {
    if (!sellerId || items.length === 0) return;

    setIsRequestingBundle(true);
    try {
      const productIds = items.map(item => item.product.id);
      const offer = offerAmount ? parseFloat(offerAmount) : null;

      const response = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: sellerId,
          product_ids: productIds,
          offer_amount: offer,
        }),
      });

      if (response.ok) {
        clearBundle();
        setIsExpanded(false);
        router.push('/marketplace');
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to request bundle');
      }
    } catch (error) {
      console.error('Error requesting bundle:', error);
      alert('Something went wrong');
    } finally {
      setIsRequestingBundle(false);
    }
  }, [sellerId, items, offerAmount, clearBundle, router]);

  // Don't render if no items
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-2xl mx-auto px-4 pb-4 pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Collapsed View - Always visible when items in bundle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Item previews */}
              <div className="flex -space-x-2">
                {items.slice(0, 3).map((item, index) => (
                  <div
                    key={item.product.id}
                    className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border-2 border-white shadow-sm"
                    style={{ zIndex: 3 - index }}
                  >
                    {item.product.images?.[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
                {itemCount > 3 && (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-gray-600">
                    +{itemCount - 3}
                  </div>
                )}
              </div>
              
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  Bundle from {sellerName}
                </p>
                <p className="text-xs text-gray-500">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} • {formatPrice(totalPrice)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-black">
                Request Bundle
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </button>

          {/* Expanded View */}
          {isExpanded && (
            <div className="border-t border-gray-100">
              {/* Items List */}
              <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.product.images?.[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Offer Input */}
              <div className="px-4 py-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your offer (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    KES
                  </span>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder={totalPrice.toString()}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Listed total: {formatPrice(totalPrice)}
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
                <button
                  onClick={clearBundle}
                  className="px-4 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleRequestBundle}
                  disabled={isRequestingBundle}
                  className={`
                    flex-1 py-2.5 bg-black text-white rounded-lg font-medium
                    hover:bg-gray-800 transition-colors
                    ${isRequestingBundle ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isRequestingBundle ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    `Request Bundle ${offerAmount ? `for ${formatPrice(parseFloat(offerAmount))}` : ''}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


