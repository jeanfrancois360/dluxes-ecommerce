'use client';

/**
 * Seller Store Settings Page
 *
 * Manage store information and configuration
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { CountrySelector } from '@/components/forms/country-selector';
import { storesAPI } from '@/lib/api/stores';
import useSWR from 'swr';
import { toast } from 'sonner';
import PageHeader from '@/components/seller/page-header';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('sellerStoreSettings');
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch store data from API
  const {
    data: store,
    error,
    mutate,
  } = useSWR(user && user.role === 'SELLER' ? 'my-store' : null, () => storesAPI.getMyStore(), {
    revalidateOnFocus: true,
  });

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

      toast.success(t('toast.saveSuccess'));
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error?.response?.data?.message || t('toast.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.uploadImage'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.logoTooLarge'));
      return;
    }

    try {
      setIsUploadingLogo(true);
      await storesAPI.uploadLogo(file);
      await mutate();
      toast.success(t('toast.logoSuccess'));
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      toast.error(error?.message || t('toast.logoFailed'));
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.uploadImage'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('toast.bannerTooLarge'));
      return;
    }

    try {
      setIsUploadingBanner(true);
      await storesAPI.uploadBanner(file);
      await mutate();
      toast.success(t('toast.bannerSuccess'));
    } catch (error: any) {
      console.error('Failed to upload banner:', error);
      toast.error(error?.message || t('toast.bannerFailed'));
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
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
          <p className="text-red-600 mb-4">{t('errorLoading')}</p>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Store Settings' }]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Branding Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-black">{t('branding.title')}</h2>
            <p className="text-sm text-neutral-500 mt-1">{t('branding.subtitle')}</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                {t('branding.banner')}
              </label>
              <div className="relative">
                <div
                  className={`relative w-full h-48 rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
                    store?.banner ? 'border-transparent' : 'border-neutral-300 hover:border-gold'
                  }`}
                >
                  {store?.banner ? (
                    <>
                      <img
                        src={store.banner}
                        alt={t('branding.bannerAlt')}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={isUploadingBanner}
                          className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-100 transition-colors flex items-center gap-2"
                        >
                          {isUploadingBanner ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t('branding.uploading')}
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4" />
                              {t('branding.changeBanner')}
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="w-full h-full flex flex-col items-center justify-center text-neutral-500 hover:text-gold transition-colors"
                    >
                      {isUploadingBanner ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm">{t('branding.uploading')}</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-12 h-12 mb-2" />
                          <span className="text-sm font-medium">{t('branding.uploadBanner')}</span>
                          <span className="text-xs text-neutral-400 mt-1">
                            {t('branding.bannerRecommended')}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                {t('branding.logo')}
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div
                    className={`w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
                      store?.logo ? 'border-transparent' : 'border-neutral-300 hover:border-gold'
                    }`}
                  >
                    {store?.logo ? (
                      <>
                        <img
                          src={store.logo}
                          alt={t('branding.logoAlt')}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="p-2 bg-white rounded-full"
                          >
                            {isUploadingLogo ? (
                              <Loader2 className="w-5 h-5 animate-spin text-black" />
                            ) : (
                              <Camera className="w-5 h-5 text-black" />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="w-full h-full flex flex-col items-center justify-center text-neutral-500 hover:text-gold transition-colors"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-1" />
                            <span className="text-xs">{t('branding.upload')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="text-sm text-neutral-500">
                  <p className="font-medium text-neutral-700 mb-1">{t('branding.uploadLogo')}</p>
                  <p>{t('branding.logoRecommended')}</p>
                  <p>{t('branding.logoMaxSize')}</p>
                  <p>{t('branding.logoFormats')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-black">{t('storeInfo.title')}</h2>
            <p className="text-sm text-neutral-500 mt-1">{t('storeInfo.subtitle')}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-md font-semibold text-black mb-4">{t('storeInfo.basicInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="My Luxury Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Slug *
                  </label>
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
              <h3 className="text-md font-semibold text-black mb-4">
                {t('storeInfo.contactInfo')}
              </h3>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Street Address Line 1
                  </label>
                  <input
                    type="text"
                    value={settings.address1}
                    onChange={(e) => handleChange('address1', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Street Address Line 2
                  </label>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={settings.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ZIP/Postal Code
                  </label>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tax ID/EIN
                  </label>
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
              href="/seller"
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
