'use client';

import { useState, useEffect } from 'react';
import { toGrams, fromGrams, type WeightUnit } from '@/lib/utils/weight';

interface WeightInputProps {
  /** Current value in grams (the canonical storage unit) */
  valueGrams: number | null | undefined;
  /** Called when the user changes value or unit. Emits grams. */
  onChange: (grams: number | null) => void;
  /** Default unit shown to the user. Stored in localStorage between sessions. */
  defaultUnit?: WeightUnit;
  /** Disabled state */
  disabled?: boolean;
  /** Field label */
  label?: string;
  /** Required indicator */
  required?: boolean;
  /** Helper text below the input */
  helperText?: string;
  /** Additional className for the wrapper div */
  className?: string;
}

const STORAGE_KEY = 'nextpik:weight-unit-preference';

export function WeightInput({
  valueGrams,
  onChange,
  defaultUnit = 'kg',
  disabled = false,
  label = 'Weight',
  required = false,
  helperText,
  className = '',
}: WeightInputProps) {
  const [unit, setUnit] = useState<WeightUnit>(defaultUnit);
  const [displayValue, setDisplayValue] = useState<string>('');

  // Load user's preferred unit from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY) as WeightUnit | null;
    if (saved && ['g', 'kg', 'lb', 'oz'].includes(saved)) {
      setUnit(saved);
    }
  }, []);

  // Sync displayValue when valueGrams or unit changes externally
  useEffect(() => {
    if (valueGrams == null) {
      setDisplayValue('');
      return;
    }
    const inUnit = fromGrams(valueGrams, unit);
    const formatted = unit === 'g' ? String(Math.round(inUnit)) : inUnit.toFixed(2);
    setDisplayValue(formatted);
  }, [valueGrams, unit]);

  const handleValueChange = (raw: string) => {
    setDisplayValue(raw);
    if (raw === '') {
      onChange(null);
      return;
    }
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      onChange(null);
      return;
    }
    onChange(toGrams(parsed, unit));
  };

  const handleUnitChange = (newUnit: WeightUnit) => {
    setUnit(newUnit);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newUnit);
    }
    // valueGrams is unchanged; the useEffect above re-renders displayValue in the new unit
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          min="0"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={disabled}
          placeholder="0"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent disabled:opacity-50"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value as WeightUnit)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent disabled:opacity-50 bg-white"
        >
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="lb">lb</option>
          <option value="oz">oz</option>
        </select>
      </div>
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
