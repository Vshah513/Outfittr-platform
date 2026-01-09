'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface SaveButtonProps {
  productId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function SaveButton({
  productId,
  size = 'sm',
  className = '',
}: SaveButtonProps) {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if product is saved
  useEffect(() => {
    if (user) {
      checkSavedStatus();
    }
  }, [user, productId]);

  const checkSavedStatus = async () => {
    try {
      const response = await fetch('/api/saved-items');
      if (response.ok) {
        const { data } = await response.json();
        const saved = data.some((item: any) => item.product_id === productId);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!user) {
      openAuthModal(pathname, { type: 'save', productId }, 'signin');
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Unsave
        const response = await fetch(`/api/saved-items?product_id=${productId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsSaved(false);
        }
      } else {
        // Save
        const response = await fetch('/api/saved-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
        });
        if (response.ok) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        bg-white/90 hover:bg-white rounded-full 
        flex items-center justify-center 
        shadow-sm transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isSaved ? 'Remove from saved' : 'Save item'}
    >
      {isSaved ? (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}

