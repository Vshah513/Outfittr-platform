'use client';

import React, { useState } from 'react';
import { ProductCategory, ProductCondition, DeliveryMethod } from '@/types';
import { SIZE_PRESETS } from '@/components/listings/SizeSelector';

interface FilterRailProps {
  selectedCategory?: ProductCategory;
  selectedSubcategory?: string;
  priceRange: [number, number];
  condition?: ProductCondition;
  location?: string;
  deliveryMethod?: DeliveryMethod;
  brand?: string;
  color?: string;
  size?: string;
  onCategoryChange: (category: ProductCategory | undefined) => void;
  onSubcategoryChange: (subcategory: string | undefined) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onConditionChange: (condition: ProductCondition | undefined) => void;
  onLocationChange: (location: string | undefined) => void;
  onDeliveryMethodChange: (method: DeliveryMethod | undefined) => void;
  onBrandChange?: (brand: string | undefined) => void;
  onColorChange?: (color: string | undefined) => void;
  onSizeChange?: (size: string | undefined) => void;
  onClearAll: () => void;
}

const CATEGORIES: { value: ProductCategory | string; label: string; subcategories: string[] }[] = [
  { value: 'clothing', label: 'Clothing', subcategories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear'] },
  { value: 'accessories', label: 'Accessories', subcategories: ['Jewelry', 'Watches', 'Sunglasses', 'Hats', 'Scarves', 'Sneakers', 'Boots', 'Heels', 'Sandals', 'Flats', 'Handbags', 'Backpacks', 'Crossbody', 'Totes', 'Clutches'] },
  { value: 'vintage', label: 'Vintage', subcategories: ['70s', '80s', '90s', 'Y2K', 'Designer Vintage'] },
  { value: 'home', label: 'Home', subcategories: ['Decor', 'Furniture', 'Lighting', 'Textiles'] },
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

const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: 'shipping', label: 'Shipping' },
  { value: 'pickup', label: 'Local Pickup' },
  { value: 'both', label: 'Both' },
];

export default function FilterRail({
  selectedCategory,
  selectedSubcategory,
  priceRange,
  condition,
  location,
  deliveryMethod,
  brand,
  color,
  size,
  onCategoryChange,
  onSubcategoryChange,
  onPriceRangeChange,
  onConditionChange,
  onLocationChange,
  onDeliveryMethodChange,
  onBrandChange,
  onColorChange,
  onSizeChange,
  onClearAll,
}: FilterRailProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'category',
    'price',
    'condition',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const hasActiveFilters =
    selectedCategory || selectedSubcategory || condition || location || deliveryMethod || brand || color || size ||
    priceRange[0] > 0 || priceRange[1] < 100000;

  const selectedCategoryData = CATEGORIES.find((c) => c.value === selectedCategory);

  return (
    <div className="w-64 flex-shrink-0">
      <div className="sticky top-[120px] space-y-1">
        {/* Header with Clear All */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-vintage">
          <h2 className="font-medium text-sm text-vintage-primary">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-xs font-medium text-vintage-muted hover:text-vintage-primary transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category Section */}
        <div className="filter-section-vintage">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Category</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('category') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('category') && (
            <div className="space-y-1 pb-2">
              {CATEGORIES.map((cat) => (
                <div key={cat.value}>
                  <button
                    onClick={() => {
                      if (selectedCategory === cat.value) {
                        onCategoryChange(undefined);
                        onSubcategoryChange(undefined);
                      } else {
                        onCategoryChange(cat.value);
                        onSubcategoryChange(undefined);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-vintage text-sm transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-vintage-stone text-vintage-primary font-medium'
                        : 'text-vintage-muted hover:bg-vintage-cream'
                    }`}
                  >
                    {cat.label}
                  </button>
                  
                  {selectedCategory === cat.value && cat.subcategories.length > 0 && (
                    <div className="ml-3 mt-1 space-y-0.5">
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => onSubcategoryChange(selectedSubcategory === sub ? undefined : sub)}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                            selectedSubcategory === sub
                              ? 'bg-vintage-paper text-vintage-primary font-medium'
                              : 'text-vintage-secondary hover:text-vintage-muted'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Range Section */}
        <div className="filter-section-vintage">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Price Range</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('price') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('price') && (
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0] || ''}
                  onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                  className="input-vintage text-xs py-2"
                />
                <span className="text-vintage-secondary">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1] === 100000 ? '' : priceRange[1]}
                  onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 100000])}
                  className="input-vintage text-xs py-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Size Section */}
        <div className="filter-section-vintage">
          <button
            onClick={() => toggleSection('size')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Size</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('size') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('size') && (
            <div className="pb-2">
              <div className="flex flex-wrap gap-1.5">
                {getSizesForCategory(selectedCategory).map((s) => (
                  <button
                    key={s}
                    onClick={() => onSizeChange?.(size === s ? undefined : s)}
                    className={`px-3 py-1.5 rounded-vintage text-xs font-medium transition-colors ${
                      size === s
                        ? 'bg-vintage-stone text-vintage-primary'
                        : 'bg-vintage-cream text-vintage-muted hover:bg-vintage-stone'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Condition Section */}
        <div className="filter-section-vintage">
          <button
            onClick={() => toggleSection('condition')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Condition</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('condition') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('condition') && (
            <div className="space-y-1.5 pb-2">
              {CONDITIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={condition === value}
                    onChange={() => onConditionChange(condition === value ? undefined : value)}
                    className="checkbox-vintage"
                  />
                  <span className="text-xs text-vintage-muted group-hover:text-vintage-primary transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Color Section */}
        <div className="filter-section-vintage">
          <button
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Color</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('color') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('color') && (
            <div className="pb-2">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => onColorChange?.(color === c.name ? undefined : c.name)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      color === c.name
                        ? 'border-vintage-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="filter-section-vintage">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Location</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('location') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('location') && (
            <div className="pb-2">
              <select
                value={location || ''}
                onChange={(e) => onLocationChange(e.target.value || undefined)}
                className="select-vintage text-xs"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Delivery Method Section */}
        <div className="filter-section-vintage border-b-0">
          <button
            onClick={() => toggleSection('delivery')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="filter-label-vintage mb-0">Delivery</span>
            <svg
              className={`w-4 h-4 text-vintage-muted transition-transform ${expandedSections.includes('delivery') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes('delivery') && (
            <div className="space-y-1.5 pb-2">
              {DELIVERY_METHODS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={deliveryMethod === value}
                    onChange={() => onDeliveryMethodChange(deliveryMethod === value ? undefined : value)}
                    className="checkbox-vintage"
                  />
                  <span className="text-xs text-vintage-muted group-hover:text-vintage-primary transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

