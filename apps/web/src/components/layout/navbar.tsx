'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@nextpik/ui';
import { useTranslations } from 'next-intl';
import { SearchBar } from '@/components/search/search-bar';
import { SearchModal } from '@/components/search/search-modal';
import { MegaMenu, shopMegaMenuData, shopMegaMenuFeatured, collectionsMegaMenuData } from './mega-menu';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const { total: wishlistCount } = useWishlist();
  const { items: cartItems } = useCart();
  const cartCount = cartItems?.length || 0;
  const t = useTranslations('common');

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  const navigationLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.shop'), href: '/products', hasMegaMenu: true, megaMenuType: 'shop' },
    { label: t('nav.stores'), href: '/stores' },
    { label: t('nav.hotDeals'), href: '/hot-deals' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn('sticky top-12 left-0 right-0 z-40', className)}
      >
        {/* Main Navbar with Glass Morphism */}
        <div
          className={cn(
            'relative h-20 transition-all duration-300',
            isScrolled
              ? 'bg-white shadow-lg border-b border-gray-200'
              : 'bg-white border-b border-gray-100'
          )}
        >
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-transparent pointer-events-none" />

          <div className="relative h-full max-w-[1920px] mx-auto px-8 md:px-12 lg:px-16">
            {/* Three-section grid layout */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-8 h-full">

              {/* LEFT: Logo */}
              <Link href="/" className="flex items-center group relative z-10 flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <Image
                    src="/logo-dark.svg"
                    alt="NextPik"
                    width={160}
                    height={55}
                    priority
                    className="h-auto w-auto max-h-14 sm:max-h-14 md:max-h-16 lg:max-h-14 transition-all duration-500 group-hover:brightness-110"
                  />
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-[#CBB57B] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                </motion.div>
              </Link>

              {/* CENTER: Navigation Links */}
              <div className="hidden lg:flex items-center justify-center">
                <nav className="flex items-center gap-1">
                  {navigationLinks.map((link, index) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                      className="relative"
                      onMouseEnter={() => link.hasMegaMenu && setActiveMegaMenu(link.megaMenuType || null)}
                      onMouseLeave={() => setActiveMegaMenu(null)}
                    >
                      <Link
                        href={link.href}
                        className="group relative px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#CBB57B] transition-all duration-300"
                      >
                        <span className="relative z-10 tracking-wide whitespace-nowrap">{link.label}</span>

                        {/* Hover background */}
                        <span className="absolute inset-0 bg-gradient-to-r from-[#CBB57B]/5 via-[#CBB57B]/10 to-[#CBB57B]/5 scale-0 group-hover:scale-100 rounded-xl transition-transform duration-300" />

                        {/* Underline animation */}
                        <motion.span
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 h-px bg-[#CBB57B]"
                          initial={{ width: 0 }}
                          whileHover={{ width: '70%' }}
                          transition={{ duration: 0.3 }}
                        />

                        {/* Dot for mega menu */}
                        {link.hasMegaMenu && (
                          <motion.span
                            className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-[#CBB57B]"
                            animate={{
                              scale: activeMegaMenu === link.megaMenuType ? [1, 1.5, 1] : 1,
                            }}
                            transition={{ duration: 0.5, repeat: activeMegaMenu === link.megaMenuType ? Infinity : 0 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>

              {/* RIGHT: Search Bar & Icons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center justify-end gap-3 flex-shrink-0"
              >
                {/* Desktop Search Bar */}
                <div className="hidden lg:block w-full max-w-md">
                  <SearchBar />
                </div>

                {/* Mobile Search Icon */}
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="lg:hidden p-2 text-gray-700 hover:text-[#CBB57B] transition-colors"
                  aria-label="Search"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Wishlist Icon */}
                <Link href="/wishlist">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 text-gray-700 hover:text-[#CBB57B] transition-colors"
                    aria-label="Wishlist"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <AnimatePresence mode="wait">
                      {wishlistCount > 0 && (
                        <motion.span
                          key={wishlistCount}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-[#CBB57B] text-black text-xs font-bold rounded-full flex items-center justify-center shadow-md"
                        >
                          {wishlistCount > 9 ? '9+' : wishlistCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </Link>

                {/* Cart Icon */}
                <Link href="/cart">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 text-gray-700 hover:text-[#CBB57B] transition-colors"
                    aria-label="Shopping Cart"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <AnimatePresence mode="wait">
                      {cartCount > 0 && (
                        <motion.span
                          key={cartCount}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-[#CBB57B] text-black text-xs font-bold rounded-full flex items-center justify-center shadow-md"
                        >
                          {cartCount > 9 ? '9+' : cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative p-2 group flex-shrink-0 ml-auto"
                aria-label="Menu"
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <motion.span
                    animate={{
                      rotate: isMobileMenuOpen ? 45 : 0,
                      y: isMobileMenuOpen ? 8 : 0,
                    }}
                    className="w-full h-0.5 bg-black group-hover:bg-[#CBB57B] transition-colors"
                  />
                  <motion.span
                    animate={{
                      opacity: isMobileMenuOpen ? 0 : 1,
                    }}
                    className="w-full h-0.5 bg-black group-hover:bg-[#CBB57B] transition-colors"
                  />
                  <motion.span
                    animate={{
                      rotate: isMobileMenuOpen ? -45 : 0,
                      y: isMobileMenuOpen ? -8 : 0,
                    }}
                    className="w-full h-0.5 bg-black group-hover:bg-[#CBB57B] transition-colors"
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mega Menus */}
        <div onMouseEnter={() => { }} onMouseLeave={() => setActiveMegaMenu(null)}>
          <MegaMenu
            isOpen={activeMegaMenu === 'shop'}
            sections={shopMegaMenuData}
            featured={shopMegaMenuFeatured}
            onClose={() => setActiveMegaMenu(null)}
          />
          <MegaMenu
            isOpen={activeMegaMenu === 'collections'}
            sections={collectionsMegaMenuData}
            onClose={() => setActiveMegaMenu(null)}
          />
        </div>

        {/* Mobile Menu - Slide Down */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50 overflow-hidden"
              >
                <div className="max-w-[1920px] mx-auto px-8 md:px-12 py-6 space-y-6">
                  {/* Mobile Links */}
                  <nav className="space-y-2">
                    {navigationLinks.map((link, index) => (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="group flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-gray-50 transition-all"
                        >
                          <span className="text-base font-medium text-gray-900 group-hover:text-[#CBB57B]">
                            {link.label}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-[#CBB57B] group-hover:translate-x-0.5 transition-all"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Search Modal */}
        <SearchModal isOpen={isMobileSearchOpen} onClose={() => setIsMobileSearchOpen(false)} />
      </motion.nav>
    </>
  );
}
