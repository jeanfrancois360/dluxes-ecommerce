'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, icon, type = 'text', value, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    // Update hasValue when the controlled value prop changes
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setHasValue(String(value).length > 0);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== '');
      props.onChange?.(e);
    };

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className="relative w-full">
        <div className="relative">
          {icon && (
            <div
              className="absolute left-4 text-neutral-400 pointer-events-none transition-[top] duration-200 -translate-y-1/2"
              // When label is floating, align icon with the text zone (below the label).
              // When not floating, center it in the full field.
              style={{ top: isLabelFloating ? '68%' : '50%' }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            value={value}
            className={cn(
              // Base styles — pt-6 pb-2 keeps same total height as py-4 but pushes
              // text cursor to 24px from top, cleanly below the floating label.
              'peer w-full px-4 pt-6 pb-2 bg-white',
              'border-2 border-neutral-200 rounded-lg',
              'text-base text-black transition-all duration-200',
              'placeholder-transparent',

              // Focus styles — gold ring for visibility
              'focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20',

              // Hover styles
              'hover:border-neutral-300',

              // Error styles
              error &&
                'border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error-DEFAULT/20',

              // Disabled styles
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-50',

              // Icon spacing
              icon && 'pl-12',

              // Neutralize browser autofill yellow background
              '[&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#000]',

              className
            )}
            placeholder={label}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          <motion.label
            // Always anchored at left-4; horizontal offset handled by `x` animation
            // so the slide from icon-position → top-left is smooth (not a class snap).
            className="absolute left-4 pointer-events-none leading-none"
            animate={{
              top: isLabelFloating ? '6px' : '50%',
              fontSize: isLabelFloating ? '11px' : '16px',
              y: isLabelFloating ? 0 : '-50%',
              // Shift right by 32px (left-4→left-12 difference) when beside the icon
              x: icon && !isLabelFloating ? 32 : 0,
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
