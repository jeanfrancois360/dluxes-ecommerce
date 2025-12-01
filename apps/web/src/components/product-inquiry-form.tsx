'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductInquiryFormProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductInquiryForm({
  productId,
  productName,
  onSuccess,
  onCancel
}: ProductInquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `I am interested in ${productName}. Please provide more details.`,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: `I am interested in ${productName}. Please provide more details.`,
        });

        // Call onSuccess callback after a short delay
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border-2 border-gold/20 shadow-xl p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-serif text-2xl font-bold text-black mb-2">
          Contact About This Product
        </h3>
        <p className="text-neutral-600 text-sm">
          Fill out the form below and we'll get back to you as soon as possible.
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
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-green-900 mb-1">Inquiry Submitted!</h4>
                <p className="text-sm text-green-800">
                  Thank you for your interest. We'll contact you shortly with more information.
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
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-black mb-2">
            Your Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={100}
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
            placeholder="John Doe"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
            placeholder="john@example.com"
          />
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-black mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            maxLength={20}
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-bold text-black mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={1000}
            rows={5}
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all resize-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
            placeholder="Please let me know more about this product..."
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
            className="flex-1 py-4 px-6 bg-gradient-to-r from-gold to-accent-700 text-black font-bold rounded-xl hover:from-black hover:to-neutral-800 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Submit Inquiry
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
          <svg className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            By submitting this form, you agree to be contacted by our team regarding this product.
            We typically respond within 24 hours.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
