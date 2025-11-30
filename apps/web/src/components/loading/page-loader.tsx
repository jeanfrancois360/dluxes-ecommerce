'use client';

import { motion } from 'framer-motion';

export function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Luxury spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 border-[3px] border-neutral-200 rounded-full" />
          {/* Inner animated ring */}
          <motion.div
            className="absolute inset-0 border-[3px] border-[#CBB57B] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.8,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-2 h-2 bg-[#CBB57B] rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            />
          </div>
        </div>

        {/* Loading text */}
        <motion.p
          className="text-sm font-medium text-neutral-600 tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading...
        </motion.p>
      </div>
    </motion.div>
  );
}

export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-[2px] border-neutral-200 rounded-full" />
        <motion.div
          className="absolute inset-0 border-[2px] border-[#CBB57B] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      </div>
    </div>
  );
}
