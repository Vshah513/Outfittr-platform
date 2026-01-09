'use client';

import React from 'react';
import { MarketplaceTab } from '@/types';

interface MarketplaceControlsProps {
  activeTab: MarketplaceTab;
  onTabChange: (tab: MarketplaceTab) => void;
  isLoggedIn: boolean;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFilterClick: () => void;
  activeFilterCount?: number;
}

const TABS: { id: MarketplaceTab; label: string; requiresAuth: boolean }[] = [
  { id: 'for-you', label: 'For You', requiresAuth: false },
  { id: 'following', label: 'Following', requiresAuth: true },
  { id: 'new', label: 'New', requiresAuth: false },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function MarketplaceControls({
  activeTab,
  onTabChange,
  isLoggedIn,
  sortBy,
  onSortChange,
  onFilterClick,
  activeFilterCount = 0,
}: MarketplaceControlsProps) {
  return (
    <div className="sticky-controls border-b border-vintage">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Tabs on the left */}
          <nav className="flex items-center gap-1" role="tablist">
            {TABS.map((tab) => {
              const isDisabled = tab.requiresAuth && !isLoggedIn;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-disabled={isDisabled}
                  onClick={() => !isDisabled && onTabChange(tab.id)}
                  className={isActive ? 'tab-vintage-active' : `tab-vintage ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={isDisabled ? 'Sign in to see sellers you follow' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Sort + Filter on the right */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="select-vintage text-sm py-2 pr-8 hidden sm:block"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filter Button (Mobile only, desktop has sidebar) */}
            <button
              onClick={onFilterClick}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-vintage bg-vintage-stone text-vintage-muted hover:bg-vintage-warm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-vintage-primary text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

