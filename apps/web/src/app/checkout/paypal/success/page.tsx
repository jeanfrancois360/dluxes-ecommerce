'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';

/**
 * PayPal Success Redirect Page
 *
 * After the buyer approves payment on PayPal, they're redirected here with:
 *   ?token=<PayPalOrderId>&PayerID=<PayerID>
 *
 * This page calls the capture endpoint to finalize the payment,
 * then redirects to the standard order success page.
 */
function PayPalSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'capturing' | 'success' | 'error'>('capturing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token'); // PayPal order ID
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing PayPal order token');
      return;
    }

    const capturePayment = async () => {
      try {
        const response = await api.post<{
          success: boolean;
          data?: { orderId: string };
          message?: string;
        }>(`/payment/paypal/capture/${token}`);

        if (response.success && response.data?.orderId) {
          setStatus('success');
          router.replace(`/checkout/success?orderId=${response.data.orderId}`);
        } else {
          // Payment may have already been captured (idempotent)
          // Check if "already captured" — still a success
          const msg = response.message || '';
          if (msg.includes('already captured') || msg.includes('already processed')) {
            setStatus('success');
            router.replace('/checkout/success');
          } else {
            setStatus('error');
            setErrorMessage(msg || 'Failed to capture PayPal payment');
          }
        }
      } catch (err: any) {
        const msg = err?.data?.message || err?.message || '';
        // "Order already captured" means the webhook or a prior call already processed it
        if (msg.includes('already captured')) {
          setStatus('success');
          router.replace('/checkout/success');
        } else {
          setStatus('error');
          setErrorMessage(msg || 'Failed to process PayPal payment');
        }
      }
    };

    capturePayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 max-w-md w-full text-center">
        {status === 'capturing' && (
          <>
            <svg
              className="animate-spin h-12 w-12 text-[#CBB57B] mx-auto mb-4"
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
            <h2 className="text-xl font-serif font-bold text-neutral-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-neutral-600">
              Finalizing your PayPal payment. Please do not close this page...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-neutral-900 mb-2">Payment Issue</h2>
            <p className="text-neutral-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/checkout')}
              className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition"
            >
              Return to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PayPalSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#CBB57B] border-t-transparent rounded-full" />
        </div>
      }
    >
      <PayPalSuccessContent />
    </Suspense>
  );
}
