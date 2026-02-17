'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { type Category } from '@/lib/api/categories';

export interface MegaMenuProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
}

export function MegaMenu({ isOpen, categories, onClose }: MegaMenuProps) {
  if (!categories || categories.length === 0) return null;

  // Only explicitly featured categories with an image appear in the panel
  const featuredCategories = categories.filter((c) => c.isFeatured && c.image).slice(0, 2);
  const hasFeatured = featuredCategories.length > 0;

  const maxColumns = hasFeatured ? 4 : 5;
  const columnCategories = categories.slice(0, maxColumns);
  const overflowCategories = categories.slice(maxColumns);

  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);

  const columnGridClass =
    columnCategories.length <= 2
      ? 'grid-cols-2'
      : columnCategories.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-4';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onMouseLeave={onClose}
            className="absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-[1920px] mx-auto px-8 lg:px-16 py-6">
              <div
                className={`grid gap-10 ${hasFeatured ? 'grid-cols-[1fr_180px]' : 'grid-cols-1'}`}
              >
                {/* ── Category Columns ── */}
                <div>
                  <div className={`grid ${columnGridClass} gap-x-10 gap-y-1`}>
                    {columnCategories.map((category, colIndex) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: colIndex * 0.05 }}
                      >
                        {/* Heading */}
                        <Link
                          href={`/products?category=${category.slug}`}
                          onClick={onClose}
                          className="group/hdr flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {category.image && (
                              <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                  src={category.image}
                                  alt={category.name}
                                  width={28}
                                  height={28}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-black group-hover/hdr:text-[#CBB57B] transition-colors duration-150">
                                {category.name}
                              </span>
                              {(category._count?.products ?? 0) > 0 && (
                                <span className="text-[10px] text-gray-400 tabular-nums">
                                  {category._count!.products} items
                                </span>
                              )}
                            </div>
                          </div>
                          <svg
                            className="w-3 h-3 text-gray-300 opacity-0 group-hover/hdr:opacity-100 group-hover/hdr:text-black transition-all duration-150 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>

                        {/* Children */}
                        {category.children && category.children.length > 0 ? (
                          <ul className="space-y-0.5">
                            {category.children.slice(0, 7).map((child, i) => (
                              <motion.li
                                key={child.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.18, delay: colIndex * 0.05 + i * 0.018 }}
                              >
                                <Link
                                  href={`/products?category=${child.slug}`}
                                  onClick={onClose}
                                  className="group/link flex items-center gap-2 py-[3px] text-[13px] text-gray-400 hover:text-black transition-colors duration-150"
                                >
                                  <span className="w-0 group-hover/link:w-2.5 h-px bg-[#CBB57B] transition-all duration-200 flex-shrink-0" />
                                  <span className="group-hover/link:translate-x-0.5 transition-transform duration-150">
                                    {child.name}
                                  </span>
                                </Link>
                              </motion.li>
                            ))}
                            {category.children.length > 7 && (
                              <li className="pt-1">
                                <Link
                                  href={`/products?category=${category.slug}`}
                                  onClick={onClose}
                                  className="text-[11px] text-gray-400 hover:text-black transition-colors duration-150"
                                >
                                  +{category.children.length - 7} more
                                </Link>
                              </li>
                            )}
                          </ul>
                        ) : (
                          category.description && (
                            <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-3">
                              {category.description}
                            </p>
                          )
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Overflow */}
                  {overflowCategories.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-gray-300 uppercase tracking-widest mr-1">
                        More
                      </span>
                      {overflowCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?category=${cat.slug}`}
                          onClick={onClose}
                          className="px-3 py-1 text-[11px] text-gray-500 hover:text-black border border-gray-200 hover:border-black rounded-full transition-all duration-150"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="group/all inline-flex items-center gap-1.5 text-sm font-medium text-black hover:text-[#CBB57B] transition-colors duration-150"
                    >
                      View all products
                      <svg
                        className="w-3.5 h-3.5 group-hover/all:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                    {totalProducts > 0 && (
                      <span className="text-[11px] text-gray-300 tabular-nums">
                        {totalProducts.toLocaleString()} products
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Featured Images ── */}
                {hasFeatured && (
                  <div className="flex flex-col gap-2 border-l border-gray-100 pl-8">
                    {featuredCategories.map((cat, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.28, delay: 0.08 + i * 0.08 }}
                        className="flex-1"
                      >
                        <Link
                          href={`/products?category=${cat.slug}`}
                          onClick={onClose}
                          className="group/feat block relative overflow-hidden rounded-xl"
                        >
                          <div className="relative aspect-[4/5] bg-gray-100">
                            <Image
                              src={cat.image!}
                              alt={cat.name}
                              fill
                              className="object-cover group-hover/feat:scale-[1.04] transition-transform duration-500 ease-out"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          </div>
                          {/* Label */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50 mb-0.5">
                              Shop now
                            </p>
                            <h4 className="text-sm font-semibold text-white leading-snug">
                              {cat.name}
                            </h4>
                          </div>
                          {/* Border on hover */}
                          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent group-hover/feat:ring-black/20 transition-all duration-300" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
