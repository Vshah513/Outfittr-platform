'use client';

import { useBundle } from './BundleContext';
import { Product } from '@/types';

interface AddToBundleButtonProps {
  product: Product;
  size?: 'sm' | 'md';
  className?: string;
}

export default function AddToBundleButton({ product, size = 'sm', className = '' }: AddToBundleButtonProps) {
  const { addItem, removeItem, isInBundle, canAddToBundle, sellerId } = useBundle();
  
  const inBundle = isInBundle(product.id);
  const canAdd = canAddToBundle(product);
  const isDifferentSeller = sellerId && product.seller_id !== sellerId;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inBundle) {
      removeItem(product.id);
    } else if (canAdd) {
      addItem(product);
    }
  };

  // Don't show if product is from a different seller (bundle already has items from another seller)
  if (isDifferentSeller) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <button
      onClick={handleClick}
      title={inBundle ? 'Remove from bundle' : 'Add to bundle'}
      className={`
        inline-flex items-center gap-1 rounded-full font-medium transition-all
        ${sizeClasses[size]}
        ${inBundle 
          ? 'bg-black text-white hover:bg-gray-800' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        ${className}
      `}
    >
      {inBundle ? (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          In Bundle
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Bundle
        </>
      )}
    </button>
  );
}


