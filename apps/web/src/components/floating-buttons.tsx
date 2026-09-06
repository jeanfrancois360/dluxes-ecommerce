'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';

export function FloatingButtons() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [hotDealsVisible, setHotDealsVisible] = useState(true);
  const [addProductVisible, setAddProductVisible] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canAddProduct = isAuthenticated && !isLoading && (user?.role === 'SELLER' || isAdmin);
  const addProductHref = isAdmin ? '/admin/products/new' : '/seller/products/new';

  return (
    <>
      {/* Hot Deals — bottom-left, visible to all */}
      <AnimatePresence>
        {hotDealsVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed left-6 bottom-6 z-50 flex items-center gap-1"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20 pointer-events-none" />
              <Link
                href="/hot-deals"
                className="relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg"
                aria-label="View hot deals"
              >
                <Flame className="w-4 h-4 shrink-0" />
                <span>Hot Deals</span>
              </Link>
            </motion.div>
            <button
              onClick={() => setHotDealsVisible(false)}
              className="w-5 h-5 rounded-full bg-neutral-800/70 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Dismiss hot deals button"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product — bottom-right above WhatsApp, sellers & admins only */}
      <AnimatePresence>
        {canAddProduct && addProductVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="fixed right-6 bottom-[5.5rem] z-50 flex items-center gap-1"
          >
            <button
              onClick={() => setAddProductVisible(false)}
              className="w-5 h-5 rounded-full bg-neutral-800/70 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Dismiss add product button"
            >
              <X className="w-3 h-3" />
            </button>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-neutral-900 animate-ping opacity-20 pointer-events-none" />
              <Link
                href={addProductHref}
                className="relative flex items-center gap-2 bg-neutral-900 hover:bg-black text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg"
                aria-label="Add a new product"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Product</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
