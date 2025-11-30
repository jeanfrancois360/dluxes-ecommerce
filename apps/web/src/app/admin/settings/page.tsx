'use client';

import React, { useState } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';

function SettingsContent() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Luxury Marketplace',
    siteDescription: 'Premium lifestyle products',
    supportEmail: 'support@luxury.com',
    contactPhone: '+1 (555) 123-4567',
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@luxury.com',
    smtpPassword: '',
    fromName: 'Luxury Marketplace',
    fromEmail: 'noreply@luxury.com',
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    stripePublishableKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
    paypalSecret: '',
    currency: 'USD',
    taxRate: '8.5',
  });

  // Shipping Settings State
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: '100',
    standardShippingCost: '9.99',
    expressShippingCost: '19.99',
    internationalShippingCost: '29.99',
  });

  // Payment Split Settings State
  const [paymentSplitSettings, setPaymentSplitSettings] = useState({
    defaultCommissionRate: '10',
    minimumCommissionRate: '5',
    maximumCommissionRate: '30',
    payoutSchedule: 'weekly',
    minimumPayoutAmount: '50',
    holdPeriodDays: '7',
    categoryCommissions: {
      jewelry: '12',
      watches: '10',
      fashion: '15',
      electronics: '8',
      beauty: '12',
    },
    // Referral settings
    referralEnabled: true,
    referrerRewardType: 'percentage',
    referrerRewardAmount: '5',
    referredDiscountType: 'percentage',
    referredDiscountAmount: '10',
    referralCookieDays: '30',
    maxReferralsPerUser: '100',
    minimumPurchaseForReferral: '50',
    referralTiers: {
      bronze: { minReferrals: '0', rewardBonus: '0' },
      silver: { minReferrals: '10', rewardBonus: '2' },
      gold: { minReferrals: '25', rewardBonus: '5' },
      platinum: { minReferrals: '50', rewardBonus: '10' },
    },
  });

  // Ad Pricing Settings State
  const [adPricingSettings, setAdPricingSettings] = useState({
    // Default prices by placement (per day)
    placementPricing: {
      HOMEPAGE_HERO: '150',
      HOMEPAGE_FEATURED: '100',
      HOMEPAGE_SIDEBAR: '50',
      PRODUCTS_BANNER: '80',
      PRODUCTS_INLINE: '60',
      PRODUCTS_SIDEBAR: '40',
      CATEGORY_BANNER: '70',
      PRODUCT_DETAIL_SIDEBAR: '45',
      CHECKOUT_UPSELL: '90',
      SEARCH_RESULTS: '55',
    },
    // Pricing models
    pricingModels: {
      CPM: { enabled: true, minPrice: '0.50', description: 'Cost per 1000 impressions' },
      CPC: { enabled: true, minPrice: '0.25', description: 'Cost per click' },
      DAILY: { enabled: true, minPrice: '10', description: 'Daily rate' },
      WEEKLY: { enabled: true, minPrice: '50', description: 'Weekly rate' },
      MONTHLY: { enabled: true, minPrice: '150', description: 'Monthly rate' },
      FIXED: { enabled: true, minPrice: '100', description: 'One-time payment' },
    },
    // Budget settings
    minimumBudget: '50',
    maximumBudget: '10000',
    budgetWarningThreshold: '20', // Warn when budget is at 20%
    autoPauseOnBudgetExhaust: true,
    // Payment settings
    paymentMethods: {
      stripe: true,
      paypal: false,
      bankTransfer: false,
    },
    // Approval settings
    requireApproval: true,
    autoApproveReturningAdvertisers: false,
    maxPendingAds: '5',
    // Analytics & Reporting
    trackImpressions: true,
    trackClicks: true,
    trackConversions: true,
    generateDailyReports: true,
    // Discounts
    volumeDiscounts: {
      weekly: '5',
      monthly: '10',
      quarterly: '15',
    },
    // Subscription Plans
    subscriptionPlans: {
      BASIC: { price: '99', impressions: '10000', features: ['Basic analytics', 'Email support'] },
      STANDARD: { price: '299', impressions: '50000', features: ['Advanced analytics', 'Priority support', 'A/B testing'] },
      PREMIUM: { price: '599', impressions: 'Unlimited', features: ['Full analytics', '24/7 support', 'A/B testing', 'Priority placement', 'Dedicated manager'] },
    },
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'currencies', label: 'Currencies', icon: '💱' },
    { id: 'payment-split', label: 'Payment Split', icon: '💰' },
    { id: 'ad-pricing', label: 'Ad Pricing', icon: '📢' },
    { id: 'shipping', label: 'Shipping', icon: '📦' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your store configuration and preferences</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  activeTab === tab.id
                    ? 'bg-[#CBB57B] text-black font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <textarea
                      value={generalSettings.siteDescription}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={generalSettings.contactPhone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Email Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="text"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                    <input
                      type="text"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                    <input
                      type="text"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                    <input
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Currencies Settings */}
            {activeTab === 'currencies' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Currency Management</h2>
                <div className="bg-gradient-to-r from-[#CBB57B]/10 to-[#CBB57B]/5 border border-[#CBB57B]/30 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">💱</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Multi-Currency System</h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Manage exchange rates, activate/deactivate currencies, and configure multi-currency settings for your marketplace.
                  </p>
                  <a
                    href="/admin/currencies"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
                  >
                    <span>Open Currency Management</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl mb-2">🔄</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Real-Time Conversion</h4>
                      <p className="text-sm text-gray-600">Automatic price conversion across the platform</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl mb-2">📊</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Exchange Rates</h4>
                      <p className="text-sm text-gray-600">Manage 8+ major currencies with live rates</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl mb-2">🔒</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Transaction Integrity</h4>
                      <p className="text-sm text-gray-600">Preserve original currency in order history</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Gateway Configuration</h2>
                <div className="space-y-8">
                  {/* Stripe */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Stripe</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Publishable Key</label>
                        <input
                          type="text"
                          value={paymentSettings.stripePublishableKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, stripePublishableKey: e.target.value })}
                          placeholder="pk_test_..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                        <input
                          type="password"
                          value={paymentSettings.stripeSecretKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeSecretKey: e.target.value })}
                          placeholder="sk_test_..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PayPal */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">PayPal</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                        <input
                          type="text"
                          value={paymentSettings.paypalClientId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalClientId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secret</label>
                        <input
                          type="password"
                          value={paymentSettings.paypalSecret}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalSecret: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Currency & Tax */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">General Payment Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          value={paymentSettings.currency}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={paymentSettings.taxRate}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, taxRate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Split Settings */}
            {activeTab === 'payment-split' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Split & Commission Settings</h2>
                <p className="text-gray-600">Configure how payments are split between the platform and sellers.</p>

                {/* Commission Rates */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission Rates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={paymentSplitSettings.defaultCommissionRate}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, defaultCommissionRate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Applied to all sellers by default</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={paymentSplitSettings.minimumCommissionRate}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, minimumCommissionRate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={paymentSplitSettings.maximumCommissionRate}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, maximumCommissionRate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Payout Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payout Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payout Schedule</label>
                      <select
                        value={paymentSplitSettings.payoutSchedule}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, payoutSchedule: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Payout ($)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={paymentSplitSettings.minimumPayoutAmount}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, minimumPayoutAmount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum balance for payout</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hold Period (Days)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={paymentSplitSettings.holdPeriodDays}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, holdPeriodDays: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Days to hold funds before payout</p>
                    </div>
                  </div>
                </div>

                {/* Category-Specific Commissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Category-Specific Commissions</h3>
                  <p className="text-sm text-gray-600 mb-4">Override default commission for specific categories</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(paymentSplitSettings.categoryCommissions).map(([category, rate]) => (
                      <div key={category} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 capitalize flex-1">{category}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={rate}
                            onChange={(e) => setPaymentSplitSettings({
                              ...paymentSplitSettings,
                              categoryCommissions: {
                                ...paymentSplitSettings.categoryCommissions,
                                [category]: e.target.value
                              }
                            })}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Commission Preview</h4>
                  <p className="text-sm text-blue-800">
                    For a $100 sale with {paymentSplitSettings.defaultCommissionRate}% commission:
                  </p>
                  <div className="mt-2 flex gap-6 text-sm">
                    <span className="text-blue-900">
                      <strong>Platform:</strong> ${(100 * Number(paymentSplitSettings.defaultCommissionRate) / 100).toFixed(2)}
                    </span>
                    <span className="text-blue-900">
                      <strong>Seller:</strong> ${(100 - (100 * Number(paymentSplitSettings.defaultCommissionRate) / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Referral Program */}
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Referral Program</h3>
                      <p className="text-sm text-gray-600">Reward users for referring new customers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSplitSettings.referralEnabled}
                        onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, referralEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                    </label>
                  </div>

                  {paymentSplitSettings.referralEnabled && (
                    <div className="space-y-6">
                      {/* Referrer Rewards */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Referrer Reward (Person who refers)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type</label>
                            <select
                              value={paymentSplitSettings.referrerRewardType}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, referrerRewardType: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            >
                              <option value="percentage">Percentage of Sale</option>
                              <option value="fixed">Fixed Amount</option>
                              <option value="credit">Store Credit</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reward Amount {paymentSplitSettings.referrerRewardType === 'percentage' ? '(%)' : '($)'}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={paymentSplitSettings.referrerRewardAmount}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, referrerRewardAmount: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Referred User Discount */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">New Customer Discount (Person referred)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                            <select
                              value={paymentSplitSettings.referredDiscountType}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, referredDiscountType: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            >
                              <option value="percentage">Percentage Off</option>
                              <option value="fixed">Fixed Amount Off</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Discount Amount {paymentSplitSettings.referredDiscountType === 'percentage' ? '(%)' : '($)'}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={paymentSplitSettings.referredDiscountAmount}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, referredDiscountAmount: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Referral Conditions */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Referral Conditions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cookie Duration (Days)</label>
                            <input
                              type="number"
                              min="1"
                              value={paymentSplitSettings.referralCookieDays}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, referralCookieDays: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">How long referral link stays active</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Referrals/User</label>
                            <input
                              type="number"
                              min="1"
                              value={paymentSplitSettings.maxReferralsPerUser}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, maxReferralsPerUser: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Min Purchase ($)</label>
                            <input
                              type="number"
                              min="0"
                              value={paymentSplitSettings.minimumPurchaseForReferral}
                              onChange={(e) => setPaymentSplitSettings({ ...paymentSplitSettings, minimumPurchaseForReferral: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Min order for referral reward</p>
                          </div>
                        </div>
                      </div>

                      {/* Referral Tiers */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Referral Tiers (Bonus Rewards)</h4>
                        <p className="text-xs text-gray-600 mb-3">Extra reward percentage for high-performing referrers</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {Object.entries(paymentSplitSettings.referralTiers).map(([tier, config]) => (
                            <div key={tier} className="p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700 capitalize block mb-2">{tier}</span>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-16">Min refs:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={config.minReferrals}
                                    onChange={(e) => setPaymentSplitSettings({
                                      ...paymentSplitSettings,
                                      referralTiers: {
                                        ...paymentSplitSettings.referralTiers,
                                        [tier]: { ...config, minReferrals: e.target.value }
                                      }
                                    })}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-16">Bonus %:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={config.rewardBonus}
                                    onChange={(e) => setPaymentSplitSettings({
                                      ...paymentSplitSettings,
                                      referralTiers: {
                                        ...paymentSplitSettings.referralTiers,
                                        [tier]: { ...config, rewardBonus: e.target.value }
                                      }
                                    })}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Referral Preview */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-2">Referral Preview</h4>
                        <div className="text-sm text-green-800 space-y-1">
                          <p>
                            <strong>Referrer gets:</strong> {paymentSplitSettings.referrerRewardAmount}
                            {paymentSplitSettings.referrerRewardType === 'percentage' ? '% of sale' : ' USD'}
                            {' '}(+ tier bonus)
                          </p>
                          <p>
                            <strong>New customer gets:</strong> {paymentSplitSettings.referredDiscountAmount}
                            {paymentSplitSettings.referredDiscountType === 'percentage' ? '% off' : ' USD off'}
                            {' '}first purchase
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ad Pricing Settings */}
            {activeTab === 'ad-pricing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Advertisement Pricing Configuration</h2>
                <p className="text-gray-600">Configure pricing for ad placements and manage advertiser settings.</p>

                {/* Placement Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Placement Pricing (Daily Rate)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(adPricingSettings.placementPricing).map(([placement, price]) => (
                      <div key={placement} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 flex-1">
                          {placement.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setAdPricingSettings({
                              ...adPricingSettings,
                              placementPricing: {
                                ...adPricingSettings.placementPricing,
                                [placement]: e.target.value
                              }
                            })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                          />
                          <span className="text-xs text-gray-500">/day</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Models */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing Models</h3>
                  <div className="space-y-3">
                    {Object.entries(adPricingSettings.pricingModels).map(([model, config]) => (
                      <div key={model} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setAdPricingSettings({
                              ...adPricingSettings,
                              pricingModels: {
                                ...adPricingSettings.pricingModels,
                                [model]: { ...config, enabled: e.target.checked }
                              }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                        </label>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{model}</span>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Min:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={config.minPrice}
                              onChange={(e) => setAdPricingSettings({
                                ...adPricingSettings,
                                pricingModels: {
                                  ...adPricingSettings.pricingModels,
                                  [model]: { ...config, minPrice: e.target.value }
                                }
                              })}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Budget ($)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={adPricingSettings.minimumBudget}
                        onChange={(e) => setAdPricingSettings({ ...adPricingSettings, minimumBudget: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Budget ($)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={adPricingSettings.maximumBudget}
                        onChange={(e) => setAdPricingSettings({ ...adPricingSettings, maximumBudget: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Warning Threshold (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        value={adPricingSettings.budgetWarningThreshold}
                        onChange={(e) => setAdPricingSettings({ ...adPricingSettings, budgetWarningThreshold: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when budget reaches this %</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-pause on Budget Exhaust</h4>
                      <p className="text-sm text-gray-600">Automatically pause ads when budget runs out</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adPricingSettings.autoPauseOnBudgetExhaust}
                        onChange={(e) => setAdPricingSettings({ ...adPricingSettings, autoPauseOnBudgetExhaust: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                    </label>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods for Ads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Stripe</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.paymentMethods.stripe}
                          onChange={(e) => setAdPricingSettings({
                            ...adPricingSettings,
                            paymentMethods: { ...adPricingSettings.paymentMethods, stripe: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">PayPal</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.paymentMethods.paypal}
                          onChange={(e) => setAdPricingSettings({
                            ...adPricingSettings,
                            paymentMethods: { ...adPricingSettings.paymentMethods, paypal: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Bank Transfer</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.paymentMethods.bankTransfer}
                          onChange={(e) => setAdPricingSettings({
                            ...adPricingSettings,
                            paymentMethods: { ...adPricingSettings.paymentMethods, bankTransfer: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Approval Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Require Manual Approval</h4>
                        <p className="text-sm text-gray-600">All ads must be approved before going live</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.requireApproval}
                          onChange={(e) => setAdPricingSettings({ ...adPricingSettings, requireApproval: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-approve Returning Advertisers</h4>
                        <p className="text-sm text-gray-600">Skip approval for advertisers with successful history</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.autoApproveReturningAdvertisers}
                          onChange={(e) => setAdPricingSettings({ ...adPricingSettings, autoApproveReturningAdvertisers: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Pending Ads per Advertiser</label>
                      <input
                        type="number"
                        min="1"
                        value={adPricingSettings.maxPendingAds}
                        onChange={(e) => setAdPricingSettings({ ...adPricingSettings, maxPendingAds: e.target.value })}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Volume Discounts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Volume Discounts</h3>
                  <p className="text-sm text-gray-600 mb-4">Discount percentages for longer ad placements</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={adPricingSettings.volumeDiscounts.weekly}
                        onChange={(e) => setAdPricingSettings({
                          ...adPricingSettings,
                          volumeDiscounts: { ...adPricingSettings.volumeDiscounts, weekly: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={adPricingSettings.volumeDiscounts.monthly}
                        onChange={(e) => setAdPricingSettings({
                          ...adPricingSettings,
                          volumeDiscounts: { ...adPricingSettings.volumeDiscounts, monthly: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quarterly Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={adPricingSettings.volumeDiscounts.quarterly}
                        onChange={(e) => setAdPricingSettings({
                          ...adPricingSettings,
                          volumeDiscounts: { ...adPricingSettings.volumeDiscounts, quarterly: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Plans */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(adPricingSettings.subscriptionPlans).map(([plan, config]) => (
                      <div key={plan} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">{plan}</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Monthly Price ($)</label>
                            <input
                              type="number"
                              min="0"
                              value={config.price}
                              onChange={(e) => setAdPricingSettings({
                                ...adPricingSettings,
                                subscriptionPlans: {
                                  ...adPricingSettings.subscriptionPlans,
                                  [plan]: { ...config, price: e.target.value }
                                }
                              })}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Impressions</label>
                            <input
                              type="text"
                              value={config.impressions}
                              onChange={(e) => setAdPricingSettings({
                                ...adPricingSettings,
                                subscriptionPlans: {
                                  ...adPricingSettings.subscriptionPlans,
                                  [plan]: { ...config, impressions: e.target.value }
                                }
                              })}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Features</label>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {config.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <span className="text-green-500">✓</span> {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytics Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics & Tracking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Track Impressions</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.trackImpressions}
                          onChange={(e) => setAdPricingSettings({ ...adPricingSettings, trackImpressions: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Track Clicks</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.trackClicks}
                          onChange={(e) => setAdPricingSettings({ ...adPricingSettings, trackClicks: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Track Conversions</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.trackConversions}
                          onChange={(e) => setAdPricingSettings({ ...adPricingSettings, trackConversions: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Daily Reports</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adPricingSettings.generateDailyReports}
                          onChange={(e) => setAdPricingSettings({ ...adPricingSettings, generateDailyReports: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pricing Preview */}
                <div className="mt-6 p-4 bg-[#CBB57B]/10 rounded-lg border border-[#CBB57B]/30">
                  <h4 className="font-medium text-[#8B7355] mb-3">Pricing Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Homepage Hero (Monthly):</span>
                      <p className="font-semibold text-gray-900">
                        ${(Number(adPricingSettings.placementPricing.HOMEPAGE_HERO) * 30 * (1 - Number(adPricingSettings.volumeDiscounts.monthly) / 100)).toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1">(with {adPricingSettings.volumeDiscounts.monthly}% discount)</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Products Banner (Weekly):</span>
                      <p className="font-semibold text-gray-900">
                        ${(Number(adPricingSettings.placementPricing.PRODUCTS_BANNER) * 7 * (1 - Number(adPricingSettings.volumeDiscounts.weekly) / 100)).toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1">(with {adPricingSettings.volumeDiscounts.weekly}% discount)</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Budget Range:</span>
                      <p className="font-semibold text-gray-900">
                        ${adPricingSettings.minimumBudget} - ${adPricingSettings.maximumBudget}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Settings */}
            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Shipping Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">Orders above this amount qualify for free shipping</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingSettings.standardShippingCost}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, standardShippingCost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Express Shipping ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingSettings.expressShippingCost}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, expressShippingCost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">International Shipping ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingSettings.internationalShippingCost}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, internationalShippingCost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Session Timeout</h3>
                      <p className="text-sm text-gray-600">Auto-logout after 30 minutes of inactivity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Login Attempt Limit</h3>
                      <p className="text-sm text-gray-600">Lock account after 5 failed login attempts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Verification</h3>
                      <p className="text-sm text-gray-600">Require email verification for new accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#CBB57B]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBB57B]"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SettingsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
