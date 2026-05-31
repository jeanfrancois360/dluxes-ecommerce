'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 } as Record<string, unknown>,
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay },
});

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const t = useTranslations('common');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const linkColumns = [
    {
      heading: t('footer.shop'),
      links: [
        { label: t('footer.allProducts'), href: '/products' },
        { label: t('footer.allStores'), href: '/stores' },
        { label: t('footer.searchProducts'), href: '/products' },
        { label: t('footer.wishlist'), href: '/wishlist' },
        { label: t('footer.becomeSeller'), href: '/become-seller' },
      ],
    },
    {
      heading: t('footer.myAccount'),
      links: [
        { label: t('footer.myAccount'), href: '/account' },
        { label: t('footer.myOrders'), href: '/account/orders' },
        { label: t('footer.myReviews'), href: '/account/reviews' },
        { label: t('footer.following'), href: '/account/following' },
        { label: t('footer.notifications'), href: '/account/notifications' },
      ],
    },
    {
      heading: t('footer.customerService'),
      links: [
        { label: t('footer.contactUs'), href: '/contact' },
        { label: t('footer.trackOrder'), href: '/track-order' },
        { label: t('footer.helpCenter'), href: '/help' },
        { label: t('footer.returns'), href: '/account/returns' },
        { label: t('footer.inquiries'), href: '/account/inquiries' },
      ],
    },
    {
      heading: t('footer.company'),
      links: [
        { label: t('footer.sellerPortal'), href: '/seller/products' },
        { label: t('footer.advertisementPlans'), href: '/seller/advertisement-plans' },
        { label: t('nav.blog'), href: '/blog' },
        { label: 'Affiliate', href: '/affiliate' },
      ],
    },
    {
      heading: t('footer.legal'),
      links: [
        { label: t('footer.privacyPolicy'), href: '/privacy' },
        { label: t('footer.termsOfService'), href: '/terms' },
        { label: t('footer.sellerAgreement'), href: '/seller-agreement' },
        { label: t('footer.cookiePolicy'), href: '/cookie-policy' },
      ],
    },
  ];

  const trustBadges = [
    {
      title: t('footer.securePayment'),
      subtitle: t('footer.sslEncrypted'),
      icon: (
        <svg
          className="w-5 h-5 text-[#CBB57B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      ),
    },
    {
      title: t('footer.freeShipping'),
      subtitle: t('footer.onOrdersOver'),
      icon: (
        <svg
          className="w-5 h-5 text-[#CBB57B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
      ),
    },
    {
      title: t('footer.easyReturns'),
      subtitle: t('footer.thirtyDayGuarantee'),
      icon: (
        <svg
          className="w-5 h-5 text-[#CBB57B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      ),
    },
    {
      title: t('footer.support247'),
      subtitle: t('footer.alwaysHereToHelp'),
      icon: (
        <svg
          className="w-5 h-5 text-[#CBB57B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          />
        </svg>
      ),
    },
  ];

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: 'Pinterest',
      href: 'https://pinterest.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.690 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.350-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
    },
  ];

  const paymentMethods = [
    { src: '/logos/visa-10.svg', alt: 'Visa', width: 44 },
    { src: '/logos/mastercard-modern-design-.svg', alt: 'Mastercard', width: 36 },
    { src: '/logos/paypal-3.svg', alt: 'PayPal', width: 64 },
    { src: '/logos/stripe-4.svg', alt: 'Stripe', width: 50 },
  ];

  return (
    <footer className="bg-[#0C0C0C] text-white relative">
      {/* Gold rule at top */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#CBB57B]/50 to-transparent" />

      <div className="max-w-[1920px] mx-auto px-8 md:px-12 lg:px-16">
        {/* TOP: Brand + Newsletter */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 py-16 lg:py-20 border-b border-white/[0.06]">
          {/* Brand */}
          <motion.div {...fadeUp(0)} className="flex flex-col gap-5">
            <Link href="/" className="inline-block w-fit">
              <Image
                src="/logo.svg"
                alt="NextPik"
                width={140}
                height={48}
                className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-neutral-400 text-base font-light leading-relaxed max-w-sm">
              {t('footer.platformDescription')}
            </p>
          </motion.div>

          {/* Newsletter */}
          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#CBB57B]/60 mb-2">
                Newsletter
              </p>
              <h3 className="text-2xl lg:text-3xl font-light text-white">
                {t('footer.joinCommunity')}
              </h3>
            </div>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {t('footer.newsletterDescription')}
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                className="flex-1 min-w-0 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] border-r-0 rounded-l-lg focus:outline-none focus:border-[#CBB57B]/40 text-white placeholder-neutral-600 text-sm transition-colors"
                required
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="px-6 py-3.5 bg-[#CBB57B] text-black text-sm font-semibold rounded-r-lg whitespace-nowrap hover:bg-[#B8A06A] transition-colors min-w-[100px] flex items-center justify-center"
              >
                <AnimatePresence mode="wait">
                  {subscribed ? (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {t('buttons.subscribe')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* LINKS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 py-14 border-b border-white/[0.06]">
          {linkColumns.map((col, i) => (
            <motion.div key={col.heading} {...fadeUp(0.05 * i)}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#CBB57B]/60 mb-5">
                {col.heading}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group/link relative inline-block text-sm text-neutral-500 hover:text-neutral-200 transition-colors duration-300"
                    >
                      {link.label}
                      <span className="absolute -bottom-px left-0 h-px w-0 bg-[#CBB57B]/60 group-hover/link:w-full transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* TRUST STRIP */}
        <motion.div
          {...fadeUp(0)}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-b border-white/[0.06]"
        >
          {trustBadges.map((badge) => (
            <div key={badge.title} className="flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-full border border-white/[0.08] group-hover:border-[#CBB57B]/30 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                {badge.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">{badge.title}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{badge.subtitle}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* BOTTOM BAR */}
        <motion.div
          {...fadeUp(0)}
          className="flex flex-col lg:flex-row items-center justify-between gap-6 py-8"
        >
          {/* Copyright */}
          <p className="text-xs text-neutral-600 order-3 lg:order-1">
            © {new Date().getFullYear()} NextPik. {t('footer.allRightsReserved')}
          </p>

          {/* Payment logos */}
          <div className="flex items-center gap-2 order-2">
            {paymentMethods.map((pm) => (
              <div
                key={pm.alt}
                className="bg-white rounded px-3 py-1.5 flex items-center justify-center"
              >
                <Image
                  src={pm.src}
                  alt={pm.alt}
                  width={pm.width}
                  height={20}
                  className="h-4 w-auto object-contain"
                />
              </div>
            ))}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-2.5 order-1 lg:order-3">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-neutral-600 hover:text-[#CBB57B] hover:border-[#CBB57B]/30 transition-colors duration-300"
                aria-label={social.name}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
