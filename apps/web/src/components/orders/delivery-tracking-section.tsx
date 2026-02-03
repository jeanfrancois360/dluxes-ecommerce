'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { toast, standardToasts } from '@/lib/utils/toast';
import axios from 'axios';

interface DeliveryProvider {
  id: string;
  name: string;
  slug: string;
  type: string;
  website?: string;
}

interface Delivery {
  id: string;
  trackingNumber?: string;
  trackingUrl?: string;
  currentStatus: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  buyerConfirmed?: boolean;
  buyerConfirmedAt?: string;
  proofOfDeliveryUrl?: string;
  provider?: DeliveryProvider;
  deliveryFee: number;
}

interface DeliveryTrackingSectionProps {
  delivery: Delivery;
}

const DELIVERY_STATUS_CONFIG = {
  PENDING_PICKUP: {
    label: 'Pending Pickup',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Your order is awaiting pickup from the seller',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  PICKUP_SCHEDULED: {
    label: 'Pickup Scheduled',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Pickup has been scheduled with the carrier',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  PICKED_UP: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Package has been picked up from the seller',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: 'bg-[#CBB57B]/20 text-[#8B7355] border-[#CBB57B]',
    description: 'Package is on the way to you',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    description: 'Package is out for delivery today',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700 border-green-200',
    description: 'Package has been delivered',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  FAILED_DELIVERY: {
    label: 'Delivery Failed',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Delivery attempt failed',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  RETURNED: {
    label: 'Returned',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Package has been returned to sender',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Delivery has been cancelled',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export function DeliveryTrackingSection({ delivery }: DeliveryTrackingSectionProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [localDelivery, setLocalDelivery] = useState(delivery);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const statusConfig = DELIVERY_STATUS_CONFIG[localDelivery.currentStatus as keyof typeof DELIVERY_STATUS_CONFIG] || DELIVERY_STATUS_CONFIG.PENDING_PICKUP;

  const handleConfirmDelivery = async () => {
    try {
      setConfirming(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/deliveries/${localDelivery.id}/buyer-confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Thank you for confirming receipt of your order');
        setLocalDelivery({
          ...localDelivery,
          buyerConfirmed: true,
          buyerConfirmedAt: new Date().toISOString(),
        });
        setShowConfirmModal(false);
      }
    } catch (error: any) {
      toast.error('Error', error.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
  };

  const canConfirm = localDelivery.currentStatus === 'DELIVERED' && !localDelivery.buyerConfirmed;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold font-['Poppins'] text-gray-900">Delivery Tracking</h3>
          <p className="text-sm text-gray-600">Track your package in real-time</p>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${statusConfig.color}`}>
              {statusConfig.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Status</p>
              <p className="font-semibold text-lg">{statusConfig.label}</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">{statusConfig.description}</p>
      </div>

      {/* Tracking Number */}
      {delivery.trackingNumber && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Tracking Number</p>
          <div className="flex items-center justify-between">
            <code className="font-mono text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
              {delivery.trackingNumber}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(delivery.trackingNumber!);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy tracking number"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Carrier Information */}
      {delivery.provider && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Carrier</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{delivery.provider.name}</p>
              {delivery.provider.website && (
                <a
                  href={delivery.provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-1"
                >
                  Visit carrier website
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expected Delivery Date */}
      {delivery.expectedDeliveryDate && !delivery.deliveredAt && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Expected Delivery</p>
          <p className="font-semibold text-gray-900">
            {new Date(delivery.expectedDeliveryDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      )}

      {/* Delivered Date */}
      {localDelivery.deliveredAt && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 mb-2">Delivered On</p>
          <p className="font-semibold text-green-900">
            {new Date(localDelivery.deliveredAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Buyer Confirmation Status */}
      {localDelivery.buyerConfirmed && localDelivery.buyerConfirmedAt && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-900">Delivery Confirmed</p>
              <p className="text-sm text-green-700">
                You confirmed receipt on {new Date(localDelivery.buyerConfirmedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery */}
      {localDelivery.proofOfDeliveryUrl && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Proof of Delivery</p>
          <a
            href={localDelivery.proofOfDeliveryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Proof of Delivery
          </a>
        </div>
      )}

      {/* Confirm Delivery Button */}
      {canConfirm && (
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/40 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mark as Received
        </button>
      )}

      {/* Track Package Button */}
      {localDelivery.trackingNumber && (
        <Link
          href={`/track/${localDelivery.trackingNumber}`}
          className="w-full block text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
        >
          View Full Tracking Details
        </Link>
      )}
    </motion.div>

    {/* Confirmation Modal */}
    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Confirm Delivery</h3>
              <p className="text-gray-600">
                Please confirm that you have received your order in good condition.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will release the payment to the seller.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={confirming}
                className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? 'Confirming...' : 'Yes, Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
