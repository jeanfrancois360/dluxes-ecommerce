'use client';

/**
 * Confirm Pickup Modal
 * Modal for verifying pickup code and confirming customer picked up order
 * v2.10.0 - Self-Pickup Feature
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { sellerAPI } from '@/lib/api/seller';
import { toast } from 'sonner';

interface ConfirmPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  expectedPickupCode: string;
  storeName: string;
  onSuccess?: () => void;
}

export function ConfirmPickupModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  expectedPickupCode,
  storeName,
  onSuccess,
}: ConfirmPickupModalProps) {
  const [pickupCode, setPickupCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate pickup code
    if (!pickupCode || pickupCode.length !== 6) {
      setError('Please enter a 6-digit pickup code');
      return;
    }

    if (pickupCode !== expectedPickupCode) {
      setError('Invalid pickup code. Please verify with the customer.');
      return;
    }

    try {
      setIsSubmitting(true);

      await sellerAPI.confirmPickup(orderId, pickupCode, notes || undefined);

      toast.success('Pickup confirmed successfully!');

      // Reset form
      setPickupCode('');
      setNotes('');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (err: any) {
      console.error('Failed to confirm pickup:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm pickup';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPickupCode('');
      setNotes('');
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Confirm Pickup</h2>
                        <p className="text-sm text-green-100">Order #{orderNumber}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Verify customer's pickup code</p>
                    <p>
                      Ask the customer to show their 6-digit pickup code. This confirms they are
                      authorized to collect the order.
                    </p>
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Pickup Code Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Customer's Pickup Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pickupCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPickupCode(value);
                      setError(null);
                    }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-wider border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-neutral-500 text-center">
                    Expected: <span className="font-mono font-semibold">{expectedPickupCode}</span>
                  </p>
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Notes <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Customer showed ID, items checked"
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  />
                </div>

                {/* Store Info */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">Store:</span> {storeName}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !pickupCode || pickupCode.length !== 6}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Pickup
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
