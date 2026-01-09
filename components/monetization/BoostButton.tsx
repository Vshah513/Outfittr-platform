'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BoostModal } from './BoostModal';
import { BoostPackage } from '@/types';

interface BoostButtonProps {
  product: {
    id: string;
    title: string;
  };
  userPhone?: string;
  variant?: 'default' | 'small' | 'icon';
  className?: string;
}

export function BoostButton({ product, userPhone, variant = 'default', className = '' }: BoostButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBoost, setActiveBoost] = useState<unknown>(null);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // Check boost status and get packages
      const response = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await response.json();

      if (data.activeBoost) {
        setActiveBoost(data.activeBoost);
        // Show message that product is already boosted
        alert('This product already has an active boost!');
        return;
      }

      setPackages(data.packages || []);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error checking boost status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 ${className}`}
          title="Boost this listing"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        <BoostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          packages={packages}
          userPhone={userPhone}
        />
      </>
    );
  }

  if (variant === 'small') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 ${className}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Boost
        </button>

        <BoostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          packages={packages}
          userPhone={userPhone}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ${className}`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {isLoading ? 'Loading...' : 'Boost Listing'}
      </Button>

      <BoostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        packages={packages}
        userPhone={userPhone}
      />
    </>
  );
}

