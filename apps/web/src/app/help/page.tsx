'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';

const faqCategories = [
  {
    id: 'orders',
    title: 'Orders & Shipping',
    icon: '📦',
    faqs: [
      {
        q: 'How long does shipping take?',
        a: 'Standard shipping takes 5-7 business days. Express shipping (2-3 business days) and overnight options are also available at checkout.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes! We ship to over 50 countries worldwide. International shipping times vary by location, typically 7-14 business days. Customs duties may apply.',
      },
      {
        q: 'Can I track my order?',
        a: 'Absolutely! Once your order ships, you\'ll receive a tracking number via email. You can also track your order from your account dashboard.',
      },
      {
        q: 'What if my item arrives damaged?',
        a: 'We\'re sorry if that happens! Contact us within 48 hours with photos of the damage, and we\'ll arrange a replacement or full refund immediately.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Exchanges',
    icon: '🔄',
    faqs: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy for most items. Products must be in original condition with all packaging and tags intact.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Log into your account, go to your order history, and select "Return Item". Follow the prompts to print your prepaid return label.',
      },
      {
        q: 'Are returns free?',
        a: 'Yes! We provide free return shipping on all domestic orders. International returns may require shipping fees.',
      },
      {
        q: 'How long does it take to receive my refund?',
        a: 'Once we receive your return, refunds are processed within 3-5 business days. The funds will appear in your original payment method.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products & Pricing',
    icon: '🛍️',
    faqs: [
      {
        q: 'Are your products authentic?',
        a: 'Yes, 100%! We source directly from authorized manufacturers and distributors. Every item comes with a certificate of authenticity.',
      },
      {
        q: 'Do you offer price matching?',
        a: 'Yes, we offer price matching on identical items from authorized retailers. Contact our support team with proof of the lower price.',
      },
      {
        q: 'Can I get notified when an out-of-stock item is available?',
        a: 'Absolutely! Click "Notify Me" on any product page, and we\'ll email you as soon as it\'s back in stock.',
      },
      {
        q: 'Do you offer gift wrapping?',
        a: 'Yes! Select the gift wrapping option at checkout for $15. We\'ll include a personalized message card and premium packaging.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Payment',
    icon: '👤',
    faqs: [
      {
        q: 'Is it safe to save my payment information?',
        a: 'Yes! We use industry-standard encryption (SSL) to protect your data. Your payment information is securely stored and never shared.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, and Affirm for financing options.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page. Enter your email, and we\'ll send you a secure link to reset your password.',
      },
      {
        q: 'Can I change my shipping address after ordering?',
        a: 'If your order hasn\'t shipped yet, you can update the address in your account. Contact support immediately if you need help.',
      },
    ],
  },
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState('orders');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
              How Can We Help?
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Find answers to common questions or contact our support team
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for help articles..."
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
                <h2 className="text-lg font-semibold text-black mb-4">Categories</h2>
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
                  <h3 className="font-semibold text-black mb-2">Still need help?</h3>
                  <p className="text-sm text-neutral-600 mb-4">Our support team is here 24/7</p>
                  <Link href="/contact">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-4 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
                    >
                      Contact Support
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
                        {currentCategory.faqs.length} frequently asked questions
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
              Didn't find what you're looking for?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Our customer support team is available 24/7 to assist you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-gold/90 transition-all"
                >
                  Contact Us
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 border-2 border-white text-white font-semibold text-lg rounded-lg hover:bg-white/20 transition-all"
              >
                Live Chat
              </motion.button>
            </div>

            {/* Contact Methods */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <svg className="w-8 h-8 text-gold mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold mb-1">Email</h3>
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
                <h3 className="font-semibold mb-1">Live Chat</h3>
                <p className="text-sm text-white/80">Available 24/7</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
