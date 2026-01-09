import React from 'react';
import { cn } from '@/lib/utils';

interface VintageInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  characterCount?: { current: number; max: number };
}

export const VintageInput = React.forwardRef<HTMLInputElement, VintageInputProps>(
  ({ className, label, error, helperText, characterCount, required, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs uppercase tracking-[0.1em] font-medium text-vintage-muted">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'input-vintage',
            error && 'border-red-300 focus:border-red-500',
            className
          )}
          {...props}
        />
        <div className="flex items-start justify-between gap-2 min-h-[20px]">
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
          {characterCount && (
            <p className={cn(
              "text-xs ml-auto flex-shrink-0",
              characterCount.current > characterCount.max 
                ? "text-red-600 font-medium" 
                : "text-vintage-secondary"
            )}>
              {characterCount.current}/{characterCount.max}
            </p>
          )}
        </div>
      </div>
    );
  }
);

VintageInput.displayName = 'VintageInput';

