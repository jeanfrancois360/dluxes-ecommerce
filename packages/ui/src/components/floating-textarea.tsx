'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, error, icon, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    // Update hasValue when the controlled value prop changes
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setHasValue(String(value).length > 0);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(e.target.value !== '');
      props.onChange?.(e);
    };

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className="relative w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-4 text-neutral-400 transition-colors z-10">
              {icon}
            </div>
          )}

          <textarea
            ref={ref}
            value={value}
            className={cn(
              // Base styles
              'peer w-full px-4 py-4 bg-white',
              'border-2 border-neutral-200 rounded-lg',
              'text-base text-black transition-all duration-300',
              'placeholder-transparent resize-none',
              'min-h-[120px]',

              // Focus styles
              'focus:outline-none focus:border-gold focus:ring-0',

              // Hover styles
              'hover:border-neutral-300',

              // Error styles
              error && 'border-error-DEFAULT focus:border-error-DEFAULT',

              // Icon spacing
              icon && 'pl-12',

              className
            )}
            placeholder={label}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          <motion.label
            className={cn(
              'absolute left-4 transition-all duration-300 pointer-events-none',
              'text-neutral-500 bg-white px-1',
              icon && isLabelFloating && 'left-4',
              icon && !isLabelFloating && 'left-12',
            )}
            animate={{
              top: isLabelFloating ? '8px' : '20px',
              fontSize: isLabelFloating ? '12px' : '16px',
              y: 0,
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

FloatingTextarea.displayName = 'FloatingTextarea';

export { FloatingTextarea };
