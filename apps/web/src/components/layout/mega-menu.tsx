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
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Mega Menu Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.97 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top center' }}
            onMouseLeave={onClose}
            className="absolute top-full left-0 right-0 z-50 overflow-hidden"
          >
            {/* Glass panel */}
            <div className="relative bg-neutral-950/[0.97] backdrop-blur-2xl border-t border-white/[0.06] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.9)]">
              {/* Gold top shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CBB57B] to-transparent opacity-80" />

              {/* Subtle inner glow at top */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

              {/* Noise grain overlay for depth */}
              <div
                className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative max-w-[1920px] mx-auto px-8 lg:px-16 py-10">
                <div
                  className={`grid gap-10 ${hasFeatured ? 'grid-cols-[1fr_260px]' : 'grid-cols-1'}`}
                >
                  {/* ── LEFT: Category Columns ── */}
                  <div>
                    <div className={`grid ${columnGridClass} gap-x-10 gap-y-2`}>
                      {columnCategories.map((category, colIndex) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.32,
                            delay: colIndex * 0.06,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          {/* Column heading */}
                          <Link
                            href={`/products?category=${category.slug}`}
                            onClick={onClose}
                            className="group/hdr flex items-center gap-2.5 pb-3 mb-3 border-b border-white/10 hover:border-[#CBB57B]/40 transition-colors duration-200"
                          >
                            {category.icon && (
                              <span className="text-base leading-none flex-shrink-0 opacity-70 group-hover/hdr:opacity-100 transition-opacity">
                                {category.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 group-hover/hdr:text-[#CBB57B] transition-colors duration-200">
                                {category.name}
                              </span>
                              {(category._count?.products ?? 0) > 0 && (
                                <span className="text-[10px] text-white/30 font-normal tabular-nums">
                                  {category._count!.products} items
                                </span>
                              )}
                            </div>
                            <svg
                              className="w-2.5 h-2.5 text-white/20 group-hover/hdr:text-[#CBB57B] opacity-0 group-hover/hdr:opacity-100 group-hover/hdr:translate-x-0.5 transition-all duration-200 flex-shrink-0"
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
                            <ul className="space-y-0.5">
                              {category.children.slice(0, 7).map((child, i) => (
                                <motion.li
                                  key={child.id}
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: colIndex * 0.06 + i * 0.02,
                                  }}
                                >
                                  <Link
                                    href={`/products?category=${child.slug}`}
                                    onClick={onClose}
                                    className="group/link flex items-center gap-2 py-[5px] text-sm text-white/45 hover:text-white transition-colors duration-150"
                                  >
                                    {/* Gold dash */}
                                    <span className="w-0 group-hover/link:w-3 h-px bg-[#CBB57B] transition-all duration-200 ease-out flex-shrink-0" />
                                    {child.icon && (
                                      <span className="text-xs leading-none flex-shrink-0 opacity-60">
                                        {child.icon}
                                      </span>
                                    )}
                                    <span className="group-hover/link:translate-x-0.5 transition-transform duration-150 leading-snug text-[13px]">
                                      {child.name}
                                    </span>
                                  </Link>
                                </motion.li>
                              ))}
                              {category.children.length > 7 && (
                                <li className="pt-1.5">
                                  <Link
                                    href={`/products?category=${category.slug}`}
                                    onClick={onClose}
                                    className="text-[11px] font-medium text-[#CBB57B]/70 hover:text-[#CBB57B] transition-colors duration-150"
                                  >
                                    +{category.children.length - 7} more →
                                  </Link>
                                </li>
                              )}
                            </ul>
                          ) : (
                            category.description && (
                              <p className="text-[12px] text-white/30 leading-relaxed line-clamp-3">
                                {category.description}
                              </p>
                            )
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Overflow pills */}
                    {overflowCategories.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.28 }}
                        className="mt-7 pt-5 border-t border-white/[0.07] flex flex-wrap items-center gap-2"
                      >
                        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mr-1">
                          More
                        </span>
                        {overflowCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/products?category=${cat.slug}`}
                            onClick={onClose}
                            className="group/pill inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-white/50 bg-white/[0.05] hover:bg-[#CBB57B]/15 hover:text-[#CBB57B] rounded-full border border-white/[0.08] hover:border-[#CBB57B]/30 transition-all duration-200"
                          >
                            {cat.icon && <span className="opacity-70">{cat.icon}</span>}
                            {cat.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}

                    {/* Bottom bar */}
                    <div className="mt-7 pt-5 border-t border-white/[0.07] flex items-center justify-between">
                      <Link
                        href="/products"
                        onClick={onClose}
                        className="group/all inline-flex items-center gap-2 text-sm font-semibold text-[#CBB57B] hover:text-white transition-colors duration-200"
                      >
                        <span>View All Products</span>
                        <svg
                          className="w-4 h-4 group-hover/all:translate-x-1 transition-transform duration-200"
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
                        <span className="text-[11px] text-white/25 tabular-nums">
                          {totalProducts.toLocaleString()} products
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT: Featured Panel ── */}
                  {hasFeatured && (
                    <div className="flex flex-col gap-4 pl-8 border-l border-white/[0.07]">
                      <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.15em] pb-2.5 border-b border-white/[0.07]">
                        Featured
                      </p>
                      {featuredCategories.map((cat, i) => (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.1 + i * 0.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex-1"
                        >
                          <Link
                            href={`/products?category=${cat.slug}`}
                            onClick={onClose}
                            className="group/feat block relative rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_8px_32px_rgba(203,181,123,0.2)] transition-all duration-300"
                          >
                            <div className="relative aspect-[3/4] bg-neutral-900">
                              <Image
                                src={cat.image!}
                                alt={cat.name}
                                fill
                                className="object-cover group-hover/feat:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover/feat:opacity-100"
                              />
                            </div>
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {/* Gold border on hover */}
                            <div className="absolute inset-0 rounded-2xl border border-transparent group-hover/feat:border-[#CBB57B]/60 transition-colors duration-300" />
                            {/* Corner accent */}
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover/feat:opacity-100 transition-opacity duration-300">
                              <svg
                                className="w-3 h-3 text-[#CBB57B]"
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
                            </div>
                            {/* Text */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              {cat.icon && (
                                <span className="text-xl block mb-1.5 opacity-90">{cat.icon}</span>
                              )}
                              <h4 className="text-white font-bold text-sm group-hover/feat:text-[#CBB57B] transition-colors duration-200 leading-snug">
                                {cat.name}
                              </h4>
                              {(cat._count?.products ?? 0) > 0 && (
                                <p className="text-white/50 text-[11px] mt-0.5 tabular-nums">
                                  {cat._count!.products} products
                                </p>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      ))}

                      {/* Shop Featured CTA */}
                      <Link
                        href="/products?featured=true"
                        onClick={onClose}
                        className="group/cta mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-[#CBB57B] border border-white/10 hover:border-[#CBB57B] text-[11px] font-semibold text-white/60 hover:text-black transition-all duration-250"
                      >
                        Shop Featured
                        <svg
                          className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform duration-200"
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
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom edge glow */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
