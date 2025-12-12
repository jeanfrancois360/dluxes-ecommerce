'use client';

import Link from 'next/link';

// Prevent static generation
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-accent-50 px-4 py-16">
      <div className="text-center max-w-2xl">
        <h1 className="text-[150px] sm:text-[200px] font-serif font-bold leading-none bg-gradient-to-br from-[#CBB57B] via-[#A89968] to-[#8B7E5A] bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-black mb-6">
          Page Not Found
        </h2>
        <p className="text-xl text-neutral-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="inline-block px-8 py-4 bg-[#CBB57B] text-black font-bold rounded-xl hover:bg-[#A89968] transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
