'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'thrift_saved_items';

export function useSavedItems() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedIds(new Set(parsed));
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when savedIds change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds]));
      } catch (error) {
        console.error('Error saving saved items:', error);
      }
    }
  }, [savedIds, isLoaded]);

  const toggleSave = useCallback((productId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((productId: string) => {
    return savedIds.has(productId);
  }, [savedIds]);

  const clearAll = useCallback(() => {
    setSavedIds(new Set());
  }, []);

  return {
    savedIds: [...savedIds],
    toggleSave,
    isSaved,
    clearAll,
    isLoaded,
    count: savedIds.size,
  };
}

