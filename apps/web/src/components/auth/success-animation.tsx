'use client';

import { motion } from 'framer-motion';

interface SuccessAnimationProps {
  title: string;
  message: string;
  countdown?: number;
  showCheckmark?: boolean;
}

export function SuccessAnimation({
  title,
  message,
  countdown,
  showCheckmark = true,
}: SuccessAnimationProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-6"
    >
      {/* Success Icon with Animation */}
      {showCheckmark && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="inline-flex items-center justify-center"
        >
          <div className="relative">
            {/* Pulsing background */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'loop',
              }}
              className="absolute inset-0 bg-success-DEFAULT rounded-full"
            />

            {/* Main circle */}
            <div className="relative w-20 h-20 bg-success-light rounded-full flex items-center justify-center">
              {/* Checkmark with draw animation */}
              <motion.svg
                className="w-10 h-10 text-success-DEFAULT"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </div>
          </div>
        </motion.div>
      )}

      {/* Title */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h3 className="text-2xl font-bold text-black">{title}</h3>
        <p className="text-neutral-600 text-base">{message}</p>
      </motion.div>

      {/* Countdown Timer */}
      {countdown !== undefined && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-sm text-neutral-500"
        >
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Redirecting in {countdown} seconds...</span>
        </motion.div>
      )}
    </motion.div>
  );
}

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SuccessCheckmark({ size = 'md', className = '' }: SuccessCheckmarkProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        className={`${sizeClasses[size]} text-success-DEFAULT`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
      </svg>
    </motion.div>
  );
}
