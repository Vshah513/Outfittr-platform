'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

const COMMENT_MAX_LENGTH = 2000;

type OrderTab = 'all' | 'completed';

interface RateSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

function RateSellerModal({ isOpen, onClose, order, onSuccess }: RateSellerModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const displayRating = hoverRating || rating;

  const handleSubmit = useCallback(async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating (1–5).');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }
      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        onClose();
        setRating(0);
        setComment('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id, rating, comment, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Rate your seller</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            How was your experience with {order.seller?.full_name ?? 'this seller'}?
          </p>

          {order.product && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              {order.product.images?.[0] ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                  <Image
                    src={order.product.images[0]}
                    alt={order.product.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {order.product.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Purchased item</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Thanks for your review!</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your rating (required)</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 rounded"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <svg
                        className={`w-10 h-10 ${star <= displayRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="review-comment" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Your review (optional)
                </label>
                <textarea
                  id="review-comment"
                  placeholder="Share your experience with this seller..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                  maxLength={COMMENT_MAX_LENGTH}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {comment.length} / {COMMENT_MAX_LENGTH}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Submit review
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [rateOrder, setRateOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const status = activeTab === 'completed' ? 'completed' : undefined;
      const url = status
        ? `/api/orders?role=buyer&status=completed`
        : '/api/orders?role=buyer';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = activeTab === 'completed'
    ? orders.filter((o) => o.status === 'completed')
    : orders;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View your purchases and rate sellers when you’re ready.
            </p>
          </div>

          <nav className="flex gap-2 mb-6" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'completed'}
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Completed
            </button>
          </nav>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description={
                activeTab === 'completed'
                  ? 'You have no completed orders.'
                  : 'When you buy items, they’ll show up here.'
              }
              actionLabel="Browse Marketplace"
              actionHref="/marketplace"
            />
          ) : (
            <ul className="space-y-4">
              {filteredOrders.map((order) => (
                <li
                  key={order.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
                >
                  <div className="p-4 flex gap-4">
                    {order.product?.images?.[0] ? (
                      <Link
                        href={`/product/${order.product_id}`}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative"
                      >
                        <Image
                          src={order.product.images[0]}
                          alt={order.product.title ?? 'Product'}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${order.product_id}`}
                        className="font-medium text-gray-900 dark:text-white hover:underline line-clamp-2"
                      >
                        {order.product?.title ?? 'Product'}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Sold by {order.seller?.full_name ?? 'Seller'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(order.amount_kes)} · {formatDate(order.created_at)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                              : order.status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.status === 'completed' && (
                          order.can_review ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRateOrder(order)}
                            >
                              Rate seller
                            </Button>
                          ) : order.review_id ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">Reviewed</span>
                          ) : null
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />

      {rateOrder && (
        <RateSellerModal
          isOpen={!!rateOrder}
          onClose={() => setRateOrder(null)}
          order={rateOrder}
          onSuccess={() => {
            setRateOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
