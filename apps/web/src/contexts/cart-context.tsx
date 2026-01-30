'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useCurrencyConverter, useSelectedCurrency } from '@/hooks/use-currency';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  brand?: string;
  image: string;
  price: number;
  priceAtAdd?: number; // 🔒 Locked price when item was added
  currencyAtAdd?: string; // 🔒 Currency when item was added
  quantity: number;
  sku?: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  totals: CartTotals;
  isLoading: boolean;
  error: string | null;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  taxCalculationMode: 'disabled' | 'simple' | 'by_state';
  taxRate: number;
  cartCurrency: string; // Currency locked in cart
  isCurrencyLocked: boolean; // 🔒 Is currency locked (cart has items)
  exchangeRate: number; // 🔒 Locked exchange rate
  rateLockedAt: string | null; // 🔒 When rate was locked
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  handleCurrencyChange: (newCurrency: string) => Promise<{ allowed: boolean; message?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Default shipping cost constants (fallback if settings not loaded)
const DEFAULT_FREE_SHIPPING_THRESHOLD = 200;
const DEFAULT_STANDARD_SHIPPING_COST = 10;

// Tax rate fallback (10% flat rate) - KEPT FOR BACKWARDS COMPATIBILITY
const TAX_RATE_FALLBACK = 0.1;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartCurrency, setCartCurrency] = useState<string>('USD'); // Cart's locked currency

  // 🔒 Currency Locking State
  const [isCurrencyLocked, setIsCurrencyLocked] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [rateLockedAt, setRateLockedAt] = useState<string | null>(null);

  // Currency conversion hooks
  const { convertPrice } = useCurrencyConverter();
  const { selectedCurrency, setSelectedCurrency } = useSelectedCurrency();

  // Shipping settings from backend (stored in USD)
  const [freeShippingEnabled, setFreeShippingEnabled] = useState<boolean>(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [standardShippingCost, setStandardShippingCost] = useState<number>(DEFAULT_STANDARD_SHIPPING_COST);

  // Tax settings from backend (uses new tax_calculation_mode)
  const [taxCalculationMode, setTaxCalculationMode] = useState<'disabled' | 'simple' | 'by_state'>('disabled');
  const [taxRate, setTaxRate] = useState<number>(0);

  // Fetch settings from backend
  useEffect(() => {
    const fetchCartSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/public`);
        const settings = response.data?.data || response.data;

        // ===== SHIPPING SETTINGS =====
        const freeShippingEnabledSetting = settings.find((s: any) => s.key === 'free_shipping_enabled');
        const freeShippingThresholdSetting = settings.find((s: any) => s.key === 'free_shipping_threshold');
        const standardShippingRateSetting = settings.find((s: any) => s.key === 'shipping_standard_rate');

        if (freeShippingEnabledSetting) {
          setFreeShippingEnabled(freeShippingEnabledSetting.value === true || freeShippingEnabledSetting.value === 'true');
        }

        if (freeShippingThresholdSetting) {
          setFreeShippingThreshold(Number(freeShippingThresholdSetting.value));
        }

        if (standardShippingRateSetting) {
          setStandardShippingCost(Number(standardShippingRateSetting.value));
        }

        // ===== TAX SETTINGS (UPDATED to use tax_calculation_mode) =====
        const taxModeSetting = settings.find((s: any) => s.key === 'tax_calculation_mode');
        const taxDefaultRateSetting = settings.find((s: any) => s.key === 'tax_default_rate');

        // Set tax calculation mode
        const mode = taxModeSetting?.value || 'disabled';
        setTaxCalculationMode(mode as 'disabled' | 'simple' | 'by_state');

        // Set tax rate based on mode
        if (mode === 'simple' && taxDefaultRateSetting) {
          setTaxRate(Number(taxDefaultRateSetting.value));
          console.log('[Cart] Tax mode: simple, rate:', Number(taxDefaultRateSetting.value));
        } else if (mode === 'by_state') {
          // For by_state mode, show estimated tax (or calculate at checkout)
          setTaxRate(0); // Will show "Calculated at checkout"
          console.log('[Cart] Tax mode: by_state (calculated at checkout)');
        } else {
          // Disabled mode - no tax
          setTaxRate(0);
          console.log('[Cart] Tax mode: disabled');
        }
      } catch (error) {
        console.warn('[Cart] Failed to fetch settings, using fallbacks:', error);
        // On error, disable tax (safest default)
        setTaxCalculationMode('disabled');
        setTaxRate(0);
      }
    };

    fetchCartSettings();
  }, []);

  // Generate or get session ID for cart
  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return null;

    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Calculate totals using backend settings with currency conversion
  const calculateTotals = useCallback((cartItems: CartItem[]): CartTotals => {
    // 🔒 Use locked prices (priceAtAdd) if available, otherwise convert from USD
    const subtotal = cartItems.reduce((sum, item) => {
      // If priceAtAdd exists, use it directly (already in locked currency)
      // Otherwise, convert from USD (backward compatibility)
      const itemPrice = item.priceAtAdd !== undefined
        ? item.priceAtAdd
        : convertPrice(item.price, 'USD');

      return sum + itemPrice * item.quantity;
    }, 0);

    // Convert threshold and shipping cost from USD to selected currency
    const convertedThreshold = convertPrice(freeShippingThreshold, 'USD');
    const convertedShippingCost = convertPrice(standardShippingCost, 'USD');

    // Apply free shipping logic based on backend settings (with currency conversion)
    let shipping = convertedShippingCost;
    if (freeShippingEnabled && subtotal >= convertedThreshold) {
      shipping = 0;
    }

    // Apply tax based on tax_calculation_mode
    let tax = 0;
    if (taxCalculationMode === 'simple') {
      // Simple mode: apply default tax rate
      tax = subtotal * taxRate;
    } else if (taxCalculationMode === 'by_state') {
      // By-state mode: tax calculated at checkout (show 0 in cart)
      tax = 0;
    }
    // else: disabled mode - tax remains 0

    const total = subtotal + shipping + tax;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount,
    };
  }, [freeShippingEnabled, freeShippingThreshold, standardShippingCost, convertPrice, taxRate, taxCalculationMode]);

  const totals = calculateTotals(items);

  // Fetch cart from API
  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionId = getSessionId();

      if (!sessionId) return;

      const response = await axios.get(`${API_URL}/cart`, {
        headers: {
          'x-session-id': sessionId,
        },
      });

      const cart = response.data;

      // 🔒 Extract currency locking information from backend
      const hasItems = cart.items && cart.items.length > 0;
      const cartLocked = hasItems && cart.currency;

      if (cart.currency) {
        setCartCurrency(cart.currency);
      }

      // 🔒 Update currency locking state
      setIsCurrencyLocked(cartLocked);
      setExchangeRate(Number(cart.exchangeRate) || 1);
      setRateLockedAt(cart.rateLockedAt || null);

      // Only sync cart currency to selector if cart has items (currency is locked)
      // If cart is empty, respect the user's selected currency
      if (cartLocked && cart.currency !== selectedCurrency) {
        console.log(
          `[Cart] 🔒 Currency LOCKED to ${cart.currency} ` +
          `(rate: ${cart.exchangeRate}, locked at: ${cart.rateLockedAt})`
        );
        setSelectedCurrency(cart.currency);
      } else if (!hasItems) {
        console.log(`[Cart] 🔓 Cart empty - currency UNLOCKED`);
        // Reset locking state when cart is empty
        setIsCurrencyLocked(false);
        setExchangeRate(1);
        setRateLockedAt(null);
      }

      // Transform items to include slug from product and locked price fields
      const transformedItems = (cart.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        slug: item.product?.slug || item.slug || item.productId,
        brand: item.brand,
        image: item.image || item.product?.heroImage,
        price: Number(item.price),
        priceAtAdd: item.priceAtAdd ? Number(item.priceAtAdd) : undefined, // 🔒 Locked price
        currencyAtAdd: item.currencyAtAdd, // 🔒 Locked currency
        quantity: item.quantity,
        sku: item.sku,
      }));

      setItems(transformedItems);

      // Sync to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_items', JSON.stringify(transformedItems));
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.message || 'Failed to fetch cart');

      // Load from localStorage as fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cart_items');
        if (stored) {
          try {
            setItems(JSON.parse(stored));
          } catch (e) {
            console.error('Error parsing stored cart:', e);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [getSessionId]);

  // Add item to cart
  const addItem = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionId = getSessionId();

      if (!sessionId) throw new Error('No session ID');

      // Fetch product details to validate if it can be added to cart
      const productResponse = await axios.get(`${API_URL}/products/${productId}`);
      const product = productResponse.data?.data || productResponse.data;

      // Block inquiry-based products from being added to cart
      const isInquiryProduct =
        product?.purchaseType === 'INQUIRY' ||
        product?.productType === 'REAL_ESTATE' ||
        product?.productType === 'VEHICLE';

      if (isInquiryProduct) {
        const errorMessage = 'This product requires contacting the seller. It cannot be added to cart.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const response = await axios.post(
        `${API_URL}/cart/items`,
        {
          productId,
          quantity,
          variantId,
          currency: selectedCurrency // Send current selected currency
        },
        {
          headers: {
            'x-session-id': sessionId,
          },
        }
      );

      // Refresh cart after adding
      await refreshCart();
    } catch (err: any) {
      console.error('Error adding item to cart:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getSessionId, refreshCart, selectedCurrency]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return removeItem(itemId);
    }

    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );

      await axios.patch(`${API_URL}/cart/items/${itemId}`, { quantity });

      // Sync to localStorage
      if (typeof window !== 'undefined') {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        localStorage.setItem('cart_items', JSON.stringify(updatedItems));
      }
    } catch (err: any) {
      console.error('Error updating item quantity:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update quantity');
      // Revert optimistic update
      await refreshCart();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [items, refreshCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      await axios.delete(`${API_URL}/cart/items/${itemId}`);

      // Sync to localStorage
      if (typeof window !== 'undefined') {
        const updatedItems = items.filter((item) => item.id !== itemId);
        localStorage.setItem('cart_items', JSON.stringify(updatedItems));
      }
    } catch (err: any) {
      console.error('Error removing item from cart:', err);
      setError(err.response?.data?.message || err.message || 'Failed to remove item');
      // Revert optimistic update
      await refreshCart();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [items, refreshCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionId = getSessionId();

      if (!sessionId) throw new Error('No session ID');

      // Optimistic update
      setItems([]);

      await axios.delete(`${API_URL}/cart`, {
        headers: {
          'x-session-id': sessionId,
        },
      });

      // 🔓 Reset currency locking state
      setIsCurrencyLocked(false);
      setExchangeRate(1);
      setRateLockedAt(null);
      setCartCurrency('USD');

      console.log('[Cart] 🔓 Cart cleared - currency unlocked');

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart_items');
      }
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      setError(err.response?.data?.message || err.message || 'Failed to clear cart');
      // Revert optimistic update
      await refreshCart();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getSessionId, refreshCart]);

  // 🔒 Handle currency change requests
  const handleCurrencyChange = useCallback(async (newCurrency: string): Promise<{ allowed: boolean; message?: string }> => {
    // If cart is empty, allow currency change
    if (!isCurrencyLocked || items.length === 0) {
      console.log(`[Cart] ✅ Currency change allowed (cart empty): ${selectedCurrency} → ${newCurrency}`);
      return { allowed: true };
    }

    // If cart has items and currency is locked, prevent change
    if (isCurrencyLocked && items.length > 0 && newCurrency !== cartCurrency) {
      const message =
        `Your cart is locked to ${cartCurrency}. ` +
        `To change currency to ${newCurrency}, please clear your cart first.`;

      console.warn(`[Cart] 🔒 Currency change BLOCKED: Cart locked to ${cartCurrency} with ${items.length} item(s)`);

      return {
        allowed: false,
        message,
      };
    }

    // Same currency - no change needed
    return { allowed: true };
  }, [isCurrencyLocked, items.length, cartCurrency, selectedCurrency]);

  // Load cart on mount
  useEffect(() => {
    // Load from localStorage immediately
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cart_items');
      if (stored) {
        try {
          setItems(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing stored cart:', e);
        }
      }
    }

    // Then fetch from API
    refreshCart();
  }, [refreshCart]);

  // Convert threshold to selected currency for display
  const convertedThreshold = convertPrice(freeShippingThreshold, 'USD');

  const value: CartContextType = {
    items,
    totals,
    isLoading,
    error,
    freeShippingEnabled,
    freeShippingThreshold: convertedThreshold,
    taxCalculationMode,
    taxRate,
    cartCurrency,
    isCurrencyLocked,
    exchangeRate,
    rateLockedAt,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    handleCurrencyChange,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
