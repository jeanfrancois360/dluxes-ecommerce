'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { type Category } from '@/lib/api/categories';

export interface MegaMenuProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
}

export function MegaMenu({ isOpen, categories, onClose }: MegaMenuProps) {
  if (!categories || categories.length === 0) return null;

  const columnCategories = categories.slice(0, 4);
  const overflowCategories = categories.slice(4);
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
              <div className="grid grid-cols-[1fr_220px] gap-10">
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
                              // Plain <img> with eager loading — faster than next/image for tiny thumbnails
                              <img
                                src={category.image}
                                alt={category.name}
                                width={28}
                                height={28}
                                loading="eager"
                                decoding="async"
                                className="w-7 h-7 rounded object-cover flex-shrink-0 bg-gray-100"
                              />
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

                {/* ── Static Ad Panel ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="border-l border-gray-100 pl-8 flex flex-col gap-3"
                >
                  {/* Main ad card */}
                  <Link
                    href="/products"
                    onClick={onClose}
                    className="group/ad block relative overflow-hidden rounded-2xl flex-1"
                    style={{ minHeight: '220px' }}
                  >
                    {/* Background gradient — instant, no network request */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(145deg, #0a0a0a 0%, #1a1410 40%, #2d2010 70%, #0a0a0a 100%)',
                      }}
                    />

                    {/* Decorative rings */}
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-[#CBB57B]/10" />
                    <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full border border-[#CBB57B]/15" />
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full border border-[#CBB57B]/8" />

                    {/* Gold shimmer line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-px"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, #CBB57B 40%, #e8d49a 60%, transparent)',
                      }}
                    />

                    {/* Content */}
                    <div className="relative p-5 h-full flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#CBB57B]/60 mb-2">
                          New Collection
                        </p>
                        <h3 className="text-base font-bold text-white leading-snug mb-1">
                          Luxury Picks
                          <br />
                          <span
                            className="text-transparent bg-clip-text"
                            style={{
                              backgroundImage: 'linear-gradient(90deg, #CBB57B, #e8d49a, #CBB57B)',
                            }}
                          >
                            2026
                          </span>
                        </h3>
                        <p className="text-[11px] text-white/40 leading-relaxed">
                          Curated selection of premium products across all categories.
                        </p>
                      </div>

                      <div className="mt-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black group-hover/ad:gap-2.5 transition-all duration-200"
                          style={{
                            background:
                              'linear-gradient(135deg, #CBB57B 0%, #e8d49a 50%, #CBB57B 100%)',
                          }}
                        >
                          Shop Now
                          <svg
                            className="w-3 h-3 group-hover/ad:translate-x-0.5 transition-transform duration-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover/ad:opacity-100 transition-opacity duration-300 rounded-2xl ring-1 ring-inset ring-[#CBB57B]/30" />
                  </Link>

                  {/* Small promo strip */}
                  <Link
                    href="/hot-deals"
                    onClick={onClose}
                    className="group/strip flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-[#CBB57B]/5 border border-gray-100 hover:border-[#CBB57B]/30 transition-all duration-150"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                    <span className="text-[11px] font-semibold text-gray-700 group-hover/strip:text-black transition-colors">
                      Hot Deals
                    </span>
                    <span className="ml-auto text-[10px] text-[#CBB57B] font-bold">Live →</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
