'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  options: Array<{
    value: string;
    label: string;
  }>;
}

const FloatingSelect = React.forwardRef<HTMLSelectElement, FloatingSelectProps>(
  ({ className, label, error, icon, options, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    // Update hasValue when the controlled value prop changes
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setHasValue(String(value).length > 0);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setHasValue(e.target.value !== '');
      props.onChange?.(e);
    };

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className="relative w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors z-10 pointer-events-none">
              {icon}
            </div>
          )}

          <select
            ref={ref}
            value={value}
            className={cn(
              // Base styles
              'peer w-full px-4 py-4 bg-white',
              'border-2 border-neutral-200 rounded-lg',
              'text-base text-black transition-all duration-300',
              'appearance-none cursor-pointer',

              // Focus styles
              'focus:outline-none focus:border-gold focus:ring-0',

              // Hover styles
              'hover:border-neutral-300',

              // Error styles
              error && 'border-error-DEFAULT focus:border-error-DEFAULT',

              // Icon spacing
              icon && 'pl-12',

              // Add padding for dropdown arrow
              'pr-10',

              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          >
            <option value="" disabled hidden>
              {label}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <motion.label
            className={cn(
              'absolute left-4 transition-all duration-300 pointer-events-none',
              'text-neutral-500 bg-white px-1',
              icon && isLabelFloating && 'left-4',
              icon && !isLabelFloating && 'left-12',
            )}
            animate={{
              top: isLabelFloating ? '8px' : '50%',
              fontSize: isLabelFloating ? '12px' : '16px',
              y: isLabelFloating ? 0 : '-50%',
            }}
            style={{
              color: error ? '#EF4444' : isFocused ? '#CBB57B' : '#737373',
            }}
          >
            {label}
          </motion.label>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-error-DEFAULT px-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingSelect.displayName = 'FloatingSelect';

export { FloatingSelect };
