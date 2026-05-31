'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}) => {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const completeFiredRef = React.useRef(false);

  React.useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  // Reset the "already fired" guard whenever value loses completeness
  React.useEffect(() => {
    const filled = value.split('').filter((c) => c !== '').length;
    if (filled < length) {
      completeFiredRef.current = false;
    }
  }, [value, length]);

  const handleChange = (index: number, digitValue: string) => {
    // Only allow single digit
    if (digitValue.length > 1) {
      return;
    }

    // Only allow numbers
    if (digitValue && !/^\d$/.test(digitValue)) {
      return;
    }

    const newValue = value.split('');
    newValue[index] = digitValue;
    const newValueString = newValue.join('');

    onChange(newValueString);

    // Auto-advance to next input
    if (digitValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Fire onComplete when the last digit is entered
    if (
      onComplete &&
      digitValue &&
      newValueString.length === length &&
      newValueString.split('').every((c) => /\d/.test(c)) &&
      !completeFiredRef.current
    ) {
      completeFiredRef.current = true;
      onComplete(newValueString);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);

    if (!pastedData) return;

    onChange(pastedData);
    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Fire onComplete if paste fills all boxes
    if (onComplete && pastedData.length === length && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete(pastedData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, index) => (
          <motion.input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-14 h-16 text-center text-2xl font-semibold',
              'bg-white border-2 border-neutral-200 rounded-lg',
              'transition-all duration-300',

              // Focus styles
              'focus:outline-none focus:border-gold focus:ring-0 focus:scale-105',

              // Hover styles
              'hover:border-neutral-300',

              // Error styles
              error && 'border-error-DEFAULT focus:border-error-DEFAULT',

              // Filled styles
              value[index] && 'border-gold bg-accent-50',

              // Disabled styles
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-error-DEFAULT text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
