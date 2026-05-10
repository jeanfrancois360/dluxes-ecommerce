'use client';

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
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  Shield,
  FileText,
  Loader2,
  ArrowRight,
  Lock,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import PageHeader from '@/components/seller/page-header';
import StripeConnectButton from '@/components/seller/stripe-connect-button';
import { CountrySelector } from '@/components/forms/country-selector';
import { countries } from '@/lib/data/countries';

// Helper: convert stored country code (e.g. 'US') to full name ('United States')
// Falls back to the value itself if it's already a name or unknown
function codeToCountryName(value: string | undefined): string {
  if (!value) return 'United States';
  const byCode = countries.find((c) => c.code === value);
  if (byCode) return byCode.name;
  // Already a name or custom string
  return value;
}

const PAYMENT_METHODS: {
  value: string;
  label: string;
  icon: React.ElementType | null;
  logo: string | null;
  logoSize: number;
  description: string;
  badge: string;
  badgeColor: string;
  processingTime: string;
}[] = [
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    icon: Building2,
    logo: null,
    logoSize: 32,
    description: 'Direct deposit to your bank account',
    badge: 'Most Common',
    badgeColor: 'bg-neutral-100 text-neutral-600',
    processingTime: '3–5 business days',
  },
  {
    value: 'STRIPE_CONNECT',
    label: 'Stripe Connect',
    icon: null,
    logo: '/logos/stripe-4.svg',
    logoSize: 32,
    description: 'Fast, secure payouts via Stripe',
    badge: 'Recommended',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    processingTime: '1–2 business days',
  },
  {
    value: 'PAYPAL',
    label: 'PayPal',
    icon: null,
    logo: '/logos/paypal-4.svg',
    logoSize: 22,
    description: 'Send directly to your PayPal account',
    badge: 'Instant',
    badgeColor: 'bg-blue-100 text-blue-700',
    processingTime: 'Minutes',
  },
  {
    value: 'WISE',
    label: 'Wise',
    icon: null,
    logo: '/logos/wise-1.svg',
    logoSize: 32,
    description: 'Low-fee international transfers',
    badge: 'Low Fees',
    badgeColor: 'bg-teal-100 text-teal-700',
    processingTime: '1–2 business days',
  },
];

// Reusable input class
const INPUT =
  'w-full px-4 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm';

const SELECT =
  'w-full px-4 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-neutral-400 mt-1.5">{children}</p>;
}

function MaskedValue({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-400 mt-1">
      <Lock className="w-3 h-3" /> Current: {value}
    </span>
  );
}

export default function PayoutSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<SellerPayoutSettings | null>(null);
  const [canReceive, setCanReceive] = useState<{ canReceive: boolean; reason?: string } | null>(
    null
  );

  const [formData, setFormData] = useState<UpdatePayoutSettingsDto>({
    paymentMethod: 'bank_transfer',
    payoutCurrency: 'USD',
    bankCountry: 'United States',
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

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
      if (!settingsData) return;
      setFormData({
        paymentMethod: settingsData.paymentMethod || 'bank_transfer',
        payoutCurrency: settingsData.payoutCurrency || 'USD',
        bankName: settingsData.bankName || '',
        accountHolderName: settingsData.accountHolderName || '',
        accountNumber: '',
        routingNumber: '',
        iban: '',
        swiftCode: settingsData.swiftCode || '',
        bankAddress: settingsData.bankAddress || '',
        bankCountry: codeToCountryName(settingsData.bankCountry),
        paypalEmail: settingsData.paypalEmail || '',
        wiseEmail: settingsData.wiseEmail || '',
        wiseRecipientId: settingsData.wiseRecipientId || '',
        taxId: settingsData.taxId || '',
        taxCountry: settingsData.taxCountry || '',
        taxFormType: settingsData.taxFormType || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load payout settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const dataToSend: UpdatePayoutSettingsDto = { ...formData };
      Object.keys(dataToSend).forEach((key) => {
        const v = dataToSend[key as keyof UpdatePayoutSettingsDto];
        if (v === '' || v === null || v === undefined) {
          delete dataToSend[key as keyof UpdatePayoutSettingsDto];
        }
      });
      await sellerPayoutAPI.updateSettings(dataToSend);
      setSuccess('Payout settings saved. Pending admin verification (1–2 business days).');
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save payout settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neutral-400 animate-spin" />
      </div>
    );
  }

  const activeMethod = PAYMENT_METHODS.find((m) => m.value === formData.paymentMethod);

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Payout Settings"
        description="Configure how you want to receive your earnings"
        breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Payout Settings' }]}
        actions={
          <Link
            href="/seller/earnings"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            View Earnings <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Something went wrong</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Saved successfully</p>
                <p className="text-sm text-emerald-600 mt-0.5">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification status banner */}
        {settings && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-5 rounded-2xl border flex items-start gap-4 ${
              settings.verified
                ? 'bg-emerald-50 border-emerald-200'
                : settings.rejectionNotes
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
            }`}
          >
            {settings.verified ? (
              <BadgeCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : settings.rejectionNotes ? (
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold text-sm ${
                  settings.verified
                    ? 'text-emerald-900'
                    : settings.rejectionNotes
                      ? 'text-red-900'
                      : 'text-amber-900'
                }`}
              >
                {settings.verified
                  ? 'Verified — Ready to receive payouts'
                  : settings.rejectionNotes
                    ? 'Verification rejected — update required'
                    : 'Pending verification'}
              </p>
              <p
                className={`text-sm mt-0.5 ${
                  settings.verified
                    ? 'text-emerald-700'
                    : settings.rejectionNotes
                      ? 'text-red-700'
                      : 'text-amber-700'
                }`}
              >
                {settings.verified
                  ? 'Your payout details have been verified by our team.'
                  : settings.rejectionNotes
                    ? settings.rejectionNotes
                    : 'Our team verifies payout details within 1–2 business days.'}
              </p>
              {canReceive && !canReceive.canReceive && canReceive.reason && (
                <p className="text-xs text-amber-600 mt-1 font-medium">{canReceive.reason}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Main layout */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ── Left sidebar ── */}
            <div className="space-y-4">
              {/* Payment method picker */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  Payment Method
                </p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const selected = formData.paymentMethod === method.value;
                    return (
                      <label
                        key={method.value}
                        className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border transition-all ${
                          selected
                            ? 'bg-[#CBB57B] border-[#CBB57B] text-white'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={selected}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        {method.logo ? (
                          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-neutral-100">
                            <Image
                              src={method.logo}
                              alt={method.label}
                              width={method.logoSize}
                              height={method.logoSize}
                              className="object-contain"
                            />
                          </div>
                        ) : Icon ? (
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#CBB57B]/20' : 'bg-neutral-100'}`}
                          >
                            <Icon
                              className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-white' : 'text-neutral-400'}`}
                            />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold leading-tight ${selected ? 'text-white' : 'text-neutral-900'}`}
                          >
                            {method.label}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${selected ? 'text-white/70' : 'text-neutral-400'}`}
                          >
                            {method.processingTime}
                          </p>
                        </div>
                        {selected && <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Security note */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Bank-grade security</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      All sensitive data is AES-256 encrypted at rest. Account numbers are masked
                      and never exposed after submission.
                    </p>
                  </div>
                </div>
              </div>

              {/* Processing time */}
              {activeMethod && (
                <div className="bg-neutral-900 text-white rounded-2xl p-5">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Processing time
                  </p>
                  <p className="text-2xl font-bold">{activeMethod.processingTime}</p>
                  <p className="text-xs text-neutral-400 mt-1">{activeMethod.description}</p>
                  <span
                    className={`inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-full ${activeMethod.badgeColor}`}
                  >
                    {activeMethod.badge}
                  </span>
                </div>
              )}
            </div>

            {/* ── Right main content ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Method-specific form */}
              <AnimatePresence mode="wait">
                {/* Bank Transfer */}
                {formData.paymentMethod === 'bank_transfer' && (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-neutral-500" />
                      </div>
                      <h2 className="text-base font-bold text-neutral-900">Bank Account Details</h2>
                      <div className="ml-auto flex items-center gap-2">
                        <Image
                          src="/logos/visa-10.svg"
                          alt="Visa"
                          width={38}
                          height={24}
                          className="object-contain opacity-80"
                        />
                        <Image
                          src="/logos/mastercard-modern-design-.svg"
                          alt="Mastercard"
                          width={32}
                          height={24}
                          className="object-contain opacity-80"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <Label required>Account Holder Name</Label>
                        <input
                          type="text"
                          name="accountHolderName"
                          value={formData.accountHolderName || ''}
                          onChange={handleInputChange}
                          placeholder="Full legal name"
                          className={INPUT}
                        />
                        <FieldHint>Must match your bank account exactly</FieldHint>
                      </div>

                      <div>
                        <Label required>Bank Country</Label>
                        <CountrySelector
                          value={formData.bankCountry || 'United States'}
                          onChange={(name) =>
                            setFormData((prev) => ({ ...prev, bankCountry: name }))
                          }
                          className="!border !rounded-xl"
                        />
                      </div>

                      <div>
                        <Label required>Bank Name</Label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName || ''}
                          onChange={handleInputChange}
                          placeholder="e.g. Chase, Barclays, BNP Paribas"
                          className={INPUT}
                        />
                      </div>

                      <div>
                        <Label required>Account Number</Label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber || ''}
                          onChange={handleInputChange}
                          placeholder={
                            settings?.accountNumber ? 'Enter to update' : 'Account number'
                          }
                          className={INPUT}
                        />
                        <MaskedValue value={settings?.accountNumber} />
                      </div>

                      <div>
                        <Label>Routing Number</Label>
                        <input
                          type="text"
                          name="routingNumber"
                          value={formData.routingNumber || ''}
                          onChange={handleInputChange}
                          placeholder="9-digit ABA routing (US banks)"
                          className={INPUT}
                        />
                        <MaskedValue value={settings?.routingNumber} />
                      </div>

                      <div>
                        <Label>SWIFT / BIC Code</Label>
                        <input
                          type="text"
                          name="swiftCode"
                          value={formData.swiftCode || ''}
                          onChange={handleInputChange}
                          placeholder="e.g. CHASUS33"
                          className={INPUT}
                        />
                        <FieldHint>Required for international wire transfers</FieldHint>
                      </div>

                      <div className="sm:col-span-2">
                        <Label>IBAN</Label>
                        <input
                          type="text"
                          name="iban"
                          value={formData.iban || ''}
                          onChange={handleInputChange}
                          placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
                          className={INPUT}
                        />
                        <div className="flex items-center justify-between">
                          <FieldHint>Required for European banks (SEPA)</FieldHint>
                          <MaskedValue value={settings?.iban} />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Bank Address</Label>
                        <textarea
                          name="bankAddress"
                          value={formData.bankAddress || ''}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Full branch address (optional)"
                          className={`${INPUT} resize-none`}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Stripe Connect */}
                {formData.paymentMethod === 'STRIPE_CONNECT' && (
                  <motion.div
                    key="stripe"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-[#635BFF]/10 flex items-center justify-center flex-shrink-0">
                        <Image
                          src="/logos/stripe-4.svg"
                          alt="Stripe"
                          width={28}
                          height={28}
                          className="object-contain"
                        />
                      </div>
                      <h2 className="text-base font-bold text-neutral-900">Stripe Connect</h2>
                    </div>
                    <StripeConnectButton
                      accountId={settings?.stripeAccountId}
                      accountStatus={settings?.stripeAccountStatus}
                      onConnected={fetchSettings}
                      country={countries.find((c) => c.name === formData.bankCountry)?.code || 'US'}
                    />
                  </motion.div>
                )}

                {/* PayPal */}
                {formData.paymentMethod === 'PAYPAL' && (
                  <motion.div
                    key="paypal"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-[#003087]/10 flex items-center justify-center flex-shrink-0">
                        <Image
                          src="/logos/paypal-4.svg"
                          alt="PayPal"
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                      </div>
                      <h2 className="text-base font-bold text-neutral-900">PayPal Account</h2>
                    </div>
                    <div>
                      <Label required>PayPal Email</Label>
                      <input
                        type="email"
                        name="paypalEmail"
                        value={formData.paypalEmail || ''}
                        onChange={handleInputChange}
                        placeholder="paypal@youremail.com"
                        className={INPUT}
                      />
                      <FieldHint>
                        Must be linked to a verified PayPal business or personal account.
                      </FieldHint>
                    </div>
                  </motion.div>
                )}

                {/* Wise */}
                {formData.paymentMethod === 'WISE' && (
                  <motion.div
                    key="wise"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-[#9FE870]/20 flex items-center justify-center flex-shrink-0">
                        <Image
                          src="/logos/wise-1.svg"
                          alt="Wise"
                          width={28}
                          height={28}
                          className="object-contain"
                        />
                      </div>
                      <h2 className="text-base font-bold text-neutral-900">Wise Account</h2>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <Label required>Wise Email</Label>
                        <input
                          type="email"
                          name="wiseEmail"
                          value={formData.wiseEmail || ''}
                          onChange={handleInputChange}
                          placeholder="wise@youremail.com"
                          className={INPUT}
                        />
                        <FieldHint>Email registered on your Wise account</FieldHint>
                      </div>
                      <div>
                        <Label>Wise Recipient ID</Label>
                        <input
                          type="text"
                          name="wiseRecipientId"
                          value={formData.wiseRecipientId || ''}
                          onChange={handleInputChange}
                          placeholder="Found in Wise account settings"
                          className={INPUT}
                        />
                        <FieldHint>Optional — speeds up processing if provided.</FieldHint>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tax Information */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-neutral-500" />
                  <h2 className="text-base font-bold text-neutral-900">Tax Information</h2>
                  <span className="ml-auto text-xs text-neutral-400 font-medium">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label>Tax ID / VAT / EIN</Label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 12-3456789"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <Label>Tax Country</Label>
                    <CountrySelector
                      value={formData.taxCountry || ''}
                      onChange={(name) => setFormData((prev) => ({ ...prev, taxCountry: name }))}
                      placeholder="Select country"
                      className="!border !rounded-xl"
                    />
                  </div>

                  <div>
                    <Label>Tax Form Type</Label>
                    <select
                      name="taxFormType"
                      value={formData.taxFormType || ''}
                      onChange={handleInputChange}
                      className={SELECT}
                    >
                      <option value="">Select form type</option>
                      <option value="W-9">W-9 (US persons)</option>
                      <option value="W-8BEN">W-8BEN (Non-US individuals)</option>
                      <option value="W-8BEN-E">W-8BEN-E (Non-US entities)</option>
                      <option value="VAT">VAT registered</option>
                      <option value="GST">GST registered</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Tax details may be required for compliance in your country. Providing them
                    upfront avoids delays at payout time.
                  </p>
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
                <p className="text-xs text-neutral-400">
                  Changes go live after admin verification.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
