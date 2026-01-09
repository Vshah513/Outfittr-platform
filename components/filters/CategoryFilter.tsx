'use client';

import React from 'react';
import { ProductCategory } from '@/types';

interface CategoryFilterProps {
  selectedCategory?: ProductCategory;
  selectedSubcategory?: string;
  onCategoryChange: (category: ProductCategory) => void;
  onSubcategoryChange: (subcategory: string | undefined) => void;
}

const categories = {
  clothing: { label: 'Clothing', subcategories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear'] },
  shoes: { label: 'Shoes', subcategories: ['Sneakers', 'Boots', 'Heels', 'Sandals', 'Flats'] },
  accessories: { label: 'Accessories', subcategories: ['Jewelry', 'Watches', 'Sunglasses', 'Hats', 'Scarves'] },
  bags: { label: 'Bags', subcategories: ['Backpacks', 'Handbags', 'Crossbody', 'Totes', 'Clutches'] },
  beauty: { label: 'Beauty', subcategories: ['Makeup', 'Skincare', 'Fragrance', 'Hair'] },
  home: { label: 'Home', subcategories: ['Decor', 'Furniture', 'Lighting', 'Textiles'] },
  electronics: { label: 'Electronics', subcategories: ['Phones', 'Tablets', 'Audio', 'Cameras'] },
  books: { label: 'Books', subcategories: ['Fiction', 'Non-fiction', 'Comics', 'Magazines'] },
  sports: { label: 'Sports', subcategories: ['Equipment', 'Apparel', 'Accessories'] },
  vintage: { label: 'Vintage', subcategories: ['Clothing', 'Accessories', 'Home', 'Collectibles'] },
};

export default function CategoryFilter({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Categories</h3>
      <div className="space-y-2">
        {Object.entries(categories).map(([key, { label, subcategories }]) => {
          const isSelected = selectedCategory === key;
          
          return (
            <div key={key}>
              <button
                onClick={() => onCategoryChange(key as ProductCategory)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSelected 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
              
              {isSelected && subcategories.length > 0 && (
                <div className="ml-4 mt-2 space-y-1">
                  {subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => onSubcategoryChange(selectedSubcategory === sub ? undefined : sub)}
                      className={`block w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                        selectedSubcategory === sub
                          ? 'bg-gray-200 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

