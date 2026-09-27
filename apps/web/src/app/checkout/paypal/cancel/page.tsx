'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * PayPal Cancel Redirect Page
 *
 * The buyer cancelled payment on PayPal and was redirected here.
 * Show a message and offer to retry or return to cart.
 */
export default function PayPalCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-amber-600"
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
        </div>
        <h2 className="text-xl font-serif font-bold text-neutral-900 mb-2">Payment Cancelled</h2>
        <p className="text-neutral-600 mb-6">
          Your PayPal payment was cancelled. No charges have been made.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/checkout')}
            className="px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-semibold"
          >
            Return to Checkout
          </button>
          <Link
            href="/cart"
            className="px-6 py-3 border-2 border-neutral-200 rounded-lg hover:border-neutral-300 transition font-semibold text-neutral-700"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
