'use client';

/**
 * Delivery Type Selector Component
 * Allows customers to choose between shipping or self-pickup
 * v2.10.0 - Self-Pickup Feature
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, CheckCircle } from 'lucide-react';
import { cn } from '@nextpik/ui';

export type DeliveryType = 'shipping' | 'pickup';

interface DeliveryTypeSelectorProps {
  selectedType?: DeliveryType;
  onSelect: (type: DeliveryType) => void;
  onContinue: () => void;
  pickupAvailable?: boolean;
  pickupStoresCount?: number;
  isLoading?: boolean;
}

export function DeliveryTypeSelector({
  selectedType = 'shipping',
  onSelect,
  onContinue,
  pickupAvailable = true,
  pickupStoresCount = 0,
  isLoading = false,
}: DeliveryTypeSelectorProps) {
  const [selected, setSelected] = useState<DeliveryType>(selectedType);

  const handleSelect = (type: DeliveryType) => {
    setSelected(type);
    onSelect(type);
  };

  const handleContinue = () => {
    if (selected) {
      onContinue();
    }
  };

  const deliveryOptions = [
    {
      type: 'shipping' as DeliveryType,
      icon: Truck,
      title: 'Ship to Address',
      description: 'We will deliver your order to your specified address',
      benefits: [
        'Multiple shipping speeds available',
        'Track your delivery',
        'Delivered to your door',
      ],
      available: true,
    },
    {
      type: 'pickup' as DeliveryType,
      icon: MapPin,
      title: 'Self-Pickup',
      description:
        pickupStoresCount > 0
          ? `Pick up from ${pickupStoresCount} available ${pickupStoresCount === 1 ? 'location' : 'locations'}`
          : 'Pick up from store location',
      benefits: ['No shipping cost', 'Pick up when ready', 'Instant availability'],
      available: pickupAvailable,
      badge: pickupAvailable ? 'FREE' : 'UNAVAILABLE',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-serif font-semibold mb-2">
          How would you like to receive your order?
        </h3>
        <p className="text-sm text-neutral-600">Choose your preferred delivery method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveryOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selected === option.type;
          const isDisabled = !option.available || isLoading;

          return (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <label
                className={cn(
                  'block cursor-pointer group relative',
                  isDisabled && 'cursor-not-allowed opacity-60'
                )}
              >
                <input
                  type="radio"
                  name="delivery-type"
                  value={option.type}
                  checked={isSelected}
                  onChange={() => !isDisabled && handleSelect(option.type)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <motion.div
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  className={cn(
                    'relative p-6 rounded-xl border-2 transition-all duration-300 h-full',
                    isSelected
                      ? 'border-gold bg-gradient-to-br from-gold/5 to-transparent shadow-lg'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white',
                    isDisabled && 'bg-neutral-50'
                  )}
                >
                  {/* Badge */}
                  {option.badge && (
                    <div
                      className={cn(
                        'absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold',
                        option.available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-200 text-neutral-600'
                      )}
                    >
                      {option.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300',
                      isSelected
                        ? 'bg-gold/10 text-gold'
                        : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                    )}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-black text-lg mb-1">{option.title}</h4>
                      <p className="text-sm text-neutral-600">{option.description}</p>
                    </div>

                    {/* Benefits */}
                    <ul className="space-y-2">
                      {option.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                          <CheckCircle
                            className={cn(
                              'w-4 h-4 flex-shrink-0 mt-0.5',
                              isSelected ? 'text-gold' : 'text-neutral-400'
                            )}
                          />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Radio Indicator */}
                  <div className="absolute bottom-4 right-4">
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
                </motion.div>
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="flex gap-4 pt-4">
        <motion.button
          type="button"
          onClick={handleContinue}
          disabled={isLoading || !selected || (selected === 'pickup' && !pickupAvailable)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              Continue
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
