'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface FollowButtonProps {
  sellerId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'outline';
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export default function FollowButton({
  sellerId,
  initialIsFollowing = false,
  size = 'sm',
  variant = 'default',
  onFollowChange,
  className = '',
}: FollowButtonProps) {
  const { user, openAuthModal } = useAuth();
  const pathname = usePathname();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!user) {
      openAuthModal(pathname || undefined, { type: 'follow', sellerId }, 'signin');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follows/${sellerId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to unfollow');
        }
        
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        // Follow
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ seller_id: sellerId }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to follow');
        }
        
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
      // Revert the optimistic update
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [user, sellerId, isFollowing, onFollowChange, openAuthModal, pathname]);

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  };

  const variantClasses = isFollowing
    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-red-600'
    : variant === 'outline'
      ? 'border border-black text-black hover:bg-black hover:text-white'
      : 'bg-black text-white hover:bg-gray-800';

  return (
    <div className="relative">
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`
          rounded-full font-medium transition-all duration-200
          ${sizeClasses[size]}
          ${variantClasses}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        title={error || undefined}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        ) : isFollowing ? (
          <span className="group-hover:hidden">Following</span>
        ) : (
          'Follow'
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}


