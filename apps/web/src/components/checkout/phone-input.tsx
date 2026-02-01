'use client';

import * as React from 'react';
import { Input, cn } from '@nextpik/ui';
import {
  getCountryConfig,
  formatPhoneNumber,
  getPhonePlaceholder,
} from '@/lib/data/address-countries';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Phone Input Component
 *
 * Features:
 * - Shows country prefix (non-editable)
 * - Auto-formats as user types
 * - Country-specific placeholders
 * - Visual error states
 */
export function PhoneInput({
  value,
  onChange,
  countryCode,
  error,
  disabled = false,
  className,
}: PhoneInputProps) {
  const config = getCountryConfig(countryCode);
  const placeholder = getPhonePlaceholder(countryCode);

  /**
   * Handle input change with formatting
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');

    // Update with raw digits (formatting happens on display)
    onChange(digitsOnly);
  };

  /**
   * Format phone number for display
   */
  const getDisplayValue = () => {
    if (!value) return '';

    // Format according to country
    return formatPhoneNumber(value, countryCode);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Country Prefix (Read-only) */}
        <div
          className={cn(
            'flex items-center justify-center px-3 py-2 bg-muted rounded-md border min-w-[4rem]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-sm font-medium text-muted-foreground">
            {config.phonePrefix}
          </span>
        </div>

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={getDisplayValue()}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1',
            error && 'border-red-500',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? 'phone-error' : undefined}
        />
      </div>
    </div>
  );
}
