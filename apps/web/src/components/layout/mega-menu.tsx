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

  // Featured = categories with an image and isFeatured flag, up to 2
  const featuredCategories = categories.filter((c) => c.isFeatured && c.image).slice(0, 2);
  const hasFeatured = featuredCategories.length > 0;

  // Max 4 full columns when featured panel is visible, 5 without
  const maxColumns = hasFeatured ? 4 : 5;
  const columnCategories = categories.slice(0, maxColumns);
  const overflowCategories = categories.slice(maxColumns);

  // Total product count across all displayed categories
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
          />

          {/* Mega Menu Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onMouseLeave={onClose}
            className="absolute top-full left-0 right-0 bg-white shadow-2xl z-50 border-t-2 border-[#CBB57B]"
          >
            {/* Decorative gold shimmer line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#CBB57B]/60 to-transparent" />

            <div className="max-w-[1920px] mx-auto px-8 lg:px-16 py-10">
              <div
                className={`grid gap-10 ${hasFeatured ? 'grid-cols-[1fr_280px]' : 'grid-cols-1'}`}
              >
                {/* ── LEFT: Category Columns ── */}
                <div>
                  <div className={`grid ${columnGridClass} gap-8`}>
                    {columnCategories.map((category, colIndex) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: colIndex * 0.055,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        {/* Column heading — links to the parent category */}
                        <Link
                          href={`/products?category=${category.slug}`}
                          onClick={onClose}
                          className="group/hdr flex items-center gap-2.5 pb-3 mb-3 border-b border-gray-100 hover:border-[#CBB57B]/40 transition-colors"
                        >
                          {category.icon && (
                            <span className="text-xl leading-none flex-shrink-0">
                              {category.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold uppercase tracking-widest text-gray-900 group-hover/hdr:text-[#CBB57B] transition-colors">
                              {category.name}
                            </span>
                            {(category._count?.products ?? 0) > 0 && (
                              <span className="text-[11px] text-gray-400 font-normal">
                                {category._count!.products} products
                              </span>
                            )}
                          </div>
                          <svg
                            className="w-3 h-3 text-gray-300 group-hover/hdr:text-[#CBB57B] opacity-0 group-hover/hdr:opacity-100 group-hover/hdr:translate-x-0.5 transition-all flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>

                        {/* Children links */}
                        {category.children && category.children.length > 0 ? (
                          <ul className="space-y-1">
                            {category.children.slice(0, 7).map((child, i) => (
                              <motion.li
                                key={child.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.22,
                                  delay: colIndex * 0.055 + i * 0.025,
                                }}
                              >
                                <Link
                                  href={`/products?category=${child.slug}`}
                                  onClick={onClose}
                                  className="group/link flex items-center gap-2 py-[5px] text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                  {/* Animated gold dash */}
                                  <span className="w-0 group-hover/link:w-3 h-px bg-[#CBB57B] transition-all duration-200 flex-shrink-0" />
                                  {child.icon && (
                                    <span className="text-sm leading-none flex-shrink-0">
                                      {child.icon}
                                    </span>
                                  )}
                                  <span className="group-hover/link:translate-x-0.5 transition-transform leading-snug">
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
                                  className="text-xs font-semibold text-[#CBB57B] hover:text-black transition-colors"
                                >
                                  +{category.children.length - 7} more →
                                </Link>
                              </li>
                            )}
                          </ul>
                        ) : (
                          category.description && (
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                              {category.description}
                            </p>
                          )
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Overflow categories as pill tags */}
                  {overflowCategories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-2"
                    >
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                        More
                      </span>
                      {overflowCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?category=${cat.slug}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 bg-gray-50 hover:bg-[#CBB57B]/10 hover:text-[#CBB57B] rounded-full border border-gray-100 hover:border-[#CBB57B]/30 transition-all"
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}

                  {/* Bottom bar */}
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#CBB57B] hover:text-black transition-colors group/all"
                    >
                      <span>View All Products</span>
                      <svg
                        className="w-4 h-4 group-hover/all:translate-x-1 transition-transform"
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
                      <span className="text-xs text-gray-400">
                        {totalProducts.toLocaleString()} products available
                      </span>
                    )}
                  </div>
                </div>

                {/* ── RIGHT: Featured Panel ── */}
                {hasFeatured && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                      Featured
                    </p>
                    {featuredCategories.map((cat, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.32, delay: 0.12 + i * 0.1 }}
                        className="flex-1"
                      >
                        <Link
                          href={`/products?category=${cat.slug}`}
                          onClick={onClose}
                          className="group/feat block relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                        >
                          <div className="relative aspect-[4/3] bg-gray-100">
                            <Image
                              src={cat.image!}
                              alt={cat.name}
                              fill
                              className="object-cover group-hover/feat:scale-105 transition-transform duration-500"
                            />
                          </div>
                          {/* Dark gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                          {/* Gold border on hover */}
                          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover/feat:border-[#CBB57B]/70 transition-colors duration-300" />
                          {/* Text */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            {cat.icon && <span className="text-2xl block mb-1">{cat.icon}</span>}
                            <h4 className="text-white font-bold text-sm group-hover/feat:text-[#CBB57B] transition-colors leading-snug">
                              {cat.name}
                            </h4>
                            {(cat._count?.products ?? 0) > 0 && (
                              <p className="text-white/60 text-xs mt-0.5">
                                {cat._count!.products} products
                              </p>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}

                    {/* Shop Now CTA */}
                    <Link
                      href="/products?featured=true"
                      onClick={onClose}
                      className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#CBB57B]/40 text-xs font-semibold text-[#CBB57B] hover:bg-[#CBB57B] hover:text-black transition-all duration-200"
                    >
                      Shop Featured
                      <svg
                        className="w-3.5 h-3.5"
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
