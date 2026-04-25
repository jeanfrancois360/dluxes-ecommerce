'use client';

/**
 * Pickup Tracking Card Component
 * Displays pickup order details for customers
 * v2.10.0 - Self-Pickup Feature
 */

import { motion } from 'framer-motion';
import { MapPin, Store, Clock, CheckCircle, Phone, Navigation, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@nextpik/ui';

interface PickupTrackingCardProps {
  pickupCode: string;
  orderStatus: string;
  storeName: string;
  storeAddress?: string | null;
  storeCity?: string | null;
  storeState?: string | null;
  storeZipCode?: string | null;
  storePhone?: string | null;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
  pickupHours?: Record<string, string> | null;
  pickupScheduledAt?: string | null;
  pickupCompletedAt?: string | null;
}

export function PickupTrackingCard({
  pickupCode,
  orderStatus,
  storeName,
  storeAddress,
  storeCity,
  storeState,
  storeZipCode,
  storePhone,
  pickupAddress,
  pickupInstructions,
  pickupHours,
  pickupScheduledAt,
  pickupCompletedAt,
}: PickupTrackingCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pickupCode);
    setCopied(true);
    toast.success('Pickup code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const fullAddress =
    pickupAddress || [storeAddress, storeCity, storeState, storeZipCode].filter(Boolean).join(', ');

  // Determine status message and color
  const getStatusInfo = () => {
    switch (orderStatus.toUpperCase()) {
      case 'PENDING':
      case 'CONFIRMED':
      case 'PROCESSING':
        return {
          title: 'Preparing Your Order',
          description: "Your order is being prepared. We'll notify you when it's ready for pickup.",
          color: 'yellow',
          icon: Clock,
        };
      case 'READY_FOR_PICKUP':
        return {
          title: 'Ready for Pickup!',
          description:
            'Your order is ready! Show your pickup code at the store to collect your items.',
          color: 'green',
          icon: CheckCircle,
        };
      case 'PICKED_UP':
        return {
          title: 'Order Completed',
          description: pickupCompletedAt
            ? `Picked up on ${new Date(pickupCompletedAt).toLocaleDateString()} at ${new Date(pickupCompletedAt).toLocaleTimeString()}`
            : 'Thank you for your order!',
          color: 'blue',
          icon: CheckCircle,
        };
      case 'PICKUP_EXPIRED':
        return {
          title: 'Pickup Window Expired',
          description: 'The pickup window for this order has expired. Please contact the store.',
          color: 'red',
          icon: Clock,
        };
      case 'CANCELLED':
        return {
          title: 'Order Cancelled',
          description: 'This order has been cancelled.',
          color: 'neutral',
          icon: CheckCircle,
        };
      default:
        return {
          title: 'Order Status',
          description: `Status: ${orderStatus}`,
          color: 'neutral',
          icon: Store,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const statusColorClasses = {
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-900',
      desc: 'text-yellow-700',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900',
      desc: 'text-green-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      desc: 'text-blue-700',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      desc: 'text-red-700',
    },
    neutral: {
      bg: 'bg-neutral-50',
      border: 'border-neutral-200',
      icon: 'text-neutral-600',
      text: 'text-neutral-900',
      desc: 'text-neutral-700',
    },
  };

  const colors = statusColorClasses[statusInfo.color as keyof typeof statusColorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Self-Pickup Order</h3>
            <p className="text-sm text-green-100">Collect your order from the store</p>
          </div>
        </div>

        {/* Pickup Code */}
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs font-medium text-neutral-600 mb-2">YOUR PICKUP CODE</p>
          <div className="flex items-center justify-between">
            <p className="text-4xl font-bold text-green-600 tracking-widest">{pickupCode}</p>
            <button
              onClick={handleCopyCode}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              title="Copy pickup code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-neutral-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Show this code at the store to collect your order
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Banner */}
        <div className={cn('p-4 rounded-lg border flex gap-3', colors.bg, colors.border)}>
          <StatusIcon className={cn('w-6 h-6 flex-shrink-0 mt-0.5', colors.icon)} />
          <div>
            <h4 className={cn('font-semibold mb-1', colors.text)}>{statusInfo.title}</h4>
            <p className={cn('text-sm', colors.desc)}>{statusInfo.description}</p>
          </div>
        </div>

        {/* Store Information */}
        <div>
          <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-neutral-600" />
            Pickup Location
          </h4>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="font-medium text-black">{storeName}</p>
            </div>

            {fullAddress && (
              <div className="flex items-start gap-2 text-sm text-neutral-700">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-400" />
                <p>{fullAddress}</p>
              </div>
            )}

            {storePhone && (
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Phone className="w-4 h-4 text-neutral-400" />
                <a href={`tel:${storePhone}`} className="hover:text-green-600 transition-colors">
                  {storePhone}
                </a>
              </div>
            )}

            {fullAddress && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            )}
          </div>
        </div>

        {/* Pickup Instructions */}
        {pickupInstructions && (
          <div>
            <h4 className="font-semibold text-black mb-3">Pickup Instructions</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">{pickupInstructions}</p>
            </div>
          </div>
        )}

        {/* Pickup Hours */}
        {pickupHours && Object.keys(pickupHours).length > 0 && (
          <div>
            <h4 className="font-semibold text-black mb-3">Pickup Hours</h4>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(pickupHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-neutral-600 capitalize">{day}:</span>
                    <span className="text-neutral-900 font-medium">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Pickup */}
        {pickupScheduledAt && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 mb-1">Scheduled Pickup Time</p>
              <p className="text-amber-700">
                {new Date(pickupScheduledAt).toLocaleDateString()} at{' '}
                {new Date(pickupScheduledAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* What to Bring */}
        <div className="bg-gradient-to-br from-gold/5 to-neutral-50 border-2 border-gold/20 rounded-lg p-4">
          <h4 className="font-semibold text-black mb-3">What to Bring</h4>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <span>Your 6-digit pickup code (shown above)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <span>Valid photo ID for verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <span>Order confirmation email (optional)</span>
            </li>
          </ul>
        </div>

        {/* Help Text */}
        <div className="text-center pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            Need help?{' '}
            {storePhone ? (
              <a
                href={`tel:${storePhone}`}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Contact the store
              </a>
            ) : (
              <span className="text-green-600 font-medium">Contact customer support</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
