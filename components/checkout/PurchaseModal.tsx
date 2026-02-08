'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Product, PLATFORM_COMMISSION_RATE } from '@/types';
import { formatPrice } from '@/lib/utils';

interface PurchaseModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseModal({ product, isOpen, onClose }: PurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'purchase',
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to initialize payment');
        setIsProcessing(false);
        return;
      }

      if (data.type === 'redirect' && data.url) {
        // Redirect to Paystack checkout
        window.location.href = data.url;
      } else {
        setError('Unexpected payment response');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  const sellerAmount = product.price * (1 - PLATFORM_COMMISSION_RATE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Summary */}
          <div className="flex gap-4 mb-6">
            {product.images?.[0] && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
              {product.seller?.full_name && (
                <p className="text-sm text-gray-500">by {product.seller.full_name}</p>
              )}
              {product.condition && (
                <p className="text-xs text-gray-400 mt-1 capitalize">
                  {product.condition.replace('_', ' ')}
                </p>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Item price</span>
              <span className="font-medium">{formatPrice(product.price)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="text-emerald-600">{formatPrice(product.price)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-6 text-xs text-gray-500 space-y-1">
            <p>Payment processed securely via Paystack.</p>
            <p>You can pay with M-Pesa or card.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
              onClick={handlePurchase}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              {isProcessing ? 'Redirecting to payment...' : `Pay ${formatPrice(product.price)}`}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
