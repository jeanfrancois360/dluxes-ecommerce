'use client';

/**
 * Seller Payout Settings Page
 *
 * Configure payout method, schedule, and bank account details
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  storesAPI,
  PayoutSettingsResponse,
  UpdatePayoutSettingsDto,
  Payout,
} from '@/lib/api/stores';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  Building2,
  CreditCard,
  Wallet,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  ChevronLeft,
  Shield,
  Globe,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/seller/page-header';

// Supported currencies for payouts
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
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
];

// Day of week options
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PayoutSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('sellerPayoutSettings');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings data
  const [settingsData, setSettingsData] = useState<PayoutSettingsResponse | null>(null);
  const [recentPayouts, setRecentPayouts] = useState<Payout[]>([]);

  // Form state
  const [formData, setFormData] = useState<UpdatePayoutSettingsDto>({
    payoutMethod: 'bank_transfer',
    payoutEmail: '',
    payoutCurrency: 'USD',
    payoutMinAmount: 50,
    payoutFrequency: 'monthly',
    payoutDayOfWeek: 1,
    payoutDayOfMonth: 1,
    payoutAutomatic: true,
    bankAccountName: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    bankName: '',
    bankBranchName: '',
    bankSwiftCode: '',
    bankIban: '',
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
      const [settingsRes, payoutsRes] = await Promise.all([
        storesAPI.getPayoutSettings(),
        storesAPI.getPayoutHistory({ limit: 5 }),
      ]);

      setSettingsData(settingsRes);
      setRecentPayouts(payoutsRes.data);

      // Populate form with current settings
      const settings = settingsRes.settings;
      setFormData({
        payoutMethod: settings.payoutMethod || 'bank_transfer',
        payoutEmail: settings.payoutEmail || '',
        payoutCurrency: settings.payoutCurrency || 'USD',
        payoutMinAmount: Number(settings.payoutMinAmount) || 50,
        payoutFrequency: settings.payoutFrequency || 'monthly',
        payoutDayOfWeek: settings.payoutDayOfWeek ?? 1,
        payoutDayOfMonth: settings.payoutDayOfMonth ?? 1,
        payoutAutomatic: settings.payoutAutomatic ?? true,
        bankAccountName: settings.bankAccountName || '',
        bankAccountNumber: '', // Don't pre-fill for security
        bankRoutingNumber: '', // Don't pre-fill for security
        bankName: settings.bankName || '',
        bankBranchName: settings.bankBranchName || '',
        bankSwiftCode: settings.bankSwiftCode || '',
        bankIban: '', // Don't pre-fill for security
        bankCountry: settings.bankCountry || 'US',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Only send changed fields
      const dataToSend: UpdatePayoutSettingsDto = { ...formData };

      // Convert numeric values
      if (dataToSend.payoutMinAmount) {
        dataToSend.payoutMinAmount = Number(dataToSend.payoutMinAmount);
      }
      if (dataToSend.payoutDayOfWeek !== undefined) {
        dataToSend.payoutDayOfWeek = Number(dataToSend.payoutDayOfWeek);
      }
      if (dataToSend.payoutDayOfMonth !== undefined) {
        dataToSend.payoutDayOfMonth = Number(dataToSend.payoutDayOfMonth);
      }

      // Remove empty bank fields (don't overwrite existing data)
      if (!dataToSend.bankAccountNumber) delete dataToSend.bankAccountNumber;
      if (!dataToSend.bankRoutingNumber) delete dataToSend.bankRoutingNumber;
      if (!dataToSend.bankIban) delete dataToSend.bankIban;

      await storesAPI.updatePayoutSettings(dataToSend);
      setSuccess(t('alerts.updateSuccess'));

      // Refresh settings to get updated data
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
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.payoutSettings') },
        ]}
        actions={
          <Link
            href="/seller/earnings"
            className="flex items-center gap-2 px-4 py-2 bg-black text-[#CBB57B] border border-[#CBB57B] rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all"
          >
            {t('viewEarnings')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 font-medium">Success</p>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Balance Cards */}
        {settingsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Available Balance</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrencyAmount(settingsData.balances.available)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">Ready for payout</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Pending Balance</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrencyAmount(settingsData.balances.pending)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">In escrow, awaiting release</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Next Payout</p>
                  <p className="text-lg font-bold text-black">
                    {formatDate(settingsData.nextPayoutDate)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">Based on your schedule</p>
            </motion.div>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payout Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  Payout Method
                </h2>

                <div className="space-y-4">
                  {/* Method Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        value: 'bank_transfer',
                        label: 'Bank Transfer',
                        icon: Building2,
                        description: 'Direct deposit to your bank',
                      },
                      {
                        value: 'paypal',
                        label: 'PayPal',
                        icon: Wallet,
                        description: 'Send to PayPal account',
                      },
                      {
                        value: 'stripe_connect',
                        label: 'Stripe',
                        icon: CreditCard,
                        description: 'Via Stripe Connect',
                      },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.payoutMethod === method.value
                            ? 'border-gold bg-gold/5'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payoutMethod"
                          value={method.value}
                          checked={formData.payoutMethod === method.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <method.icon
                          className={`w-6 h-6 mb-2 ${
                            formData.payoutMethod === method.value
                              ? 'text-gold'
                              : 'text-neutral-400'
                          }`}
                        />
                        <span className="font-medium text-black">{method.label}</span>
                        <span className="text-xs text-neutral-500">{method.description}</span>
                        {formData.payoutMethod === method.value && (
                          <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-gold" />
                        )}
                      </label>
                    ))}
                  </div>

                  {/* PayPal Email (if PayPal selected) */}
                  {formData.payoutMethod === 'paypal' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        PayPal Email
                      </label>
                      <input
                        type="email"
                        name="payoutEmail"
                        value={formData.payoutEmail}
                        onChange={handleInputChange}
                        placeholder="your-paypal@email.com"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bank Account Details (if bank transfer) */}
              {formData.payoutMethod === 'bank_transfer' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
                >
                  <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gold" />
                    Bank Account Details
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        name="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Bank Country *
                      </label>
                      <select
                        name="bankCountry"
                        value={formData.bankCountry}
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
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="Bank of America"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        name="bankBranchName"
                        value={formData.bankBranchName}
                        onChange={handleInputChange}
                        placeholder="Main Street Branch"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Account Number *
                        {settingsData?.settings.bankAccountNumber && (
                          <span className="ml-2 text-xs text-neutral-400">
                            (Current: {settingsData.settings.bankAccountNumber})
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleInputChange}
                        placeholder="Enter to update"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Routing Number
                        {settingsData?.settings.bankRoutingNumber && (
                          <span className="ml-2 text-xs text-neutral-400">
                            (Current: {settingsData.settings.bankRoutingNumber})
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="bankRoutingNumber"
                        value={formData.bankRoutingNumber}
                        onChange={handleInputChange}
                        placeholder="Enter to update"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        SWIFT/BIC Code
                        <Globe className="inline w-4 h-4 ml-1 text-neutral-400" />
                      </label>
                      <input
                        type="text"
                        name="bankSwiftCode"
                        value={formData.bankSwiftCode}
                        onChange={handleInputChange}
                        placeholder="For international transfers"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        IBAN
                        {settingsData?.settings.bankIban && (
                          <span className="ml-2 text-xs text-neutral-400">
                            (Current: {settingsData.settings.bankIban})
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="bankIban"
                        value={formData.bankIban}
                        onChange={handleInputChange}
                        placeholder="Enter to update"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Your information is secure
                      </p>
                      <p className="text-xs text-blue-600">
                        Bank account details are encrypted and stored securely. We never share your
                        financial information with third parties.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payout Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  Payout Schedule
                </h2>

                <div className="space-y-6">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Payout Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'biweekly', label: 'Bi-weekly' },
                        { value: 'monthly', label: 'Monthly' },
                      ].map((freq) => (
                        <label
                          key={freq.value}
                          className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.payoutFrequency === freq.value
                              ? 'border-gold bg-gold/5 text-gold font-medium'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payoutFrequency"
                            value={freq.value}
                            checked={formData.payoutFrequency === freq.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          {freq.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Day Selection */}
                  {formData.payoutFrequency === 'weekly' ||
                  formData.payoutFrequency === 'biweekly' ? (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Payout Day
                      </label>
                      <select
                        name="payoutDayOfWeek"
                        value={formData.payoutDayOfWeek}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Day of Month
                      </label>
                      <select
                        name="payoutDayOfMonth"
                        value={formData.payoutDayOfMonth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>
                            {day}
                            {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Currency and Minimum */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Payout Currency
                      </label>
                      <select
                        name="payoutCurrency"
                        value={formData.payoutCurrency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Minimum Payout Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="number"
                          name="payoutMinAmount"
                          value={formData.payoutMinAmount}
                          onChange={handleInputChange}
                          min="10"
                          max="10000"
                          className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Minimum $10, maximum $10,000</p>
                    </div>
                  </div>

                  {/* Automatic Payouts Toggle */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                    <div>
                      <p className="font-medium text-black">Automatic Payouts</p>
                      <p className="text-sm text-neutral-500">
                        Automatically transfer funds when threshold is met
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="payoutAutomatic"
                        checked={formData.payoutAutomatic}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                    </label>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={fetchSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  Reset
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Payouts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-black">Recent Payouts</h3>
                  <Link href="/seller/earnings" className="text-sm text-gold hover:text-gold/80">
                    View All
                  </Link>
                </div>

                {recentPayouts.length > 0 ? (
                  <div className="space-y-3">
                    {recentPayouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-black">
                            {formatCurrencyAmount(payout.amount)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payout.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : payout.status === 'PENDING' || payout.status === 'PROCESSING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {payout.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-neutral-500 py-4">No payouts yet</p>
                )}
              </motion.div>

              {/* Help Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 rounded-2xl p-6 border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>
                        <strong>Bank Transfer:</strong> Takes 3-5 business days
                      </li>
                      <li>
                        <strong>PayPal:</strong> Usually instant
                      </li>
                      <li>
                        <strong>Minimum:</strong> Payouts occur only when your balance exceeds the
                        minimum
                      </li>
                    </ul>
                    <Link
                      href="/help/payouts"
                      className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Learn more about payouts
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Verification Status */}
              {settingsData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`rounded-2xl p-6 border ${
                    settingsData.settings.verified
                      ? 'bg-green-50 border-green-100'
                      : 'bg-yellow-50 border-yellow-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {settingsData.settings.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3
                        className={`font-semibold mb-1 ${
                          settingsData.settings.verified ? 'text-green-900' : 'text-yellow-900'
                        }`}
                      >
                        {settingsData.settings.verified ? 'Store Verified' : 'Verification Pending'}
                      </h3>
                      <p
                        className={`text-sm ${
                          settingsData.settings.verified ? 'text-green-700' : 'text-yellow-700'
                        }`}
                      >
                        {settingsData.settings.verified
                          ? 'Your store is verified and eligible for payouts.'
                          : 'Complete verification to enable payouts.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
