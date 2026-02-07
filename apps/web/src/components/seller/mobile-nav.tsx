'use client';

import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileNav({ isOpen, onToggle }: MobileNavProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-30 flex items-center px-4">
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-neutral-900" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-900" />
          )}
        </motion.div>
      </button>

      <div className="ml-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-lg font-semibold text-black">Seller Portal</span>
      </div>
    </div>
  );
}
