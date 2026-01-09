'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';

// Fixed maximum price for this curated section
const MAX_PRICE = 1500; // KSH

export default function AffordableFindsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        maxPrice: MAX_PRICE.toString(),
        sortBy: sortBy,
      });
      
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Title - styled like Women, Men, Vintage sections */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2">
              Affordable Finds
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              A rotating selection of well-priced thrift pieces
            </p>
          </div>

          {/* Sort Control */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : `${products.length} items`}
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
            </select>
          </div>

          {/* Products Grid or Empty State */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} isLoading={false} />
          ) : (
            <div className="text-center py-20 max-w-md mx-auto">
              <h2 className="text-xl font-medium text-gray-900 mb-3">
                No items here right now
              </h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                This edit updates as sellers add new listings. Check back soon or browse the full collection.
              </p>
              <div className="space-y-3">
                <Link href="/marketplace">
                  <Button variant="primary" size="md" className="w-full sm:w-auto">
                    Browse all items
                  </Button>
                </Link>
                <div>
                  <Link 
                    href="/marketplace" 
                    className="text-sm text-gray-700 hover:text-black hover:underline transition-colors"
                  >
                    Find your style
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

