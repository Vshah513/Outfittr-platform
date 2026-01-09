'use client';

import React from 'react';
import { ProductCondition, DeliveryMethod } from '@/types';

interface SubcategoryFilterProps {
  priceRange: [number, number];
  condition?: ProductCondition;
  location?: string;
  deliveryMethod?: DeliveryMethod;
  onPriceRangeChange: (range: [number, number]) => void;
  onConditionChange: (condition: ProductCondition | undefined) => void;
  onLocationChange: (location: string | undefined) => void;
  onDeliveryMethodChange: (method: DeliveryMethod | undefined) => void;
}

const conditions: { value: ProductCondition; label: string }[] = [
  { value: 'brand_new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const deliveryMethods: { value: DeliveryMethod; label: string }[] = [
  { value: 'shipping', label: 'Shipping' },
  { value: 'pickup', label: 'Local Pickup' },
  { value: 'both', label: 'Both' },
];

const locations = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
];

export default function SubcategoryFilter({
  priceRange,
  condition,
  location,
  deliveryMethod,
  onPriceRangeChange,
  onConditionChange,
  onLocationChange,
  onDeliveryMethodChange,
}: SubcategoryFilterProps) {
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0] || ''}
              onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1] === 100000 ? '' : priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 100000])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Condition</h3>
        <div className="space-y-2">
          {conditions.map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={condition === value}
                onChange={() => onConditionChange(condition === value ? undefined : value)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Location</h3>
        <select
          value={location || ''}
          onChange={(e) => onLocationChange(e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Delivery Method */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Delivery</h3>
        <div className="space-y-2">
          {deliveryMethods.map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deliveryMethod === value}
                onChange={() => onDeliveryMethodChange(deliveryMethod === value ? undefined : value)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

