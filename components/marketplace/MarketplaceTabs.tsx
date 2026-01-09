'use client';

import { MarketplaceTab } from '@/types';

interface MarketplaceTabsProps {
  activeTab: MarketplaceTab;
  onTabChange: (tab: MarketplaceTab) => void;
  isLoggedIn: boolean;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

const TABS: { id: MarketplaceTab; label: string; requiresAuth: boolean }[] = [
  { id: 'for-you', label: 'For You', requiresAuth: false },
  { id: 'following', label: 'Following', requiresAuth: true },
  { id: 'new', label: 'New', requiresAuth: false },
];

export default function MarketplaceTabs({ activeTab, onTabChange, isLoggedIn, sortBy, onSortChange }: MarketplaceTabsProps) {
  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2.5">
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
                  className={`
                    relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-black text-white shadow-sm' 
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  title={isDisabled ? 'Sign in to see sellers you follow' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Sort dropdown on the right */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>
    </div>
  );
}


