'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTopBarCategories } from '@/hooks/use-categories';

export function CategoryBar() {
  const pathname = usePathname();
  const { categories, isLoading } = useTopBarCategories();

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-10 px-6 bg-neutral-100 rounded-full animate-pulse"
                style={{ width: `${Math.random() * 50 + 80}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
          {/* All Products - Always first */}
          <Link href="/products">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200',
                'cursor-pointer select-none',
                pathname === '/products' || pathname?.startsWith('/products')
                  ? 'bg-gradient-to-r from-gold to-accent-700 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              All Products
            </motion.div>
          </Link>

          {/* Dynamic Categories */}
          {categories.map((category) => {
            const isActive = pathname === `/products?category=${category.slug}`;

            return (
              <Link key={category.id} href={`/products?category=${category.slug}`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200',
                    'cursor-pointer select-none flex items-center gap-2',
                    isActive
                      ? category.isFeatured
                        ? 'bg-gradient-to-r from-gold to-accent-700 text-white shadow-md'
                        : 'bg-black text-white shadow-md'
                      : category.isFeatured
                      ? 'bg-gold/10 text-gold hover:bg-gold/20'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  {category.icon && (
                    <span className="text-base">{category.icon}</span>
                  )}
                  {category.name}
                  {category._count && category._count.products > 0 && (
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    )}>
                      {category._count.products}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
