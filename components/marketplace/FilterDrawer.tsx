'use client';

import React, { useState, useEffect } from 'react';
import { ProductCategory, ProductCondition, DeliveryMethod } from '@/types';
import { SIZE_PRESETS } from '@/components/listings/SizeSelector';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: ProductCategory;
  selectedSubcategory?: string;
  priceRange: [number, number];
  condition?: ProductCondition;
  location?: string;
  deliveryMethod?: DeliveryMethod;
  size?: string;
  color?: string;
  onCategoryChange: (category: ProductCategory | undefined) => void;
  onSubcategoryChange: (subcategory: string | undefined) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onConditionChange: (condition: ProductCondition | undefined) => void;
  onLocationChange: (location: string | undefined) => void;
  onDeliveryMethodChange: (method: DeliveryMethod | undefined) => void;
  onSizeChange?: (size: string | undefined) => void;
  onColorChange?: (color: string | undefined) => void;
  onClearAll: () => void;
}

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'home', label: 'Home' },
];

const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: 'brand_new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

// Helper function to get sizes based on category
const getSizesForCategory = (category?: ProductCategory | string): string[] => {
  const categoryStr = category as string;
  if (categoryStr === 'mens') {
    return SIZE_PRESETS.mens.map(s => s.value);
  } else if (categoryStr === 'womens') {
    return SIZE_PRESETS.womens.map(s => s.value);
  }
  // Default sizes for other categories or no category selected
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
};

const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Pink', hex: '#FFC0CB' },
];

const LOCATIONS = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'];

export default function FilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  selectedSubcategory,
  priceRange,
  condition,
  location,
  deliveryMethod,
  size,
  color,
  onCategoryChange,
  onSubcategoryChange,
  onPriceRangeChange,
  onConditionChange,
  onLocationChange,
  onDeliveryMethodChange,
  onSizeChange,
  onColorChange,
  onClearAll,
}: FilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasActiveFilters =
    selectedCategory || selectedSubcategory || condition || location || deliveryMethod || size || color ||
    priceRange[0] > 0 || priceRange[1] < 100000;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-vintage-cream rounded-t-2xl max-h-[85vh] animate-slide-up-drawer flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-vintage-cream px-4 py-4 border-b border-vintage flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-vintage-primary">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="text-sm text-vintage-muted hover:text-vintage-primary transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vintage-stone rounded-vintage transition-colors"
          >
            <svg className="w-6 h-6 text-vintage-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Category */}
          <div>
            <h3 className="filter-label-vintage">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    if (selectedCategory === cat.value) {
                      onCategoryChange(undefined);
                    } else {
                      onCategoryChange(cat.value);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-vintage-primary text-white'
                      : 'bg-vintage-stone text-vintage-muted hover:bg-vintage-warm'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="filter-label-vintage">Price Range</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-vintage-secondary mb-1 block">Min</label>
                <input
                  type="number"
                  placeholder="0"
                  value={priceRange[0] || ''}
                  onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                  className="input-vintage"
                />
              </div>
              <span className="text-vintage-secondary mt-5">—</span>
              <div className="flex-1">
                <label className="text-xs text-vintage-secondary mb-1 block">Max</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={priceRange[1] === 100000 ? '' : priceRange[1]}
                  onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 100000])}
                  className="input-vintage"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="filter-label-vintage">Size</h3>
            <div className="flex flex-wrap gap-2">
              {getSizesForCategory(selectedCategory).map((s) => (
                <button
                  key={s}
                  onClick={() => onSizeChange?.(size === s ? undefined : s)}
                  className={`px-4 py-2 rounded-vintage text-sm font-medium transition-colors ${
                    size === s
                      ? 'bg-vintage-primary text-white'
                      : 'bg-vintage-stone text-vintage-muted hover:bg-vintage-warm'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <h3 className="filter-label-vintage">Condition</h3>
            <div className="space-y-2">
              {CONDITIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={condition === value}
                    onChange={() => onConditionChange(condition === value ? undefined : value)}
                    className="w-5 h-5 rounded border-vintage-border text-vintage-primary focus:ring-vintage-muted"
                  />
                  <span className="text-sm text-vintage-primary">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <h3 className="filter-label-vintage">Color</h3>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => onColorChange?.(color === c.name ? undefined : c.name)}
                  title={c.name}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    color === c.name
                      ? 'border-vintage-primary scale-110 shadow-vintage'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ 
                    backgroundColor: c.hex,
                    boxShadow: c.hex === '#FFFFFF' ? 'inset 0 0 0 1px #E0DCD4' : undefined 
                  }}
                />
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="filter-label-vintage">Location</h3>
            <select
              value={location || ''}
              onChange={(e) => onLocationChange(e.target.value || undefined)}
              className="select-vintage"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-vintage-cream p-4 border-t border-vintage flex gap-3">
          <button
            onClick={() => {
              onClearAll();
            }}
            className="flex-1 py-3 border border-vintage-border rounded-vintage font-medium text-vintage-muted hover:bg-vintage-stone transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-vintage-primary text-white rounded-vintage font-medium hover:bg-gray-800 transition-colors"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

