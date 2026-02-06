'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function HelpPage() {
  const t = useTranslations('help');

  const [activeCategory, setActiveCategory] = useState('orders');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      id: 'orders',
      title: t('ordersShipping'),
      icon: '\u{1F4E6}',
      faqs: [
        {
          q: t('faq.shippingTime'),
          a: t('faq.shippingTimeAnswer'),
        },
        {
          q: t('faq.shipInternationally'),
          a: t('faq.shipInternationallyAnswer'),
        },
        {
          q: t('faq.trackOrder'),
          a: t('faq.trackOrderAnswer'),
        },
        {
          q: t('faq.damagedItem'),
          a: t('faq.damagedItemAnswer'),
        },
      ],
    },
    {
      id: 'returns',
      title: t('returnsExchanges'),
      icon: '\u{1F504}',
      faqs: [
        {
          q: t('faq.returnPolicy'),
          a: t('faq.returnPolicyAnswer'),
        },
        {
          q: t('faq.initiateReturn'),
          a: t('faq.initiateReturnAnswer'),
        },
        {
          q: t('faq.freeReturns'),
          a: t('faq.freeReturnsAnswer'),
        },
        {
          q: t('faq.refundTime'),
          a: t('faq.refundTimeAnswer'),
        },
      ],
    },
    {
      id: 'products',
      title: t('productsPricing'),
      icon: '\u{1F6CD}\uFE0F',
      faqs: [
        {
          q: t('faq.authentic'),
          a: t('faq.authenticAnswer'),
        },
        {
          q: t('faq.priceMatch'),
          a: t('faq.priceMatchAnswer'),
        },
        {
          q: t('faq.notifyRestock'),
          a: t('faq.notifyRestockAnswer'),
        },
        {
          q: t('faq.giftWrapping'),
          a: t('faq.giftWrappingAnswer'),
        },
      ],
    },
    {
      id: 'account',
      title: t('accountPayment'),
      icon: '\u{1F464}',
      faqs: [
        {
          q: t('faq.paymentSafe'),
          a: t('faq.paymentSafeAnswer'),
        },
        {
          q: t('faq.paymentMethods'),
          a: t('faq.paymentMethodsAnswer'),
        },
        {
          q: t('faq.resetPassword'),
          a: t('faq.resetPasswordAnswer'),
        },
        {
          q: t('faq.changeAddress'),
          a: t('faq.changeAddressAnswer'),
        },
      ],
    },
  ];

  const currentCategory = faqCategories.find(cat => cat.id === activeCategory);

  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4 lg:px-8 text-center z-10"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
              {t('howCanWeHelp')}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              {t('findAnswers')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-6 py-4 pl-14 text-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <svg
                  className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
        </section>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-16">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Category Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-4 sticky top-24">
                <h2 className="text-lg font-semibold text-black mb-4">{t('categoriesTitle')}</h2>
                <div className="space-y-2">
                  {faqCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      whileHover={{ x: 4 }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                        activeCategory === category.id
                          ? 'bg-gold text-black font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span>{category.title}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Contact Support */}
                <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">{t('stillNeedHelp')}</h3>
                  <p className="text-sm text-neutral-600 mb-4">{t('supportTeam247')}</p>
                  <Link href="/contact">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
                    >
                      {t('contactSupport')}
                    </motion.button>
                  </Link>
                </div>
              </div>
            </aside>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {currentCategory && (
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-8">
                      <h2 className="text-3xl font-serif font-bold text-black mb-2">
                        {currentCategory.title}
                      </h2>
                      <p className="text-neutral-600">
                        {t('faqCount', { count: currentCategory.faqs.length })}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {currentCategory.faqs.map((faq, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-black mb-1">
                                {faq.q}
                              </h3>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex-shrink-0"
                            >
                              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {expandedFaq === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-neutral-200"
                              >
                                <div className="p-6 bg-neutral-50">
                                  <p className="text-neutral-700 leading-relaxed">{faq.a}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <section className="py-16 bg-gradient-to-br from-neutral-900 to-black text-white">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
            <h2 className="text-4xl font-serif font-bold mb-4">
              {t('didntFind')}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t('customerSupport247')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-gold/90 transition-all"
                >
                  {t('contactUs')}
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 border-2 border-white text-white font-semibold text-lg rounded-lg hover:bg-white/20 transition-all"
              >
                {t('liveChat')}
              </motion.button>
            </div>

            {/* Contact Methods */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <svg className="w-8 h-8 text-gold mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold mb-1">{t('email')}</h3>
                <p className="text-sm text-white/80">support@luxury.com</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <svg className="w-8 h-8 text-gold mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <h3 className="font-semibold mb-1">Phone</h3>
                <p className="text-sm text-white/80">+1 (555) 123-4567</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <svg className="w-8 h-8 text-gold mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="font-semibold mb-1">{t('liveChat')}</h3>
                <p className="text-sm text-white/80">{t('available247')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
