import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-2 tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-11 w-full border border-border bg-white px-4 py-3',
            'text-base text-text-primary placeholder:text-text-muted',
            'transition-all duration-300',
            'focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-text-secondary">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
