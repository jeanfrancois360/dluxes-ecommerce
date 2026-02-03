'use client';

import { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/utils/toast';

interface PayPalPaymentProps {
  orderId: string;
  amount: number;
  currency: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress?: any;
  onSuccess: (paypalOrderId: string) => Promise<void>;
  onError: (error: string) => void;
  onBack?: () => void;
}

export function PayPalPayment({
  orderId,
  amount,
  currency,
  items,
  shippingAddress,
  onSuccess,
  onError,
  onBack,
}: PayPalPaymentProps) {
  const [clientId, setClientId] = useState<string>('');
  const [isLoadingClientId, setIsLoadingClientId] = useState(true);

  // Get PayPal client ID from environment (you should expose this via an API endpoint)
  useEffect(() => {
    // For now, using the client ID directly from env
    // In production, you should fetch this from your backend
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AdKthQphKNhUNoHOdzNp2rxM0a_USh28cEOUEUFpAYz0oJo36VvV1YMaCdVgfbpVQdfaEaXGR0gTLYdD';
    setClientId(paypalClientId);
    setIsLoadingClientId(false);
  }, []);

  const handleCreateOrder = async () => {
    try {
      // Create PayPal order on backend
      const response = await api.post<{ success: boolean; data: { orderId: string; approvalUrl: string } }>(
        '/payment/paypal/create-order',
        {
          orderId,
          amount,
          currency,
          items,
          shippingAddress,
        }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to create PayPal order');
      }

      return response.data.orderId; // Return PayPal order ID
    } catch (error: any) {
      console.error('PayPal order creation failed:', error);
      onError(error.message || 'Failed to create PayPal order');
      throw error;
    }
  };

  const handleApprove = async (data: any) => {
    try {
      // Capture the payment on backend
      const response = await api.post<{ success: boolean; data: { success: boolean; orderId: string; transactionId: string } }>(
        `/payment/paypal/capture/${data.orderID}`
      );

      if (!response.success || !response.data?.success) {
        throw new Error('Failed to capture PayPal payment');
      }

      toast.success('Payment successful!');
      await onSuccess(response.data.orderId);
    } catch (error: any) {
      console.error('PayPal capture failed:', error);
      onError(error.message || 'Failed to complete payment');
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };

  const handleError = (err: any) => {
    console.error('PayPal error:', err);
    onError(err.message || 'PayPal payment failed');
    toast.error('Payment failed. Please try again.');
  };

  if (isLoadingClientId) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <svg
            className="animate-spin h-12 w-12 text-gold mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
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
          <p className="text-neutral-600">Loading PayPal...</p>
        </div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-red-200 shadow-sm">
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-900 mb-2">PayPal Not Configured</h3>
          <p className="text-red-700">PayPal payments are currently unavailable. Please use card payment.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition"
            >
              Back to Payment Options
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-serif font-semibold mb-2">Pay with PayPal</h3>
        <p className="text-sm text-neutral-600">
          You'll be redirected to PayPal to complete your purchase securely
        </p>
      </div>

      <PayPalScriptProvider
        options={{
          clientId: clientId,
          currency: currency.toUpperCase(),
          intent: 'capture',
        }}
      >
        <PayPalButtons
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={handleError}
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 48,
          }}
          forceReRender={[amount, currency]}
        />
      </PayPalScriptProvider>

      {onBack && (
        <button
          onClick={onBack}
          className="w-full mt-4 px-6 py-3 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300 transition-colors"
        >
          Back to Payment Options
        </button>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Secure Payment with PayPal</p>
            <p className="text-blue-700">
              Your payment information is protected by PayPal's secure encryption. We never see or store your PayPal credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
