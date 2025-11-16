'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-black">
        <div className="min-h-screen flex flex-col">
          {/* Simple Header */}
          <header className="border-b border-neutral-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Link href="/" className="text-2xl font-serif font-bold text-black">
                Luxury Marketplace
              </Link>
            </div>
          </header>

          {/* Error Content */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-neutral-50 to-red-50 px-4 py-16">
            <div className="text-center max-w-2xl">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-8">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Heading */}
              <h1 className="text-6xl font-serif font-bold text-black mb-4">
                Critical Error
              </h1>
              <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
                Something went wrong
              </h2>

              {/* Description */}
              <p className="text-lg text-neutral-600 mb-8">
                A critical error occurred while loading the application.
                <br />
                Please try refreshing the page or contact support if the issue persists.
              </p>

              {/* Error Details */}
              {process.env.NODE_ENV === 'development' && error.message && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-xl mx-auto">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Error Details (Development Only):
                  </p>
                  <p className="text-sm text-red-700 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={reset}
                  className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-lg"
                >
                  Try Again
                </button>
                <Link
                  href="/"
                  className="px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors inline-block"
                >
                  Go Home
                </Link>
              </div>

              {/* Support */}
              <div className="mt-12 pt-8 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 mb-4">
                  Need help? Contact our support team
                </p>
                <a
                  href="mailto:support@luxury-marketplace.com"
                  className="inline-flex items-center gap-2 text-gold hover:text-[#A89968] font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  support@luxury-marketplace.com
                </a>
              </div>
            </div>
          </div>

          {/* Simple Footer */}
          <footer className="border-t border-neutral-200 bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-600">
              <p>&copy; {new Date().getFullYear()} Luxury Marketplace. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
