'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product, BundleItem } from '@/types';

interface BundleContextType {
  items: BundleItem[];
  sellerId: string | null;
  sellerName: string | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearBundle: () => void;
  isInBundle: (productId: string) => boolean;
  canAddToBundle: (product: Product) => boolean;
  totalPrice: number;
  itemCount: number;
}

const BundleContext = createContext<BundleContextType | undefined>(undefined);

const BUNDLE_STORAGE_KEY = 'thrift_bundle';

interface StoredBundle {
  items: BundleItem[];
  sellerId: string | null;
  sellerName: string | null;
}

export function BundleProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BundleItem[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BUNDLE_STORAGE_KEY);
      if (stored) {
        const data: StoredBundle = JSON.parse(stored);
        setItems(data.items || []);
        setSellerId(data.sellerId || null);
        setSellerName(data.sellerName || null);
      }
    } catch (error) {
      console.error('Error loading bundle from storage:', error);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      const data: StoredBundle = { items, sellerId, sellerName };
      localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving bundle to storage:', error);
    }
  }, [items, sellerId, sellerName]);

  const addItem = useCallback((product: Product) => {
    const productSellerId = product.seller_id;
    const productSellerName = product.seller_name || 'Seller';

    setItems(prev => {
      // Check if already in bundle
      if (prev.some(item => item.product.id === product.id)) {
        return prev;
      }

      // If bundle is empty, set the seller
      if (prev.length === 0) {
        setSellerId(productSellerId);
        setSellerName(productSellerName);
      }

      // Add to bundle
      return [...prev, { product, added_at: new Date().toISOString() }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.product.id !== productId);
      
      // If bundle is now empty, clear seller info
      if (newItems.length === 0) {
        setSellerId(null);
        setSellerName(null);
      }
      
      return newItems;
    });
  }, []);

  const clearBundle = useCallback(() => {
    setItems([]);
    setSellerId(null);
    setSellerName(null);
  }, []);

  const isInBundle = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId);
  }, [items]);

  const canAddToBundle = useCallback((product: Product) => {
    // Can add if bundle is empty or product is from same seller
    if (items.length === 0) return true;
    return product.seller_id === sellerId;
  }, [items.length, sellerId]);

  const totalPrice = items.reduce((sum, item) => sum + item.product.price, 0);
  const itemCount = items.length;

  return (
    <BundleContext.Provider
      value={{
        items,
        sellerId,
        sellerName,
        addItem,
        removeItem,
        clearBundle,
        isInBundle,
        canAddToBundle,
        totalPrice,
        itemCount,
      }}
    >
      {children}
    </BundleContext.Provider>
  );
}

export function useBundle() {
  const context = useContext(BundleContext);
  if (context === undefined) {
    throw new Error('useBundle must be used within a BundleProvider');
  }
  return context;
}


