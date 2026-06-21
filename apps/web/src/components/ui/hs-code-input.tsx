'use client';

import React, { useState } from 'react';

// Valid HS code formats: 4-digit chapter, 6-digit subheading, or 8/10-digit national
const HS_REGEX = /^\d{4}(\.\d{2}(\.\d{2,4})?)?$/;

interface HsCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

export function HsCodeInput({ value, onChange, id, className = '' }: HsCodeInputProps) {
  const [touched, setTouched] = useState(false);

  const isValid = !value || HS_REGEX.test(value);
  const showError = touched && value && !isValid;

  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. 6109.10"
          maxLength={20}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent font-mono text-sm ${
            showError ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
        {value && isValid && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <p className={`text-xs ${showError ? 'text-red-500' : 'text-gray-400'}`}>
          {showError
            ? 'Invalid format — use e.g. 6109.10 or 6109.10.90'
            : 'Harmonized System tariff code — required for international shipments'}
        </p>
        <a
          href="https://www.trade.gov/harmonized-system-hs-codes"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#CBB57B] hover:underline whitespace-nowrap ml-4"
        >
          Look up HS Code →
        </a>
      </div>
    </div>
  );
}
