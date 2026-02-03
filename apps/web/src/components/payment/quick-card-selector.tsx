/**
 * Quick Card Selector Component
 * Horizontal scrollable card selector for fast payment method selection
 */

'use client';

import { motion } from 'framer-motion';
import { CardBrandLogo } from './card-brand-logo';
import { CardExpiryBadge } from './card-expiry-badge';
import type { SavedPaymentMethod } from '@/lib/api/payment-methods';
import { cn } from '@nextpik/ui';

interface QuickCardSelectorProps {
  cards: SavedPaymentMethod[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  onAddNewCard: () => void;
  isLoading?: boolean;
}

export function QuickCardSelector({
  cards,
  selectedCardId,
  onSelectCard,
  onAddNewCard,
  isLoading = false,
}: QuickCardSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-64 h-32 bg-neutral-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <motion.button
        onClick={onAddNewCard}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full p-6 border-2 border-dashed border-neutral-300 rounded-xl hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2 text-neutral-600 hover:text-blue-600"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="font-medium">Add Your First Card</span>
        <span className="text-sm text-neutral-500">Save cards for faster checkout</span>
      </motion.button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Quick Select</h3>
        <button
          onClick={onAddNewCard}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => onSelectCard(card.id)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex-shrink-0 w-64 p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden',
              selectedCardId === card.id
                ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                : 'border-neutral-200 hover:border-blue-300 bg-white hover:shadow-md'
            )}
          >
            {/* Selected Indicator */}
            {selectedCardId === card.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <CardBrandLogo brand={card.brand} size="sm" />
              <div className="flex-1 min-w-0">
                {card.nickname ? (
                  <p className="font-semibold text-neutral-900 truncate">{card.nickname}</p>
                ) : (
                  <p className="font-medium text-neutral-700">
                    {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} Card
                  </p>
                )}
                <p className="text-sm text-neutral-600">•••• {card.last4}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
              </span>
              {card.isDefault && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Default
                </span>
              )}
            </div>

            {/* Expiry Warning */}
            <div className="mt-2">
              <CardExpiryBadge expMonth={card.expMonth} expYear={card.expYear} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Scroll Hint */}
      {cards.length > 2 && (
        <p className="text-xs text-center text-neutral-400 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Scroll to see more cards
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </p>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default QuickCardSelector;
