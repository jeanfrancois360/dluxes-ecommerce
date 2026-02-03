'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Mail, Phone, MessageSquare, Check } from 'lucide-react';

interface RealEstateInquiryFormProps {
  productId: string;
  productName: string;
  productType?: string; // house, apartment, etc.
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RealEstateInquiryForm({
  productId,
  productName,
  productType = 'property',
  onSuccess,
  onCancel,
}: RealEstateInquiryFormProps) {
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    message: `I am interested in this ${productType}. Please provide more information about pricing, availability, and viewing options.`,
    preferredContact: 'email',
    preferredTime: 'anytime',
    scheduledViewing: '',
    preApproved: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setFormData({
          buyerName: '',
          buyerEmail: '',
          buyerPhone: '',
          message: `I am interested in this ${productType}. Please provide more information about pricing, availability, and viewing options.`,
          preferredContact: 'email',
          preferredTime: 'anytime',
          scheduledViewing: '',
          preApproved: false,
        });

        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('An error occurred. Please try again later.');
      console.error('Inquiry submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Get minimum date for viewing (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border-2 border-blue-200 shadow-xl p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-black">
              Schedule a Viewing
            </h3>
            <p className="text-sm text-neutral-600">{productName}</p>
          </div>
        </div>
        <p className="text-neutral-600 text-sm">
          Complete the form below and our agent will contact you to arrange a viewing
          or provide additional information.
        </p>
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-green-900 mb-1">Inquiry Submitted!</h4>
                <p className="text-sm text-green-800">
                  Thank you for your interest. Our agent will contact you within 24
                  hours to discuss this property.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-bold text-red-900 mb-1">Submission Failed</h4>
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="buyerName"
              className="block text-sm font-bold text-black mb-2"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="buyerName"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="buyerPhone"
              className="block text-sm font-bold text-black mb-2"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="tel"
                id="buyerPhone"
                name="buyerPhone"
                value={formData.buyerPhone}
                onChange={handleChange}
                maxLength={20}
                disabled={isSubmitting || submitStatus === 'success'}
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="buyerEmail"
            className="block text-sm font-bold text-black mb-2"
          >
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="email"
              id="buyerEmail"
              name="buyerEmail"
              value={formData.buyerEmail}
              onChange={handleChange}
              required
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
              placeholder="john@example.com"
            />
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Preferred Contact Method
            </label>
            <div className="flex gap-2">
              {[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
                { value: 'both', label: 'Both' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex-1 px-4 py-2 text-center rounded-lg cursor-pointer border-2 transition-all ${
                    formData.preferredContact === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-neutral-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredContact"
                    value={option.value}
                    checked={formData.preferredContact === option.value}
                    onChange={handleChange}
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Best Time to Reach You
            </label>
            <select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
            >
              <option value="anytime">Anytime</option>
              <option value="morning">Morning (9am - 12pm)</option>
              <option value="afternoon">Afternoon (12pm - 5pm)</option>
              <option value="evening">Evening (5pm - 8pm)</option>
            </select>
          </div>
        </div>

        {/* Viewing Date */}
        <div>
          <label
            htmlFor="scheduledViewing"
            className="block text-sm font-bold text-black mb-2"
          >
            <Calendar className="inline w-4 h-4 mr-1" />
            Preferred Viewing Date (Optional)
          </label>
          <input
            type="date"
            id="scheduledViewing"
            name="scheduledViewing"
            value={formData.scheduledViewing}
            onChange={handleChange}
            min={getMinDate()}
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Select a preferred date and we'll confirm availability
          </p>
        </div>

        {/* Pre-approved Checkbox */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="preApproved"
              checked={formData.preApproved}
              onChange={handleChange}
              disabled={isSubmitting || submitStatus === 'success'}
              className="mt-1 w-5 h-5 text-blue-600 border-2 border-neutral-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-blue-900">
                I am pre-approved for mortgage financing
              </span>
              <p className="text-xs text-blue-700 mt-0.5">
                This helps us better assist you with the purchase process
              </p>
            </div>
          </label>
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-bold text-black mb-2"
          >
            <MessageSquare className="inline w-4 h-4 mr-1" />
            Additional Questions or Comments *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
            placeholder="Tell us about your requirements, timeline, or any specific questions..."
          />
          <p className="text-xs text-neutral-500 mt-2">
            {formData.message.length}/1000 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Request Property Information
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-4 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl hover:border-black hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Info Footer */}
      <div className="mt-6 pt-6 border-t-2 border-neutral-100">
        <div className="flex items-start gap-3 text-sm text-neutral-600">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            Your information is kept confidential. Our team will reach out within 24
            hours to discuss this property.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
