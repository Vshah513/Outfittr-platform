'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SizePreset {
  value: string;
  label: string;
}

// Size presets by category
// Export for use in filter components
export const SIZE_PRESETS: Record<string, SizePreset[]> = {
  mens: [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
    { value: '3XL', label: '3XL' },
  ],
  womens: [
    { value: 'XXS', label: 'XXS' },
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
  ],
  shoes: [
    { value: '36', label: 'EU 36' },
    { value: '37', label: 'EU 37' },
    { value: '38', label: 'EU 38' },
    { value: '39', label: 'EU 39' },
    { value: '40', label: 'EU 40' },
    { value: '41', label: 'EU 41' },
    { value: '42', label: 'EU 42' },
    { value: '43', label: 'EU 43' },
    { value: '44', label: 'EU 44' },
    { value: '45', label: 'EU 45' },
  ],
  kids: [
    { value: '2Y', label: '2Y' },
    { value: '4Y', label: '4Y' },
    { value: '6Y', label: '6Y' },
    { value: '8Y', label: '8Y' },
    { value: '10Y', label: '10Y' },
    { value: '12Y', label: '12Y' },
    { value: '14Y', label: '14Y' },
  ],
  default: [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
  ],
};

const SHOE_SUBCATEGORIES = ['Sneakers', 'Heels', 'Boots', 'Sandals', 'Flats', 'Loafers', 'Sports Shoes'];

interface SizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  category: string;
  subcategory?: string;
  label?: string;
  error?: string;
  helperText?: string;
}

export default function SizeSelector({
  value,
  onChange,
  category,
  subcategory,
  label,
  error,
  helperText,
}: SizeSelectorProps) {
  const [customMode, setCustomMode] = React.useState(false);
  // Use shoe sizes when accessories + shoe subcategory (Sneakers, Heels, etc.)
  const useShoeSizes = category === 'accessories' && subcategory && SHOE_SUBCATEGORIES.includes(subcategory);
  const effectiveCategory = useShoeSizes ? 'shoes' : category;
  const presets = SIZE_PRESETS[effectiveCategory] || SIZE_PRESETS.default;

  // Check if current value is in presets
  const isPresetValue = presets.some(p => p.value === value);

  React.useEffect(() => {
    // If value exists but isn't a preset, switch to custom mode
    if (value && !isPresetValue) {
      setCustomMode(true);
    }
  }, [value, isPresetValue]);

  const handlePresetClick = (preset: string) => {
    setCustomMode(false);
    onChange(preset);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs uppercase tracking-[0.1em] font-medium text-vintage-muted">
          {label}
        </label>
      )}

      {customMode ? (
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter size..."
            className={cn(
              'input-vintage',
              error && 'border-red-300 focus:border-red-500'
            )}
          />
          <button
            type="button"
            onClick={() => {
              setCustomMode(false);
              onChange('');
            }}
            className="text-xs text-vintage-muted hover:text-vintage-primary transition-colors"
          >
            ← Back to presets
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetClick(preset.value)}
                className={cn(
                  "px-4 py-2 rounded-vintage text-sm font-medium transition-all duration-200",
                  value === preset.value
                    ? "bg-vintage-primary text-white ring-2 ring-vintage-primary ring-offset-2"
                    : "bg-vintage-cream hover:bg-vintage-stone text-vintage-primary border border-vintage"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className="text-xs text-vintage-muted hover:text-vintage-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Custom size
          </button>
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

