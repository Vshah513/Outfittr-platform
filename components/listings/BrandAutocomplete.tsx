'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Popular brands for autocomplete
const POPULAR_BRANDS = [
  'Nike', 'Adidas', 'Zara', 'H&M', 'Gucci', 'Prada', 'Louis Vuitton',
  'Chanel', 'Dior', 'Versace', 'Calvin Klein', 'Tommy Hilfiger', 
  'Ralph Lauren', 'Levi\'s', 'Puma', 'Reebok', 'New Balance',
  'Converse', 'Vans', 'The North Face', 'Patagonia', 'Carhartt',
  'Supreme', 'Stussy', 'Burberry', 'Balenciaga', 'Off-White',
  'Stone Island', 'Fred Perry', 'Lacoste', 'Polo', 'Gap',
  'Old Navy', 'Forever 21', 'Topshop', 'ASOS', 'Uniqlo',
  'Mango', 'Bershka', 'Pull & Bear', 'Massimo Dutti', 'COS',
  'Acne Studios', 'A.P.C.', 'Comme des Garçons', 'Maison Margiela',
  'Y-3', 'Yeezy', 'Jordan', 'Thrasher', 'Champion', 'Dickies',
];

interface BrandAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export default function BrandAutocomplete({
  value,
  onChange,
  label,
  error,
  helperText,
  required,
}: BrandAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = POPULAR_BRANDS.filter(brand =>
        brand.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(POPULAR_BRANDS.slice(0, 8));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (brand: string) => {
    onChange(brand);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      {label && (
        <label className="block text-xs uppercase tracking-[0.1em] font-medium text-vintage-muted">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Start typing or select..."
          className={cn(
            'input-vintage pr-10',
            error && 'border-red-300 focus:border-red-500'
          )}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-vintage-muted hover:text-vintage-primary transition-colors"
        >
          <svg 
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && filteredBrands.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-vintage rounded-vintage shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {filteredBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => handleSelect(brand)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                  value.toLowerCase() === brand.toLowerCase()
                    ? "bg-vintage-primary text-white"
                    : "hover:bg-vintage-cream text-vintage-primary"
                )}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-vintage-secondary">{helperText}</p>
      )}
    </div>
  );
}

