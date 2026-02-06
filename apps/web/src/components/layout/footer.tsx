'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

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

  const footerLinks = {
    shop: [
      { label: t('footer.allProducts'), href: '/products' },
      { label: t('footer.allStores'), href: '/stores' },
      { label: t('footer.searchProducts'), href: '/products' },
      { label: t('footer.wishlist'), href: '/wishlist' },
      { label: t('footer.becomeSeller'), href: '/become-seller' },
    ],
    account: [
      { label: t('footer.myAccount'), href: '/account' },
      { label: t('footer.myOrders'), href: '/account/orders' },
      { label: t('footer.myReviews'), href: '/account/reviews' },
      { label: t('footer.following'), href: '/account/following' },
      { label: t('footer.notifications'), href: '/account/notifications' },
    ],
    customerService: [
      { label: t('footer.contactUs'), href: '/contact' },
      { label: t('footer.trackOrder'), href: '/track-order' },
      { label: t('footer.helpCenter'), href: '/help' },
      { label: t('footer.returns'), href: '/account/returns' },
      { label: t('footer.inquiries'), href: '/account/inquiries' },
    ],
    company: [
      { label: t('footer.aboutUs'), href: '/about' },
      { label: t('footer.sellerPortal'), href: '/seller/products' },
      { label: t('footer.adminPortal'), href: '/admin/dashboard' },
      { label: t('footer.advertisementPlans'), href: '/seller/advertisement-plans' },
    ],
    legal: [
      { label: t('footer.privacyPolicy'), href: '/privacy' },
      { label: t('footer.termsOfService'), href: '/terms' },
      { label: t('footer.sellerAgreement'), href: '/seller-agreement' },
    ],
  };

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: 'Pinterest',
      href: 'https://pinterest.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.690 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.350-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Top Section - Newsletter */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 pb-8 lg:pb-12 border-b border-neutral-700">
          <div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-3 sm:mb-4">
              {t('footer.joinCommunity')}
            </h3>
            <p className="text-neutral-400 text-base sm:text-lg">
              {t('footer.newsletterDescription')}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.emailPlaceholder')}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-800 border-2 border-neutral-700 rounded-lg focus:border-gold focus:outline-none text-white placeholder-neutral-500 text-sm sm:text-base"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors whitespace-nowrap text-sm sm:text-base"
                >
                  {t('buttons.subscribe')}
                </motion.button>
              </div>
              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-success-DEFAULT text-sm"
                >
                  {t('footer.thankYouSubscribe')}
                </motion.p>
              )}
            </form>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 py-8 sm:py-10 lg:py-12">
          {/* Shop */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{t('footer.shop')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-neutral-400 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{t('footer.myAccount')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-neutral-400 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{t('footer.customerService')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.customerService.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-neutral-400 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-neutral-400 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-neutral-400 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-6 py-8 sm:py-10 lg:py-12 border-y border-neutral-700">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">{t('footer.securePayment')}</p>
              <p className="text-xs sm:text-sm text-neutral-400">{t('footer.sslEncrypted')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">{t('footer.freeShipping')}</p>
              <p className="text-xs sm:text-sm text-neutral-400">{t('footer.onOrdersOver')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">{t('footer.easyReturns')}</p>
              <p className="text-xs sm:text-sm text-neutral-400">{t('footer.thirtyDayGuarantee')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">{t('footer.support247')}</p>
              <p className="text-xs sm:text-sm text-neutral-400">{t('footer.alwaysHereToHelp')}</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 lg:gap-6 pt-8 sm:pt-10 lg:pt-12">
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center md:items-start gap-3 sm:gap-4 w-full md:w-auto">
            <Link href="/" className="group">
              <Image
                src="/logo.svg"
                alt="NextPik"
                width={140}
                height={48}
                className="h-auto w-auto max-h-10 sm:max-h-12 transition-all duration-300 group-hover:brightness-110"
              />
            </Link>
            <p className="text-neutral-400 text-xs sm:text-sm text-center md:text-left max-w-md">
              {t('footer.platformDescription')}
            </p>
            <p className="text-neutral-500 text-xs sm:text-sm text-center md:text-left">
              © {new Date().getFullYear()} NextPik. {t('footer.allRightsReserved')}
            </p>
          </div>

          {/* Social Links */}
          <div className="w-full md:w-auto">
            <p className="text-xs sm:text-sm text-neutral-400 mb-3 sm:mb-4 text-center">{t('footer.followUs')}</p>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 hover:bg-gold hover:text-black transition-all [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6"
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="w-full md:w-auto">
            <p className="text-xs sm:text-sm text-neutral-400 mb-3 sm:mb-4 text-center">{t('footer.weAccept')}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* Visa */}
              <div className="bg-white rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg"
                  alt="Visa"
                  className="h-4 sm:h-5 w-auto"
                />
              </div>

              {/* Mastercard */}
              <div className="bg-white rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                  alt="Mastercard"
                  className="h-4 sm:h-5 w-auto"
                />
              </div>

              {/* PayPal */}
              <div className="bg-white rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                  alt="PayPal"
                  className="h-4 sm:h-5 w-auto"
                />
              </div>

              {/* Stripe */}
              <div className="bg-white rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                  alt="Stripe"
                  className="h-4 sm:h-5 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
