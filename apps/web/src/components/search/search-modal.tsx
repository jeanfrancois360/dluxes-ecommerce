'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './search-bar';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative h-full bg-white"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
              <div className="flex items-center gap-4">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close search"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Search Bar */}
                <div className="flex-1">
                  <SearchBar
                    autoFocus
                    onSearch={onClose}
                    placeholder="Search..."
                  />
                </div>
              </div>
            </div>

            {/* Search Tips */}
            <div className="px-4 py-6">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#CBB57B]/5 to-[#CBB57B]/10 rounded-xl"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-[#CBB57B]/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#CBB57B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Quick Search Tips</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Use specific product names or brands</li>
                      <li>• Try category names like "bags" or "watches"</li>
                      <li>• Search by price range or materials</li>
                    </ul>
                  </div>
                </motion.div>

                {/* Popular Searches Hint */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-xs text-gray-500"
                >
                  Start typing to see suggestions and autocomplete results
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
