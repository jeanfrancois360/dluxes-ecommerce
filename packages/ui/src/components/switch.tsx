'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ id, checked = false, onCheckedChange, disabled = false, className }, ref) => {
    return (
      <button
        id={id}
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CBB57B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border',
          checked
            ? 'bg-[#CBB57B] border-[#CBB57B]'
            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
          className
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
