'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RateLimitMessageProps {
  /**
   * Error message from server (e.g., "Too many failed login attempts. Please try again in 15 minutes.")
   */
  message: string;
  /**
   * Callback when countdown completes
   */
  onComplete?: () => void;
}

export function RateLimitMessage({ message, onComplete }: RateLimitMessageProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Extract minutes from message
    const match = message.match(/(\d+)\s+minute/i);
    if (match) {
      const minutes = parseInt(match[1], 10);
      setTimeLeft(minutes * 60); // Convert to seconds
    }
  }, [message]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) {
        onComplete?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft !== null && timeLeft > 0
    ? ((timeLeft / (parseInt(message.match(/(\d+)\s+minute/i)?.[1] || '15', 10) * 60)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-error-light border-2 border-error-DEFAULT rounded-xl"
    >
      {/* Icon and Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-error-DEFAULT rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-error-dark mb-1">
            Too Many Attempts
          </h3>
          <p className="text-sm text-error-dark/80">
            For security, your account has been temporarily locked
          </p>
        </div>
      </div>

      {/* Countdown Timer */}
      {timeLeft !== null && timeLeft > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <div className="bg-white rounded-lg p-4 border border-error-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600">
                Time remaining:
              </span>
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-error-dark tabular-nums"
              >
                {formatTime(timeLeft)}
              </motion.span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${100 - progress}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-error-DEFAULT to-error-dark"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      <div className="bg-white border border-error-200 rounded-lg p-4">
        <p className="text-xs font-medium text-neutral-900 mb-2">
          What can you do?
        </p>
        <ul className="space-y-1.5 text-xs text-neutral-600">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-error-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Wait for the countdown to complete</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-error-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Make sure you're using the correct password</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-error-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Use "Forgot Password" if you can't remember</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-error-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Contact support if you need immediate assistance</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
