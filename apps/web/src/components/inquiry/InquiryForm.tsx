'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  CheckCircle,
  User,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Shield,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { inquiriesApi } from '@/lib/api/inquiries';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface InquiryFormProps {
  productId: string;
  productName: string;
  sellerName?: string;
}

const QUICK_MESSAGES = [
  'Is this still available?',
  'What are your available time slots?',
  'Can you provide more details?',
  'Do you offer a discount for bookings?',
];

const PREFERRED_CONTACT_OPTIONS = [
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'both', label: 'Either', icon: '🔔' },
] as const;

const PREFERRED_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning', hint: '8am – 12pm' },
  { value: 'afternoon', label: 'Afternoon', hint: '12pm – 5pm' },
  { value: 'evening', label: 'Evening', hint: '5pm – 9pm' },
  { value: 'anytime', label: 'Anytime', hint: 'Flexible' },
] as const;

const INPUT =
  'w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 bg-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/15 transition-all duration-200';
const LABEL = 'block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide';
const ERROR_MSG = 'text-xs text-error mt-1 flex items-center gap-1';

type FormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredContact: 'email' | 'phone' | 'both';
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'anytime';
};

type Errors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Enter a valid email address';
  if (!data.message.trim()) errors.message = 'Message is required';
  else if (data.message.trim().length < 10)
    errors.message = 'Message must be at least 10 characters';
  if (data.phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(data.phone))
    errors.phone = 'Enter a valid phone number';
  return errors;
}

export function InquiryForm({ productId, productName, sellerName }: InquiryFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in ${productName}. Could you please provide more information?`,
    preferredContact: 'email',
    preferredTime: 'anytime',
  });

  // Auto-fill from auth user
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const set = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const blur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validate(formData);
    if (fieldErrors[field]) setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const appendQuickMessage = (msg: string) => {
    setFormData((prev) => ({
      ...prev,
      message: msg,
    }));
    setErrors((prev) => ({ ...prev, message: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = validate(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched({ name: true, email: true, phone: true, message: true });
      return;
    }

    setIsSubmitting(true);
    try {
      await inquiriesApi.submitInquiry({
        productId,
        buyerName: formData.name,
        buyerEmail: formData.email,
        buyerPhone: formData.phone || undefined,
        message: formData.message,
        preferredContact: formData.preferredContact,
        preferredTime: formData.preferredTime,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-2 border-gold/30 rounded-2xl p-8 text-center shadow-lg"
      >
        {/* Animated checkmark ring */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gold to-accent-800 flex items-center justify-center shadow-lg shadow-gold/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Inquiry Sent!</h3>
        <p className="text-neutral-600 mb-1">
          Your message has been sent to{' '}
          <span className="font-semibold text-neutral-800">{sellerName || 'the seller'}</span>.
        </p>
        <p className="text-sm text-neutral-500 mb-6">
          They typically respond within 24 hours. Check your email for updates.
        </p>

        {/* Response time indicators */}
        <div className="flex items-center justify-center gap-6 mb-8 text-sm text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gold" />
            <span>~24h response</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-gold" />
            <span>Secure & private</span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
              email: user?.email || '',
              phone: user?.phone || '',
              message: `Hi, I'm interested in ${productName}. Could you please provide more information?`,
              preferredContact: 'email',
              preferredTime: 'anytime',
            });
            setErrors({});
            setTouched({});
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-neutral-200 text-neutral-600 text-sm font-semibold rounded-xl hover:border-gold hover:text-accent-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Send another inquiry
        </button>
      </motion.div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white border-2 border-neutral-100 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-800 to-accent-900 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                Interested in this listing?
              </h3>
              <p className="text-white/75 text-sm mt-0.5">
                Contact{' '}
                <span className="text-gold font-semibold">{sellerName || 'the seller'}</span>{' '}
                directly
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Shield className="w-3.5 h-3.5 text-gold" />
              <span>Private & secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Clock className="w-3.5 h-3.5 text-gold" />
              <span>Usually responds in 24h</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>No commitment</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick message chips */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Quick message
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => appendQuickMessage(msg)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all duration-150',
                    formData.message === msg
                      ? 'border-gold bg-gold/10 text-accent-800'
                      : 'border-neutral-200 text-neutral-600 hover:border-gold/50 hover:text-accent-800'
                  )}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Name <span className="text-error normal-case tracking-normal">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => blur('name')}
                placeholder="Your full name"
                className={cn(
                  INPUT,
                  touched.name &&
                    errors.name &&
                    'border-error focus:border-error focus:ring-error/15'
                )}
                autoComplete="name"
              />
              {touched.name && errors.name && (
                <p className={ERROR_MSG}>
                  <span>⚠</span> {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email <span className="text-error normal-case tracking-normal">*</span>
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => blur('email')}
                placeholder="you@example.com"
                className={cn(
                  INPUT,
                  touched.email &&
                    errors.email &&
                    'border-error focus:border-error focus:ring-error/15'
                )}
                autoComplete="email"
              />
              {touched.email && errors.email && (
                <p className={ERROR_MSG}>
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={LABEL}>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Phone{' '}
                <span className="text-neutral-400 normal-case font-normal tracking-normal">
                  (optional)
                </span>
              </span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => set('phone', e.target.value)}
              onBlur={() => blur('phone')}
              placeholder="+1 (555) 000-0000"
              className={cn(
                INPUT,
                touched.phone &&
                  errors.phone &&
                  'border-error focus:border-error focus:ring-error/15'
              )}
              autoComplete="tel"
            />
            {touched.phone && errors.phone && (
              <p className={ERROR_MSG}>
                <span>⚠</span> {errors.phone}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className={LABEL}>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Message <span className="text-error normal-case tracking-normal">*</span>
              </span>
            </label>
            <div className="relative">
              <textarea
                value={formData.message}
                onChange={(e) => set('message', e.target.value)}
                onBlur={() => blur('message')}
                rows={4}
                placeholder={`Hi, I'm interested in ${productName}...`}
                className={cn(
                  INPUT,
                  'resize-none pb-6',
                  touched.message &&
                    errors.message &&
                    'border-error focus:border-error focus:ring-error/15'
                )}
              />
              {/* Character counter */}
              <span
                className={cn(
                  'absolute bottom-2 right-3 text-[10px] font-medium',
                  formData.message.length > 500 ? 'text-error' : 'text-neutral-400'
                )}
              >
                {formData.message.length}/500
              </span>
            </div>
            {touched.message && errors.message && (
              <p className={ERROR_MSG}>
                <span>⚠</span> {errors.message}
              </p>
            )}
          </div>

          {/* Advanced preferences toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-accent-800 font-medium transition-colors"
            >
              <motion.span
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
              {showAdvanced ? 'Hide' : 'Show'} preferences
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-4">
                    {/* Preferred contact method */}
                    <div>
                      <label className={LABEL}>Preferred contact method</label>
                      <div className="flex gap-2">
                        {PREFERRED_CONTACT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set('preferredContact', opt.value)}
                            className={cn(
                              'flex-1 py-2.5 px-3 border-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                              formData.preferredContact === opt.value
                                ? 'border-gold bg-gold/10 text-accent-800'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                            )}
                          >
                            <span>{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preferred time */}
                    <div>
                      <label className={LABEL}>Best time to contact</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PREFERRED_TIME_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set('preferredTime', opt.value)}
                            className={cn(
                              'py-2.5 px-3 border-2 rounded-xl transition-all text-left',
                              formData.preferredTime === opt.value
                                ? 'border-gold bg-gold/10'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                          >
                            <p
                              className={cn(
                                'text-sm font-semibold',
                                formData.preferredTime === opt.value
                                  ? 'text-accent-800'
                                  : 'text-neutral-700'
                              )}
                            >
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">{opt.hint}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting || formData.message.length > 500}
            whileHover={!isSubmitting ? { scale: 1.01 } : {}}
            whileTap={!isSubmitting ? { scale: 0.99 } : {}}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg',
              isSubmitting
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-accent-800 to-accent-900 text-white hover:from-gold hover:to-accent-600 hover:text-black shadow-accent-800/25'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending inquiry…
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Inquiry
              </>
            )}
          </motion.button>

          {/* Footer note */}
          <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
            By submitting, you agree to our{' '}
            <a href="/privacy" className="underline hover:text-neutral-600">
              Privacy Policy
            </a>
            . Your contact details are only shared with the seller.
          </p>
        </div>
      </div>
    </form>
  );
}
