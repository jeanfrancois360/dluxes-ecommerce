'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Address } from '@/components/checkout/address-form';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type CheckoutStep = 'shipping' | 'payment' | 'review';

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

interface CheckoutState {
  step: CheckoutStep;
  completedSteps: CheckoutStep[];
  shippingAddress: Address | null;
  shippingAddressId: string | null;
  shippingMethod: ShippingMethod | null;
  orderId: string | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
}

export function useCheckout() {
  const [state, setState] = useState<CheckoutState>({
    step: 'shipping',
    completedSteps: [],
    shippingAddress: null,
    shippingAddressId: null,
    shippingMethod: null,
    orderId: null,
    paymentIntentId: null,
    clientSecret: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }, []);

  // Navigate to a specific step
  const goToStep = useCallback((step: CheckoutStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  // Mark step as completed and move to next
  const completeStep = useCallback((step: CheckoutStep) => {
    setState((prev) => {
      const newCompletedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step];

      let nextStep = prev.step;
      if (step === 'shipping') nextStep = 'payment';
      if (step === 'payment') nextStep = 'review';

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        step: nextStep,
      };
    });
  }, []);

  // Save shipping address to backend
  const saveShippingAddress = useCallback(
    async (address: Address & { id?: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Please login to continue checkout');
        }

        let addressId: string;
        let savedAddress: any;

        // If address has an ID, it's an existing saved address - use it directly
        if (address.id) {
          addressId = address.id;
          savedAddress = { id: addressId, ...address };
          if (process.env.NODE_ENV === 'development') {
            console.log('✓ Using existing address:', addressId);
          }
        } else {
          // Otherwise, create a new address
          const response = await axios.post(
            `${API_URL}/addresses`,
            {
              firstName: address.firstName,
              lastName: address.lastName,
              address1: address.addressLine1,
              address2: address.addressLine2 || '',
              city: address.city,
              province: address.state,
              postalCode: address.postalCode,
              country: address.country,
              phone: address.phone || '',
              isDefault: address.saveAsDefault || false,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          savedAddress = response.data;
          addressId = savedAddress.id;
          if (process.env.NODE_ENV === 'development') {
            console.log('✓ Created new address:', addressId);
          }
        }

        setState((prev) => ({
          ...prev,
          shippingAddress: { ...address, id: addressId },
          shippingAddressId: addressId,
        }));

        completeStep('shipping');
        return savedAddress;
      } catch (err: any) {
        console.error('Error saving shipping address:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save shipping address';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [completeStep, getAuthToken]
  );

  // Save shipping method
  const saveShippingMethod = useCallback((method: ShippingMethod) => {
    setState((prev) => ({
      ...prev,
      shippingMethod: method,
    }));
  }, []);

  // Create order and then payment intent (CORRECT FLOW)
  // 🔒 UPDATED: Uses locked prices and currency from cart
  const createOrderAndPaymentIntent = useCallback(
    async (cartItems: any[], totals: any, cartCurrency?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Please login to complete your order');
        }

        if (!state.shippingAddressId) {
          throw new Error('Please provide a shipping address');
        }

        // Step 1: Validate stock for all items
        const stockErrors: string[] = [];
        for (const item of cartItems) {
          try {
            const stockResponse = await axios.get(
              `${API_URL}/inventory/status/${item.productId}`,
              {
                params: item.variantId ? { variantId: item.variantId } : undefined,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const stockData = stockResponse.data;
            if (stockData.quantity < item.quantity) {
              const available = stockData.quantity > 0
                ? `Only ${stockData.quantity} ${stockData.quantity === 1 ? 'item' : 'items'} available`
                : 'Out of stock';
              stockErrors.push(`${item.name}: ${available}`);
            }
          } catch (err: any) {
            console.error(`Error checking stock for ${item.name}:`, err);
            stockErrors.push(`${item.name}: Unable to verify stock availability`);
          }
        }

        // If there are stock errors, throw a detailed error
        if (stockErrors.length > 0) {
          const errorMessage = stockErrors.length === 1
            ? `Insufficient stock: ${stockErrors[0]}`
            : `Insufficient stock for ${stockErrors.length} item(s):\n${stockErrors.map(e => `• ${e}`).join('\n')}`;
          throw new Error(errorMessage);
        }

        // Step 2: Create order from cart items
        // 🔒 Use locked prices (priceAtAdd) from cart
        const orderItems = cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.priceAtAdd !== undefined ? item.priceAtAdd : item.price, // Use locked price
        }));

        const orderResponse = await axios.post(
          `${API_URL}/orders`,
          {
            items: orderItems,
            shippingAddressId: state.shippingAddressId,
            paymentMethod: 'STRIPE',
            notes: '',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const order = orderResponse.data.data || orderResponse.data;

        // Step 3: Create payment intent with orderId
        // Convert Decimal to number and ensure it's valid
        const orderTotal = typeof order.total === 'object' && order.total !== null
          ? parseFloat(order.total.toString())
          : parseFloat(order.total);

        if (isNaN(orderTotal) || orderTotal < 0.5) {
          throw new Error(`Invalid order total: ${orderTotal}. Must be at least $0.50`);
        }

        // 🔒 Use cart's locked currency for payment
        const paymentCurrency = cartCurrency?.toLowerCase() || 'usd';

        const paymentResponse = await axios.post(
          `${API_URL}/payment/create-intent`,
          {
            amount: orderTotal,
            currency: paymentCurrency, // Use locked currency from cart
            orderId: order.id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { clientSecret, paymentIntentId, transactionId } = paymentResponse.data;

        setState((prev) => ({
          ...prev,
          orderId: order.id,
          clientSecret,
          paymentIntentId,
        }));

        return { order, clientSecret, paymentIntentId, transactionId };
      } catch (err: any) {
        console.error('Error creating order and payment intent:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize checkout';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [state.shippingAddressId, getAuthToken]
  );

  // Handle successful payment (update order status)
  const handlePaymentSuccess = useCallback(
    async (paymentIntentId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Payment was successful, order status will be updated via webhook
        // Just mark the step as complete and return the order
        completeStep('payment');

        return { orderId: state.orderId };
      } catch (err: any) {
        console.error('Error handling payment success:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to complete order';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [state.orderId, completeStep]
  );

  // Reset checkout state
  const resetCheckout = useCallback(() => {
    setState({
      step: 'shipping',
      completedSteps: [],
      shippingAddress: null,
      shippingAddressId: null,
      shippingMethod: null,
      orderId: null,
      paymentIntentId: null,
      clientSecret: null,
    });
    setError(null);
  }, []);

  return {
    // State
    step: state.step,
    completedSteps: state.completedSteps,
    shippingAddress: state.shippingAddress,
    shippingAddressId: state.shippingAddressId,
    shippingMethod: state.shippingMethod,
    orderId: state.orderId,
    paymentIntentId: state.paymentIntentId,
    clientSecret: state.clientSecret,
    isLoading,
    error,

    // Actions
    goToStep,
    completeStep,
    saveShippingAddress,
    saveShippingMethod,
    createOrderAndPaymentIntent,
    handlePaymentSuccess,
    resetCheckout,
  };
}
