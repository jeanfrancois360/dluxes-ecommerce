'use client';

/**
 * Seller Payout Settings Page (Production Ready)
 * Configure payment method, bank details, tax information, and receive payouts
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import {
  sellerPayoutAPI,
  SellerPayoutSettings,
  UpdatePayoutSettingsDto,
} from '@/lib/api/seller-payout';
import {
  Building2,
  CreditCard,
  Wallet,
  Globe2,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  Shield,
  FileText,
  Loader2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import PageHeader from '@/components/seller/page-header';
import StripeConnectButton from '@/components/seller/stripe-connect-button';

// Supported currencies for payouts
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

// Bank country options
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
];

export default function PayoutSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings data
  const [settings, setSettings] = useState<SellerPayoutSettings | null>(null);
  const [canReceive, setCanReceive] = useState<{ canReceive: boolean; reason?: string } | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState<UpdatePayoutSettingsDto>({
    paymentMethod: 'bank_transfer',
    payoutCurrency: 'USD',
    bankCountry: 'US',
  });

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Fetch settings data
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [settingsData, canReceiveData] = await Promise.all([
        sellerPayoutAPI.getSettings(),
        sellerPayoutAPI.canReceive(),
      ]);

      setSettings(settingsData);
      setCanReceive(canReceiveData);

      // Populate form with current settings
      setFormData({
        paymentMethod: settingsData.paymentMethod || 'bank_transfer',
        payoutCurrency: settingsData.payoutCurrency || 'USD',

        // Bank Transfer (don't pre-fill sensitive data)
        bankName: settingsData.bankName || '',
        accountHolderName: settingsData.accountHolderName || '',
        accountNumber: '', // Never pre-fill
        routingNumber: '', // Never pre-fill
        iban: '', // Never pre-fill
        swiftCode: settingsData.swiftCode || '',
        bankAddress: settingsData.bankAddress || '',
        bankCountry: settingsData.bankCountry || 'US',

        // PayPal
        paypalEmail: settingsData.paypalEmail || '',

        // Wise
        wiseEmail: settingsData.wiseEmail || '',
        wiseRecipientId: settingsData.wiseRecipientId || '',

        // Tax
        taxId: settingsData.taxId || '',
        taxCountry: settingsData.taxCountry || '',
        taxFormType: settingsData.taxFormType || '',
      });
    } catch (err: any) {
      console.error('Failed to fetch payout settings:', err);
      setError(err.message || 'Failed to load payout settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SELLER') {
      fetchSettings();
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Remove empty fields to avoid overwriting existing data
      const dataToSend: UpdatePayoutSettingsDto = { ...formData };

      Object.keys(dataToSend).forEach((key) => {
        const value = dataToSend[key as keyof UpdatePayoutSettingsDto];
        if (value === '' || value === null || value === undefined) {
          delete dataToSend[key as keyof UpdatePayoutSettingsDto];
        }
      });

      await sellerPayoutAPI.updateSettings(dataToSend);
      setSuccess('Payout settings saved successfully! Pending admin verification.');

      // Refresh settings
      await fetchSettings();
    } catch (err: any) {
      console.error('Failed to update payout settings:', err);
      setError(err.message || 'Failed to update payout settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  const paymentMethods = [
    {
      value: 'bank_transfer',
      label: 'Bank Transfer',
      icon: Building2,
      description: 'Direct deposit to your bank',
      badge: 'Most Common',
    },
    {
      value: 'STRIPE_CONNECT',
      label: 'Stripe Connect',
      icon: CreditCard,
      description: 'Fast, secure payouts',
      badge: 'Recommended',
    },
    {
      value: 'PAYPAL',
      label: 'PayPal',
      icon: Wallet,
      description: 'Send to PayPal account',
      badge: 'Instant',
    },
    {
      value: 'WISE',
      label: 'Wise',
      icon: Globe2,
      description: 'Low-fee international transfers',
      badge: 'Low Fees',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Payout Settings"
        description="Configure how you want to receive your earnings"
        breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Payout Settings' }]}
        actions={
          <Link
            href="/seller/earnings"
            className="flex items-center gap-2 px-4 py-2 bg-black text-[#CBB57B] border border-[#CBB57B] rounded-lg hover:bg-neutral-900 transition-all"
          >
            View Earnings
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-700 font-medium">Success</p>
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification Status Banner */}
        {settings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-2xl p-6 border ${
              settings.verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-4">
              {settings.verified ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-bold text-lg mb-1 ${
                    settings.verified ? 'text-green-900' : 'text-yellow-900'
                  }`}
                >
                  {settings.verified ? '✓ Verified - Ready for Payouts' : 'Pending Verification'}
                </h3>
                <p
                  className={`text-sm ${settings.verified ? 'text-green-700' : 'text-yellow-700'}`}
                >
                  {settings.verified
                    ? 'Your payout settings have been verified. You can receive payouts.'
                    : settings.rejectionNotes
                      ? `Verification rejected: ${settings.rejectionNotes}. Please update your information.`
                      : 'Your settings are pending admin verification. This usually takes 1-2 business days.'}
                </p>
                {canReceive && !canReceive.canReceive && canReceive.reason && (
                  <p className="text-sm text-yellow-700 mt-1">
                    <strong>Note:</strong> {canReceive.reason}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gold" />
              Payment Method
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.paymentMethod === method.value
                      ? 'border-gold bg-gold/5 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={formData.paymentMethod === method.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between mb-3">
                    <method.icon
                      className={`w-7 h-7 ${
                        formData.paymentMethod === method.value ? 'text-gold' : 'text-neutral-400'
                      }`}
                    />
                    {formData.paymentMethod === method.value && (
                      <CheckCircle className="w-5 h-5 text-gold" />
                    )}
                  </div>
                  <span className="font-semibold text-black mb-1">{method.label}</span>
                  <span className="text-xs text-neutral-500 mb-2">{method.description}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                      formData.paymentMethod === method.value
                        ? 'bg-gold/20 text-gold'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {method.badge}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Stripe Connect Integration */}
          {formData.paymentMethod === 'STRIPE_CONNECT' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
            >
              <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold" />
                Stripe Connect
              </h2>

              <StripeConnectButton
                accountId={settings?.stripeAccountId}
                accountStatus={settings?.stripeAccountStatus}
                onConnected={fetchSettings}
                country={formData.bankCountry}
              />
            </motion.div>
          )}

          {/* Bank Transfer Details */}
          {formData.paymentMethod === 'bank_transfer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
            >
              <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                Bank Account Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName || ''}
                    onChange={handleInputChange}
                    required={formData.paymentMethod === 'bank_transfer'}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bank Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bankCountry"
                    value={formData.bankCountry || 'US'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName || ''}
                    onChange={handleInputChange}
                    required={formData.paymentMethod === 'bank_transfer'}
                    placeholder="Bank of America"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                    {settings?.accountNumber && (
                      <span className="ml-2 text-xs text-neutral-400">
                        (Current: {settings.accountNumber})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber || ''}
                    onChange={handleInputChange}
                    placeholder={
                      settings?.accountNumber ? 'Enter to update' : 'Enter account number'
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Routing Number
                    {settings?.routingNumber && (
                      <span className="ml-2 text-xs text-neutral-400">
                        (Current: {settings.routingNumber})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="routingNumber"
                    value={formData.routingNumber || ''}
                    onChange={handleInputChange}
                    placeholder="For US banks (9 digits)"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    SWIFT/BIC Code
                  </label>
                  <input
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode || ''}
                    onChange={handleInputChange}
                    placeholder="For international transfers"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    IBAN (if applicable)
                    {settings?.iban && (
                      <span className="ml-2 text-xs text-neutral-400">
                        (Current: {settings.iban})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban || ''}
                    onChange={handleInputChange}
                    placeholder="For European banks"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bank Address (Optional)
                  </label>
                  <textarea
                    name="bankAddress"
                    value={formData.bankAddress || ''}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Full bank address"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Your information is secure</p>
                  <p className="text-xs text-blue-600">
                    Sensitive data is encrypted and never shared with third parties.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* PayPal Details */}
          {formData.paymentMethod === 'PAYPAL' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
            >
              <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold" />
                PayPal Account
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  PayPal Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="paypalEmail"
                  value={formData.paypalEmail || ''}
                  onChange={handleInputChange}
                  required={formData.paymentMethod === 'PAYPAL'}
                  placeholder="your-paypal@email.com"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Make sure this email is associated with your verified PayPal account.
                </p>
              </div>
            </motion.div>
          )}

          {/* Wise Details */}
          {formData.paymentMethod === 'WISE' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
            >
              <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-gold" />
                Wise (TransferWise) Account
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Wise Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="wiseEmail"
                    value={formData.wiseEmail || ''}
                    onChange={handleInputChange}
                    required={formData.paymentMethod === 'WISE'}
                    placeholder="your-wise@email.com"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Wise Recipient ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="wiseRecipientId"
                    value={formData.wiseRecipientId || ''}
                    onChange={handleInputChange}
                    placeholder="From your Wise account"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    You can find this in your Wise account settings. Contact support if you need
                    help.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tax Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Tax Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tax ID / VAT Number
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., EIN, VAT, GST"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tax Country
                </label>
                <select
                  name="taxCountry"
                  value={formData.taxCountry || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tax Form Type
                </label>
                <input
                  type="text"
                  name="taxFormType"
                  value={formData.taxFormType || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., W-9, W-8BEN"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Tax compliance required</p>
                <p className="text-xs text-yellow-700">
                  Providing tax information helps us comply with local regulations and may be
                  required for payouts.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Payout Currency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
          >
            <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-gold" />
              Payout Preferences
            </h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Preferred Currency
              </label>
              <select
                name="payoutCurrency"
                value={formData.payoutCurrency || 'USD'}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-2">
                Currency conversion rates will be applied if different from order currency.
              </p>
            </div>
          </motion.div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fetchSettings}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </form>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
        >
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <strong>Automatic Payouts:</strong> Funds are released automatically after escrow
                  hold period
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <strong>Verification:</strong> Admin verification usually takes 1-2 business days
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <strong>Bank Transfer:</strong> Takes 3-5 business days to receive funds
                </li>
                <li className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <strong>PayPal/Wise:</strong> Usually faster, check their processing times
                </li>
              </ul>
              <Link
                href="/help/payouts"
                className="inline-block mt-4 text-blue-700 hover:text-blue-800 font-medium text-sm"
              >
                Learn more about payouts →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
