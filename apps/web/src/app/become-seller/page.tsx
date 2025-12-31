'use client';

/**
 * Become a Seller Page
 *
 * Allow buyers to apply to become sellers on the platform
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface SellerApplication {
  storeName: string;
  storeDescription: string;
  businessType: string;
  businessName: string;
  taxId: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  productCategories: string[];
  monthlyVolume: string;
}

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SellerApplication>({
    storeName: '',
    storeDescription: '',
    businessType: 'individual',
    businessName: '',
    taxId: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    productCategories: [],
    monthlyVolume: 'under-1000',
  });

  useEffect(() => {
    if (!authLoading && user) {
      // If already a seller, redirect to seller dashboard
      if (user.role === 'SELLER') {
        router.push('/dashboard/seller');
        return;
      }
      // If admin, they shouldn't need this page
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
        return;
      }
    }
  }, [authLoading, user]);

  const handleChange = (field: keyof SellerApplication, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter((c) => c !== category)
        : [...prev.productCategories, category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.storeName || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Application submitted successfully! We will review your application and get back to you soon.');
        router.push('/dashboard/buyer');
      } else {
        alert(data.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Fashion & Apparel',
    'Jewelry & Watches',
    'Home & Decor',
    'Beauty & Cosmetics',
    'Electronics',
    'Sports & Outdoors',
    'Art & Collectibles',
    'Automotive',
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Become a Seller</h1>
            <p className="text-xl text-neutral-300">
              Join our luxury marketplace and reach millions of premium customers worldwide
            </p>
          </motion.div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Global Reach</h3>
            <p className="text-neutral-600">Access millions of premium customers worldwide</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Competitive Fees</h3>
            <p className="text-neutral-600">Low commission rates with transparent pricing</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Easy Setup</h3>
            <p className="text-neutral-600">Get started quickly with our intuitive tools</p>
          </motion.div>
        </div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text-black">Seller Application</h2>
              <p className="text-neutral-600 mt-1">Complete the form below to apply for a seller account</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Store Information */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Store Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.storeName}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="My Luxury Store"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Store Description</label>
                    <textarea
                      value={formData.storeDescription}
                      onChange={(e) => handleChange('storeDescription', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="Tell us about your store and the products you'll sell..."
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Business Type</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleChange('businessType', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="individual">Individual/Sole Proprietor</option>
                      <option value="business">Business/Company</option>
                      <option value="llc">LLC</option>
                      <option value="corporation">Corporation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="ABC Company LLC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tax ID/EIN</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Product Categories */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Product Categories</h3>
                <p className="text-sm text-neutral-600 mb-4">Select the categories that best describe your products</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        formData.productCategories.includes(category)
                          ? 'bg-gold border-gold text-black'
                          : 'border-neutral-300 text-neutral-700 hover:border-gold'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Volume */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Expected Monthly Sales Volume</h3>
                <select
                  value={formData.monthlyVolume}
                  onChange={(e) => handleChange('monthlyVolume', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="under-1000">Under $1,000</option>
                  <option value="1000-5000">$1,000 - $5,000</option>
                  <option value="5000-10000">$5,000 - $10,000</option>
                  <option value="10000-50000">$10,000 - $50,000</option>
                  <option value="over-50000">Over $50,000</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                <Link href="/dashboard/buyer" className="text-neutral-600 hover:text-black">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
