'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/utils';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionId } from '@/lib/session';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isMessaging, setIsMessaging] = useState(false);

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

  const handleContactSeller = async () => {
    if (!user) {
      // Redirect to login
      router.push(`/login?returnTo=/product/${params.id}`);
      return;
    }

    if (!product?.seller?.id) {
      alert('Seller information not available');
      return;
    }

    // Don't allow sellers to message themselves
    if (user.id === product.seller.id) {
      alert('You cannot message yourself');
      return;
    }

    setIsMessaging(true);
    try {
      // Create or get existing conversation
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: product.seller.id,
          product_id: product.id,
          content: `Hi! I'm interested in "${product.title}"`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Extract conversation_id from the created message
        const conversationId = data.data?.conversation_id;
        
        // Redirect to messages page with the conversation selected
        if (conversationId) {
          router.push(`/messages?conversation=${conversationId}`);
        } else {
          router.push('/messages');
        }
      } else {
        alert(data.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to contact seller');
    } finally {
      setIsMessaging(false);
    }
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
    <div className="min-h-screen flex flex-col bg-gray-50">
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
              <div className="bg-white rounded-lg overflow-hidden mb-4">
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
                        selectedImage === idx ? 'border-emerald-600' : 'border-gray-200'
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
              <div className="bg-white rounded-lg p-6">
                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                <p className="text-4xl font-bold text-emerald-600 mb-6">
                  {formatPrice(product.price)}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium capitalize">{product.condition?.replace('_', ' ')}</span>
                  </div>
                  {product.size && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{product.size}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{product.category} - {product.subcategory}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h2 className="font-semibold text-lg mb-2">Description</h2>
                  <p className="text-gray-700">{product.description}</p>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h2 className="font-semibold text-lg mb-2">Delivery Options</h2>
                  <p className="text-gray-700 capitalize">{product.delivery_method?.replace('_', ' ')}</p>
                  {product.meetup_location && (
                    <p className="text-sm text-gray-600 mt-1">Meet-up: {product.meetup_location}</p>
                  )}
                  {product.shipping_cost && (
                    <p className="text-sm text-gray-600 mt-1">Shipping: {formatPrice(product.shipping_cost)}</p>
                  )}
                </div>

                {/* Seller Info */}
                {product.seller && (
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h2 className="font-semibold text-lg mb-3">Seller Information</h2>
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      onClick={() => router.push(`/seller/${product.seller?.id}`)}
                    >
                      {product.seller.avatar_url ? (
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={product.seller.avatar_url} 
                            alt={product.seller.full_name} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xl font-semibold text-gray-600">
                            {product.seller.full_name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.seller.full_name}</p>
                        {product.seller.location && (
                          <p className="text-sm text-gray-600">{product.seller.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full"
                    onClick={handleContactSeller}
                    disabled={isMessaging || Boolean(user && user.id === product.seller?.id)}
                  >
                    {isMessaging ? 'Starting conversation...' : 'Contact Seller'}
                  </Button>
                  
                  {user && user.id === product.seller?.id && (
                    <p className="text-xs text-center text-gray-500">This is your listing</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

