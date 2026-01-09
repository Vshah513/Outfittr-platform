'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';

const STORAGE_KEY = 'thrift_recently_viewed';
const MAX_ITEMS = 20;

interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  image: string;
  viewedAt: string;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving recently viewed:', error);
      }
    }
  }, [items, isLoaded]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      // Remove existing entry if present (dedup)
      const filtered = prev.filter((item) => item.id !== product.id);
      
      // Add new item at the beginning
      const newItem: RecentlyViewedItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0] || '/placeholder-product.jpg',
        viewedAt: new Date().toISOString(),
      };
      
      // Keep only MAX_ITEMS
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    clearAll,
    isLoaded,
  };
}

