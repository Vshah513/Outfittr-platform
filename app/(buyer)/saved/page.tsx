'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

export default function SavedItemsPage() {
  const [savedItems, setSavedItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const response = await fetch('/api/saved-items');
      if (response.ok) {
        const json = await response.json();
        const rows = json.data || [];
        // API returns [{ product_id, user_id, created_at, product: Product }, ...]
        const products = rows
          .map((row: { product?: Product }) => row.product)
          .filter((p: Product | undefined): p is Product => p != null && p.status === 'active');
        setSavedItems(products);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSaved = async (productId: string) => {
    try {
      const response = await fetch(`/api/saved-items?product_id=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedItems(prev => prev.filter(item => item.id !== productId));
      }
    } catch (error) {
      console.error('Error removing saved item:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
            <p className="text-gray-600 mt-2">
              Items you&apos;ve saved from the app or marketplace. Only active listings are shown ({savedItems.length}).
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : savedItems.length === 0 ? (
            <EmptyState
              title="No saved items yet"
              description="Start saving items you love to easily find them later"
              actionLabel="Browse Marketplace"
              actionHref="/marketplace"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedItems.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <button
                    onClick={() => handleRemoveSaved(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors z-10"
                    aria-label="Remove from saved"
                  >
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

