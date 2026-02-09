'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/utils';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionId } from '@/lib/session';
import PurchaseModal from '@/components/checkout/PurchaseModal';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // Track product view when component mounts
  useEffect(() => {
    if (params.id && !isLoading && product) {
      trackProductView();
    }
  }, [params.id, product, isLoading]);

  // Handle purchase callback (after Paystack redirect)
  useEffect(() => {
    const ref = searchParams.get('ref');
    const purchase = searchParams.get('purchase');

    if (ref && purchase === 'success') {
      verifyPurchase(ref);
    }
  }, [searchParams]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackProductView = async () => {
    try {
      const sessionId = getSessionId();
      
      await fetch(`/api/products/${params.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          sessionId: user ? null : sessionId, // Only use sessionId for anonymous users
        }),
      });
    } catch (error) {
      // Silently fail - view tracking is not critical
      console.debug('View tracking failed:', error);
    }
  };

  const verifyPurchase = async (reference: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}`);
      const data = await response.json();

      if (data.status === 'success') {
        setPurchaseSuccess(true);
        // Refresh product to show "sold" status
        await fetchProduct();
      } else if (data.status === 'pending') {
        // Poll again after a short delay
        setTimeout(() => verifyPurchase(reference), 3000);
        return;
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
    } finally {
      setIsVerifying(false);
    }

    // Clean up URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    url.searchParams.delete('purchase');
    window.history.replaceState({}, '', url.pathname);
  };

  const handleBuyNow = () => {
    // Sign-in required only when about to buy (listing view is public)
    if (!user) {
      openAuthModal(`/product/${params.id}`, undefined, 'signin');
      return;
    }

    if (product?.seller?.id && user.id === product.seller.id) {
      return; // Can't buy own product
    }

    if (product?.status !== 'active') {
      return; // Product not available
    }

    setShowPurchaseModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="text-emerald-600 hover:underline mb-6"
          >
            ← Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <div className="bg-[var(--surface)] rounded-lg overflow-hidden mb-4 border border-[var(--border)]">
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[selectedImage] || '/placeholder-product.jpg'}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImage === idx ? 'border-emerald-600' : 'border-[var(--border)]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={img} 
                        alt={`${product.title} ${idx + 1}`} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
                <h1 className="text-3xl font-bold mb-2 text-[var(--text)]">{product.title}</h1>
                <p className="text-4xl font-bold text-emerald-600 mb-6">
                  {formatPrice(product.price)}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-2)]">Condition:</span>
                    <span className="font-medium capitalize text-[var(--text)]">{product.condition?.replace('_', ' ')}</span>
                  </div>
                  {product.size && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-2)]">Size:</span>
                      <span className="font-medium text-[var(--text)]">{product.size}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-2)]">Brand:</span>
                      <span className="font-medium text-[var(--text)]">{product.brand}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-2)]">Category:</span>
                    <span className="font-medium capitalize">{product.category} - {product.subcategory}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--divider)] pt-6 mb-6">
                  <h2 className="font-semibold text-lg mb-2 text-[var(--text)]">Description</h2>
                  <p className="text-[var(--text-2)]">{product.description}</p>
                </div>

                <div className="border-t border-[var(--divider)] pt-6 mb-6">
                  <h2 className="font-semibold text-lg mb-2 text-[var(--text)]">Delivery Options</h2>
                  <p className="text-[var(--text-2)] capitalize">{product.delivery_method?.replace('_', ' ')}</p>
                  {product.meetup_location && (
                    <p className="text-sm text-[var(--text-2)] mt-1">Meet-up: {product.meetup_location}</p>
                  )}
                  {product.shipping_cost && (
                    <p className="text-sm text-[var(--text-2)] mt-1">Shipping: {formatPrice(product.shipping_cost)}</p>
                  )}
                </div>

                {/* Seller Info */}
                {product.seller && (
                  <div className="border-t border-[var(--divider)] pt-6 mb-6">
                    <h2 className="font-semibold text-lg mb-3 text-[var(--text)]">Seller Information</h2>
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-[var(--surface-2)] p-3 rounded-lg transition-colors"
                      onClick={() => router.push(`/seller/${product.seller?.id}`)}
                    >
                      {product.seller.avatar_url ? (
                        <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={product.seller.avatar_url} 
                            alt={product.seller.full_name} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                          <span className="text-xl font-semibold text-[var(--text-2)]">
                            {product.seller.full_name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--text)]">{product.seller.full_name}</p>
                        {product.seller.location && (
                          <p className="text-sm text-[var(--text-2)]">{product.seller.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchase Success Banner */}
                {purchaseSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium text-green-800">Purchase successful!</p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Payment confirmed. The seller has been notified.
                    </p>
                  </div>
                )}

                {/* Verifying Payment */}
                {isVerifying && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="font-medium text-blue-800">Verifying payment...</p>
                    </div>
                  </div>
                )}

                {/* Sold Badge */}
                {product.status === 'sold' && !purchaseSuccess && (
                  <div className="mb-4 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-center">
                    <p className="font-semibold text-[var(--text-2)] text-lg">SOLD</p>
                    <p className="text-sm text-[var(--text-3)]">This item has been sold</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Buy Now Button - Only show for active products */}
                  {product.status === 'active' && (
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                      onClick={handleBuyNow}
                      disabled={Boolean(user && user.id === product.seller?.id)}
                    >
                      Buy Now &bull; {formatPrice(product.price)}
                    </Button>
                  )}

                  {user && user.id === product.seller?.id && (
                    <p className="text-xs text-center text-[var(--text-3)]">This is your listing</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Purchase Confirmation Modal */}
      {product && (
        <PurchaseModal
          product={product}
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
    </div>
  );
}

