'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Store,
  Building2,
  Tag,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Upload,
  FileText,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STEPS = [
  { id: 1, label: 'Store Info', icon: Store },
  { id: 2, label: 'Business', icon: Building2 },
  { id: 3, label: 'Categories', icon: Tag },
  { id: 4, label: 'Verification', icon: ShieldCheck },
];

const BUSINESS_TYPES = [
  {
    value: 'individual',
    label: 'Individual / Personal',
    description: 'Selling as a private person',
  },
  {
    value: 'sole_proprietor',
    label: 'Sole Proprietor',
    description: 'Self-employed, unregistered business',
  },
  { value: 'llc', label: 'LLC', description: 'Limited Liability Company' },
  {
    value: 'corporation',
    label: 'Corporation',
    description: 'Registered corporation (Inc., Corp., Ltd.)',
  },
  {
    value: 'registered_business',
    label: 'Registered Business',
    description: 'Other registered business entity',
  },
];

const VOLUME_OPTIONS = [
  { value: 'under-1000', label: 'Under $1,000 / month' },
  { value: '1000-5000', label: '$1,000 – $5,000 / month' },
  { value: '5000-10000', label: '$5,000 – $10,000 / month' },
  { value: '10000-50000', label: '$10,000 – $50,000 / month' },
  { value: 'over-50000', label: 'Over $50,000 / month' },
];

const CATEGORIES = [
  'Fashion & Apparel',
  'Jewelry & Watches',
  'Home & Décor',
  'Beauty & Fragrance',
  'Electronics',
  'Sports & Outdoors',
  'Art & Collectibles',
  'Automotive',
  'Real Estate',
  'Vehicles',
  'Rentals',
  'Services',
];

const DOCUMENT_TYPES = [
  {
    value: 'government_id',
    label: 'Government-issued ID',
    description: "Passport, driver's license, national ID",
  },
  {
    value: 'business_registration',
    label: 'Business Registration',
    description: 'Certificate of incorporation or registration',
  },
  {
    value: 'tax_certificate',
    label: 'Tax Certificate',
    description: 'EIN letter, VAT registration, or tax ID document',
  },
  {
    value: 'other',
    label: 'Other Official Document',
    description: 'Any other official identity or business document',
  },
];

interface FormData {
  storeName: string;
  storeDescription: string;
  businessType: string;
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
  applicationDocumentUrl: string;
  applicationDocumentType: string;
  applicationNotes: string;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : active
                      ? 'bg-[#CBB57B] border-[#CBB57B] text-white'
                      : 'bg-white border-neutral-200 text-neutral-400'
                }`}
              >
                {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  active ? 'text-[#CBB57B]' : done ? 'text-green-600' : 'text-neutral-400'
                }`}
              >
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                  current > step.id ? 'bg-green-400' : 'bg-neutral-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    storeName: '',
    storeDescription: '',
    businessType: 'individual',
    taxId: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    productCategories: [],
    monthlyVolume: 'under-1000',
    applicationDocumentUrl: '',
    applicationDocumentType: 'government_id',
    applicationNotes: '',
  });

  const [docFileName, setDocFileName] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Detect existing application (registered-as-seller path or re-application)
  const { data: appStatus } = useSWR(
    user ? `${API_URL}/seller/application-status` : null,
    (url: string) =>
      fetch(url, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
        .then((r) => r.json())
        .then((d) => d.data || d),
    { revalidateOnFocus: false }
  );

  const isUpdateMode =
    appStatus?.hasApplication &&
    (appStatus?.store?.status === 'PENDING' || appStatus?.store?.status === 'REJECTED');

  // Pre-fill store name from existing store
  useEffect(() => {
    if (appStatus?.store?.name && !form.storeName) {
      setForm((prev) => ({ ...prev, storeName: appStatus.store.name }));
    }
  }, [appStatus]);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') router.push('/admin/dashboard');
      // Active sellers go to their dashboard
      if (user.role === 'SELLER' && appStatus?.store?.status === 'ACTIVE') {
        router.push('/seller');
      }
    }
  }, [authLoading, user, appStatus]);

  const set = (field: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleCategory = (cat: string) => {
    set(
      'productCategories',
      form.productCategories.includes(cat)
        ? form.productCategories.filter((c) => c !== cat)
        : [...form.productCategories, cat]
    );
  };

  function validateStep(s: number): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.storeName.trim()) e.storeName = 'Store name is required';
      else if (form.storeName.length < 3) e.storeName = 'At least 3 characters';
      if (!form.phone.trim()) e.phone = 'Phone number is required';
    }
    if (s === 2) {
      if (!form.businessType) e.businessType = 'Select a business type';
      if (!form.country.trim()) e.country = 'Country is required';
    }
    if (s === 3) {
      if (form.productCategories.length === 0) e.productCategories = 'Select at least one category';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, or PDF files are accepted');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    try {
      setIsUploadingDoc(true);
      const fd = new FormData();
      fd.append('image', file);

      const res = await fetch(`${API_URL}/upload/image?folder=kyc-documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (data.data?.url || data.url) {
        set('applicationDocumentUrl', data.data?.url || data.url);
        setDocFileName(file.name);
        toast.success('Document uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setIsUploadingDoc(false);
    }
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/seller/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          storeName: form.storeName,
          storeDescription: form.storeDescription,
          businessType: form.businessType,
          taxId: form.taxId,
          phone: form.phone,
          website: form.website,
          address: form.address,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
          productCategories: form.productCategories,
          monthlyVolume: form.monthlyVolume,
          applicationDocumentUrl: form.applicationDocumentUrl,
          applicationDocumentType: form.applicationDocumentType,
          applicationNotes: form.applicationNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          isUpdateMode
            ? 'Application updated! Our team will review your complete details.'
            : "Application submitted! We'll review it within 24-48 hours."
        );
        router.push('/seller/onboarding');
      } else {
        toast.error(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#CBB57B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          {isUpdateMode ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-sm font-medium mb-4">
                <RefreshCw className="w-3.5 h-3.5" /> Completing your application
              </div>
              <h1 className="text-4xl font-bold mb-3">Complete Your Application</h1>
              <p className="text-neutral-300 text-lg">
                Your account is created. Add your business details and verification document to
                speed up approval.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-3">Become a Seller</h1>
              <p className="text-neutral-300 text-lg">
                Join NextPik's curated luxury marketplace. Applications are reviewed within 24–48
                hours.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <StepIndicator current={step} total={4} />

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Store Information ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                <h2 className="text-xl font-bold text-black mb-1">Store Information</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  This is your public store identity on NextPik.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.storeName}
                      onChange={(e) => set('storeName', e.target.value)}
                      placeholder="e.g. Maison Elara"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] ${
                        errors.storeName ? 'border-red-400' : 'border-neutral-300'
                      }`}
                    />
                    {errors.storeName && (
                      <p className="text-xs text-red-500 mt-1">{errors.storeName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Store Description
                    </label>
                    <textarea
                      value={form.storeDescription}
                      onChange={(e) => set('storeDescription', e.target.value)}
                      rows={3}
                      placeholder="Tell buyers what makes your store special — brand story, product focus, sourcing approach..."
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="+1 555 000 0000"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] ${
                          errors.phone ? 'border-red-400' : 'border-neutral-300'
                        }`}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Website
                      </label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => set('website', e.target.value)}
                        placeholder="https://yourbrand.com"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Business Details ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                <h2 className="text-xl font-bold text-black mb-1">Business Details</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Required for tax compliance and seller verification.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {BUSINESS_TYPES.map((bt) => (
                        <label
                          key={bt.value}
                          className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            form.businessType === bt.value
                              ? 'border-[#CBB57B] bg-[#CBB57B]/5'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="businessType"
                            value={bt.value}
                            checked={form.businessType === bt.value}
                            onChange={() => set('businessType', bt.value)}
                            className="mt-0.5 accent-[#CBB57B]"
                          />
                          <div>
                            <p className="text-sm font-medium text-black">{bt.label}</p>
                            <p className="text-xs text-neutral-500">{bt.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Tax ID / EIN / VAT
                      </label>
                      <input
                        type="text"
                        value={form.taxId}
                        onChange={(e) => set('taxId', e.target.value)}
                        placeholder="XX-XXXXXXX"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => set('country', e.target.value)}
                        placeholder="US"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] ${
                          errors.country ? 'border-red-400' : 'border-neutral-300'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => set('address', e.target.value)}
                        placeholder="123 Main Street"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set('city', e.target.value)}
                        placeholder="New York"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => set('state', e.target.value)}
                        placeholder="NY"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Categories & Volume ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                <h2 className="text-xl font-bold text-black mb-1">Product Focus</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  What will you sell? Select all that apply.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Product Categories <span className="text-red-500">*</span>
                    </label>
                    {errors.productCategories && (
                      <p className="text-xs text-red-500 mb-2">{errors.productCategories}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-3.5 py-2.5 border rounded-xl text-sm font-medium text-left transition-all ${
                            form.productCategories.includes(cat)
                              ? 'bg-[#CBB57B] border-[#CBB57B] text-white'
                              : 'border-neutral-200 text-neutral-700 hover:border-[#CBB57B]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Expected Monthly Revenue
                    </label>
                    <div className="space-y-2">
                      {VOLUME_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                            form.monthlyVolume === opt.value
                              ? 'border-[#CBB57B] bg-[#CBB57B]/5'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="monthlyVolume"
                            value={opt.value}
                            checked={form.monthlyVolume === opt.value}
                            onChange={() => set('monthlyVolume', opt.value)}
                            className="accent-[#CBB57B]"
                          />
                          <span className="text-sm text-black">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Identity Verification ── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                <h2 className="text-xl font-bold text-black mb-1">Identity Verification</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Upload a document to verify your identity or business. This is reviewed only by
                  our admin team and kept confidential.
                </p>

                <div className="space-y-5">
                  {/* Document type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Document Type
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {DOCUMENT_TYPES.map((dt) => (
                        <label
                          key={dt.value}
                          className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            form.applicationDocumentType === dt.value
                              ? 'border-[#CBB57B] bg-[#CBB57B]/5'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="documentType"
                            value={dt.value}
                            checked={form.applicationDocumentType === dt.value}
                            onChange={() => set('applicationDocumentType', dt.value)}
                            className="mt-0.5 accent-[#CBB57B]"
                          />
                          <div>
                            <p className="text-sm font-medium text-black">{dt.label}</p>
                            <p className="text-xs text-neutral-500">{dt.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Upload Document
                    </label>
                    {form.applicationDocumentUrl ? (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              {docFileName || 'Document uploaded'}
                            </p>
                            <p className="text-xs text-green-600">Ready to submit</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            set('applicationDocumentUrl', '');
                            setDocFileName('');
                          }}
                          className="p-1.5 text-green-600 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDoc}
                        className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-neutral-300 rounded-xl hover:border-[#CBB57B] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingDoc ? (
                          <Loader2 className="w-8 h-8 animate-spin text-[#CBB57B]" />
                        ) : (
                          <Upload className="w-8 h-8 text-neutral-400" />
                        )}
                        <div className="text-center">
                          <p className="text-sm font-medium text-neutral-700">
                            {isUploadingDoc ? 'Uploading...' : 'Click to upload document'}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            JPG, PNG, WebP, or PDF — max 10MB
                          </p>
                        </div>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Optional notes */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Additional Notes{' '}
                      <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={form.applicationNotes}
                      onChange={(e) => set('applicationNotes', e.target.value)}
                      rows={3}
                      placeholder="Anything you'd like the review team to know — e.g. brand background, sourcing, certifications..."
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] resize-none"
                    />
                  </div>

                  {/* No document notice */}
                  {!form.applicationDocumentUrl && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Document recommended</p>
                        <p className="text-sm text-amber-700">
                          Applications with a verification document are approved faster. You can
                          still submit without one, but approval may take longer.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Legal agreement */}
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600">
                    By submitting this application, you agree to our{' '}
                    <Link href="/terms" className="text-[#CBB57B] hover:underline font-medium">
                      Terms of Service
                    </Link>
                    ,{' '}
                    <Link href="/privacy" className="text-[#CBB57B] hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    , and{' '}
                    <Link
                      href="/seller-agreement"
                      className="text-[#CBB57B] hover:underline font-medium"
                    >
                      Seller Agreement
                    </Link>
                    . Your submitted documents are used solely for identity verification purposes.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-neutral-100 bg-neutral-50">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link
                href="/dashboard/buyer"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Cancel
              </Link>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#CBB57B] text-white rounded-lg text-sm font-semibold hover:bg-[#A89968] transition-colors"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#CBB57B] text-white rounded-lg text-sm font-semibold hover:bg-[#A89968] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{' '}
                    {isUpdateMode ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />{' '}
                    {isUpdateMode ? 'Update Application' : 'Submit Application'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
