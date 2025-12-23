'use client';

/**
 * Seller Store Settings Page
 *
 * Manage store information and configuration
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { CountrySelector } from '@/components/forms/country-selector';
import { storesAPI } from '@/lib/api/stores';
import useSWR from 'swr';
import { toast } from 'sonner';

interface StoreSettings {
  name: string;
  slug: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  taxId: string;
  returnPolicy: string;
  shippingPolicy: string;
  termsConditions: string;
}

export default function StoreSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch store data from API
  const { data: store, error, mutate } = useSWR(
    user && user.role === 'SELLER' ? 'my-store' : null,
    () => storesAPI.getMyStore(),
    {
      revalidateOnFocus: true,
    }
  );

  const [settings, setSettings] = useState<StoreSettings>({
    name: '',
    slug: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    taxId: '',
    returnPolicy: '',
    shippingPolicy: '',
    termsConditions: '',
  });

  // Update form when store data loads
  useEffect(() => {
    if (store) {
      setSettings({
        name: store.name,
        slug: store.slug,
        description: store.description || '',
        email: store.email,
        phone: store.phone || '',
        website: store.website || '',
        address1: store.address1 || '',
        address2: store.address2 || '',
        city: store.city || '',
        province: store.province || '',
        postalCode: store.postalCode || '',
        country: store.country || '',
        taxId: store.taxId || '',
        returnPolicy: store.returnPolicy || '',
        shippingPolicy: store.shippingPolicy || '',
        termsConditions: store.termsConditions || '',
      });
    }
  }, [store]);

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await storesAPI.updateMyStore({
        name: settings.name,
        description: settings.description || undefined,
        email: settings.email,
        phone: settings.phone || undefined,
        website: settings.website || undefined,
        address1: settings.address1 || undefined,
        address2: settings.address2 || undefined,
        city: settings.city || undefined,
        province: settings.province || undefined,
        postalCode: settings.postalCode || undefined,
        country: settings.country || undefined,
        taxId: settings.taxId || undefined,
        returnPolicy: settings.returnPolicy || undefined,
        shippingPolicy: settings.shippingPolicy || undefined,
        termsConditions: settings.termsConditions || undefined,
      });

      // Revalidate the store data
      await mutate();

      toast.success('Store settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to save store settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = !store && !error;

  if (authLoading || (isLoading && !user)) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load store settings</p>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Store Settings</h1>
              <p className="text-neutral-300 mt-1">Manage your store information and configuration</p>
            </div>
            <Link
              href="/dashboard/seller"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-black">Store Information</h2>
            <p className="text-sm text-neutral-500 mt-1">Update your store details and contact information</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-md font-semibold text-black mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Store Name *</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="My Luxury Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Store Slug *</label>
                  <input
                    type="text"
                    value={settings.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-neutral-50"
                    placeholder="my-luxury-store"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">URL: /stores/{settings.slug}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
              <textarea
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Describe your store and products..."
              />
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-md font-semibold text-black mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="store@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-md font-semibold text-black mb-4">Business Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Street Address Line 1</label>
                  <input
                    type="text"
                    value={settings.address1}
                    onChange={(e) => handleChange('address1', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Street Address Line 2</label>
                  <input
                    type="text"
                    value={settings.address2}
                    onChange={(e) => handleChange('address2', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Suite, Apt, Floor (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">City</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    value={settings.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">ZIP/Postal Code</label>
                  <input
                    type="text"
                    value={settings.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Country</label>
                  <CountrySelector
                    value={settings.country}
                    onChange={(countryName) => handleChange('country', countryName)}
                    placeholder="Select your country"
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-md font-semibold text-black mb-4">Business Details</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Tax ID/EIN</label>
                  <input
                    type="text"
                    value={settings.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-neutral-200 flex justify-end gap-4">
            <Link
              href="/dashboard/seller"
              className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-gold text-black font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
