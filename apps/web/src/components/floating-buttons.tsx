'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function FloatingButtons() {
  const { user } = useAuth();
  const [hotDealsVisible, setHotDealsVisible] = useState(true);
  const [addProductVisible, setAddProductVisible] = useState(true);

  const isSeller =
    user?.role === 'SELLER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <>
      {/* Hot Deals — bottom-left, visible to all */}
      {hotDealsVisible && (
        <div className="fixed left-6 bottom-6 z-50 flex items-center gap-1">
          <Link
            href="/hot-deals"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            aria-label="View hot deals"
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span>Hot Deals</span>
          </Link>
          <button
            onClick={() => setHotDealsVisible(false)}
            className="w-5 h-5 rounded-full bg-neutral-800/70 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Dismiss hot deals button"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Add Product — bottom-right above WhatsApp, sellers & admins only */}
      {isSeller && addProductVisible && (
        <div className="fixed right-6 bottom-[7rem] z-50 flex items-center gap-1">
          <button
            onClick={() => setAddProductVisible(false)}
            className="w-5 h-5 rounded-full bg-neutral-800/70 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Dismiss add product button"
          >
            <X className="w-3 h-3" />
          </button>
          <Link
            href="/seller/products/new"
            className="flex items-center gap-2 bg-neutral-900 hover:bg-black text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            aria-label="Add a new product"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Product</span>
          </Link>
        </div>
      )}
    </>
  );
}
