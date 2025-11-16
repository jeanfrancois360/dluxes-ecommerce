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
  shippingMethod: ShippingMethod | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
}

export function useCheckout() {
  const [state, setState] = useState<CheckoutState>({
    step: 'shipping',
    completedSteps: [],
    shippingAddress: null,
    shippingMethod: null,
    paymentIntentId: null,
    clientSecret: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Save shipping address
  const saveShippingAddress = useCallback(
    async (address: Address) => {
      setIsLoading(true);
      setError(null);

      try {
        // Save to backend (optional)
        // await axios.post(`${API_URL}/checkout/shipping-address`, address);

        setState((prev) => ({
          ...prev,
          shippingAddress: address,
        }));

        completeStep('shipping');
      } catch (err: any) {
        console.error('Error saving shipping address:', err);
        setError(err.response?.data?.message || err.message || 'Failed to save shipping address');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [completeStep]
  );

  // Save shipping method
  const saveShippingMethod = useCallback((method: ShippingMethod) => {
    setState((prev) => ({
      ...prev,
      shippingMethod: method,
    }));
  }, []);

  // Create payment intent
  const createPaymentIntent = useCallback(
    async (amount: number, currency: string = 'usd') => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(`${API_URL}/payments/create-intent`, {
          amount: Math.round(amount * 100), // Convert to cents
          currency,
        });

        const { clientSecret, paymentIntentId } = response.data;

        setState((prev) => ({
          ...prev,
          clientSecret,
          paymentIntentId,
        }));

        return { clientSecret, paymentIntentId };
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to create payment intent';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Process payment and create order
  const processPayment = useCallback(
    async (paymentIntentId: string, cartItems: any[], totals: any) => {
      setIsLoading(true);
      setError(null);

      try {
        // Create order
        const orderResponse = await axios.post(`${API_URL}/orders`, {
          paymentIntentId,
          shippingAddress: state.shippingAddress,
          shippingMethod: state.shippingMethod,
          items: cartItems,
          totals,
        });

        const order = orderResponse.data;
        completeStep('payment');

        return order;
      } catch (err: any) {
        console.error('Error processing payment:', err);
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to process payment';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [state.shippingAddress, state.shippingMethod, completeStep]
  );

  // Reset checkout state
  const resetCheckout = useCallback(() => {
    setState({
      step: 'shipping',
      completedSteps: [],
      shippingAddress: null,
      shippingMethod: null,
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
    shippingMethod: state.shippingMethod,
    paymentIntentId: state.paymentIntentId,
    clientSecret: state.clientSecret,
    isLoading,
    error,

    // Actions
    goToStep,
    completeStep,
    saveShippingAddress,
    saveShippingMethod,
    createPaymentIntent,
    processPayment,
    resetCheckout,
  };
}
