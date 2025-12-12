'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-red-50 px-4 py-16">
      <div className="text-center max-w-2xl">
        <h1 className="text-[150px] sm:text-[180px] font-serif font-bold leading-none bg-gradient-to-br from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
          500
        </h1>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-black mb-4">
          Something Went Wrong
        </h2>
        <p className="text-xl text-neutral-600 mb-8">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all"
          >
            Try Again
          </button>
          <Link href="/" className="px-8 py-4 bg-[#CBB57B] text-black font-semibold rounded-lg hover:bg-[#A89968] transition-all">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
