'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@luxury/ui';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
}: CartDrawerProps) {
  const router = useRouter();
  const { items, totals, updateQuantity, removeItem } = useCart();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      await updateQuantity(id, quantity);
    } catch (error) {
      toast.error('Error', 'Failed to update quantity');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeItem(id);
      toast.success('Removed', 'Item removed from cart');
    } catch (error) {
      toast.error('Error', 'Failed to remove item');
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-black">Shopping Bag</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto p-6">
              {items.length === 0 ? (
                <EmptyCart onClose={onClose} />
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemComponent
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}

              {/* Free Shipping Indicator */}
              {items.length > 0 && totals.shipping > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-accent-50 border border-accent-200 rounded-lg"
                >
                  <p className="text-sm text-neutral-700">
                    Add <strong className="text-black">${formatCurrencyAmount(200 - (totals.subtotal || 0), 2)}</strong> more for <strong className="text-gold">free shipping</strong>
                  </p>
                  <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(totals.subtotal / 200) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-gold to-accent-600"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-neutral-200 p-6 space-y-4">
                {/* Promo Code */}
                <PromoCodeInput />

                {/* Summary */}
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="text-black">${formatCurrencyAmount(totals.subtotal || 0, 2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Shipping</span>
                    <span className="text-black">
                      {(totals.shipping || 0) === 0 ? 'Free' : `$${formatCurrencyAmount(totals.shipping || 0, 2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Tax</span>
                    <span className="text-black">${formatCurrencyAmount(totals.tax || 0, 2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-serif font-bold pt-2 border-t border-neutral-200">
                    <span>Total</span>
                    <span className="text-gold">${formatCurrencyAmount(totals.total || 0, 2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </motion.button>

                {/* Security Badge */}
                <p className="text-xs text-center text-neutral-500 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure checkout with SSL encryption
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Cart Item Component
function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: any;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onRemove?.(item.id);
        }
      }}
      style={{ x, opacity }}
      className="flex gap-4 p-4 bg-white rounded-lg border border-neutral-200 hover:border-gold transition-colors"
    >
      {/* Image */}
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.brand && (
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">{item.brand}</p>
        )}
        <h4 className="font-medium text-black truncate">{item.name}</h4>
        {item.sku && (
          <p className="text-xs text-neutral-500 mt-1">SKU: {item.sku}</p>
        )}
        <p className="text-gold font-serif mt-2">${formatCurrencyAmount(item.price || 0, 2)}</p>
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col items-end justify-between">
        {/* Quantity Adjuster */}
        <div className="flex items-center gap-2 bg-neutral-100 rounded-full p-1">
          <button
            onClick={() => onUpdateQuantity?.(item.id, Math.max(0, item.quantity - 1))}
            className="w-7 h-7 rounded-full hover:bg-white transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-full hover:bg-white transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove?.(item.id)}
          className="text-neutral-400 hover:text-error-DEFAULT transition-colors text-xs flex items-center gap-1 mt-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>
    </motion.div>
  );
}

// Empty Cart State
function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-32 h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-serif font-bold text-black mb-2">Your bag is empty</h3>
      <p className="text-neutral-600 text-center mb-6">
        Looks like you haven't added anything yet
      </p>
      <button
        onClick={onClose}
        className="px-8 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
      >
        Continue Shopping
      </button>
    </div>
  );
}

// Promo Code Input
function PromoCodeInput() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (code) {
      setApplied(true);
      // Handle promo code application
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Have a promo code?
        </span>
        <svg
          className={cn('w-5 h-5 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-200"
          >
            <div className="p-4 flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-gold"
              />
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
            {applied && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pb-4 flex items-center gap-2 text-success-DEFAULT text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Code "{code}" applied successfully!
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
