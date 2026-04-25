'use client';

/**
 * Pickup Store Selector Component
 * Allows customers to choose which store to pick up their order from
 * v2.10.0 - Self-Pickup Feature
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Store, Clock, CheckCircle, Phone, Navigation } from 'lucide-react';
import { cn } from '@nextpik/ui';

export interface PickupStore {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
  pickupHours?: Record<string, string> | null;
  pickupEstimatedMinutes?: number | null;
}

interface PickupStoreSelectorProps {
  stores: PickupStore[];
  selectedStoreId?: string | null;
  onSelect: (storeId: string) => void;
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function PickupStoreSelector({
  stores,
  selectedStoreId,
  onSelect,
  onContinue,
  onBack,
  isLoading = false,
}: PickupStoreSelectorProps) {
  const [selected, setSelected] = useState<string | null>(selectedStoreId || null);

  const handleSelect = (storeId: string) => {
    setSelected(storeId);
    onSelect(storeId);
  };

  const handleContinue = () => {
    if (selected) {
      onContinue();
    }
  };

  if (stores.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm"
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-black mb-2">No Pickup Locations Available</h3>
          <p className="text-sm text-neutral-600 mb-6">
            Self-pickup is not available for the items in your cart at this time.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300 transition-colors"
            >
              Choose Shipping Instead
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-serif font-semibold mb-2">Choose Pickup Location</h3>
        <p className="text-sm text-neutral-600">
          Select a store to pick up your order from. You'll receive a pickup code once your order is
          ready.
        </p>
      </div>

      <div className="space-y-4">
        {stores.map((store, index) => {
          const isSelected = selected === store.id;
          const fullAddress =
            store.pickupAddress ||
            [store.address, store.city, store.state, store.zipCode].filter(Boolean).join(', ');

          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <label
                className={cn(
                  'block cursor-pointer group',
                  isLoading && 'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  type="radio"
                  name="pickup-store"
                  value={store.id}
                  checked={isSelected}
                  onChange={() => handleSelect(store.id)}
                  disabled={isLoading}
                  className="sr-only"
                />
                <motion.div
                  whileHover={!isLoading ? { scale: 1.01 } : {}}
                  whileTap={!isLoading ? { scale: 0.99 } : {}}
                  className={cn(
                    'relative p-6 rounded-xl border-2 transition-all duration-300',
                    isSelected
                      ? 'border-gold bg-gradient-to-br from-gold/5 to-transparent shadow-lg'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Radio Indicator */}
                    <div className="flex-shrink-0 pt-1">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                          isSelected
                            ? 'border-gold bg-gold'
                            : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 rounded-full bg-white"
                          />
                        )}
                      </div>
                    </div>

                    {/* Store Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300',
                        isSelected
                          ? 'bg-gold/10 text-gold'
                          : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                      )}
                    >
                      <Store className="w-6 h-6" />
                    </div>

                    {/* Store Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-black text-lg mb-2">{store.name}</h4>

                      {/* Address */}
                      {fullAddress && (
                        <div className="flex items-start gap-2 text-sm text-neutral-600 mb-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-400" />
                          <span>{fullAddress}</span>
                        </div>
                      )}

                      {/* Phone */}
                      {store.phone && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                          <Phone className="w-4 h-4 text-neutral-400" />
                          <span>{store.phone}</span>
                        </div>
                      )}

                      {/* Estimated Pickup Time */}
                      {store.pickupEstimatedMinutes && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span>
                            Ready in approximately {store.pickupEstimatedMinutes} minutes after
                            order confirmation
                          </span>
                        </div>
                      )}

                      {/* Pickup Instructions */}
                      {store.pickupInstructions && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            Pickup Instructions:
                          </p>
                          <p className="text-xs text-blue-700">{store.pickupInstructions}</p>
                        </div>
                      )}

                      {/* Pickup Hours */}
                      {store.pickupHours && Object.keys(store.pickupHours).length > 0 && (
                        <div className="mt-3">
                          <details className="group">
                            <summary className="text-xs font-medium text-neutral-700 cursor-pointer hover:text-black transition-colors">
                              View Pickup Hours
                            </summary>
                            <div className="mt-2 space-y-1 pl-4">
                              {Object.entries(store.pickupHours).map(([day, hours]) => (
                                <div key={day} className="flex justify-between text-xs">
                                  <span className="text-neutral-600 capitalize">{day}:</span>
                                  <span className="text-neutral-800 font-medium">{hours}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {/* Selected Badge */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex-shrink-0"
                      >
                        <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"
      >
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-green-900 font-medium mb-1">Free Self-Pickup</p>
          <p className="text-green-700">
            No shipping charges apply. You'll receive a 6-digit pickup code once your order is ready
            for collection.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {onBack && (
          <motion.button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={handleContinue}
          disabled={isLoading || !selected}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
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
              Processing...
            </>
          ) : (
            <>
              Continue to Payment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
